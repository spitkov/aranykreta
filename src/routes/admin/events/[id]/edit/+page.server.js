import db from '$lib/server/database';
import { error, fail, redirect } from '@sveltejs/kit';

export async function load({ params }) {
  const eventId = parseInt(params.id, 10);
  if (isNaN(eventId)) {
    throw error(400, 'Érvénytelen esemény azonosító');
  }

  const event = db.prepare('SELECT id, name, description, max_votes_per_code FROM events WHERE id = ?').get(eventId);
  if (!event) {
    throw error(404, 'Esemény nem található');
  }

  const eventTeachers = db.prepare('SELECT t.name FROM teachers t JOIN event_teachers et ON t.id = et.teacher_id WHERE et.event_id = ? ORDER BY t.name').all(eventId);
  const teacherNames = eventTeachers.map(t => t.name).join('\n');

  return {
    event,
    teacherNames // Pass as a string for the textarea
  };
}

export const actions = {
  default: async ({ request, params }) => {
    const eventId = parseInt(params.id, 10);
    if (isNaN(eventId)) {
      throw error(400, 'Érvénytelen esemény azonosító');
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const teacherNamesRaw = formData.get('teacherNames');
    const maxVotesPerCodeRaw = formData.get('max_votes_per_code');

    const errors = {};
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.name = ['Az esemény neve kötelező.'];
    }

    const teacherList = teacherNamesRaw?.split('\n').map(name => name.trim()).filter(name => name !== '') || [];
    if (teacherList.length === 0) {
      errors.teacherNames = ['Legalább egy tanár nevét meg kell adni.'];
    }

    const maxVotesPerCode = parseInt(maxVotesPerCodeRaw, 10);
    if (isNaN(maxVotesPerCode) || maxVotesPerCode < 1) {
      errors.max_votes_per_code = ['Az engedélyezett szavazatok számának legalább 1-nek kell lennie.'];
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        error: true,
        message: 'Kérjük, javítsa a hibákat.',
        errors,
        data: { name, description, teacherNames: teacherNamesRaw, max_votes_per_code: maxVotesPerCodeRaw }
      });
    }

    try {
      db.exec('BEGIN TRANSACTION');

      // Update event details
      db.prepare(
        'UPDATE events SET name = ?, description = ?, max_votes_per_code = ? WHERE id = ?'
      ).run(name.trim(), description?.trim() || null, maxVotesPerCode, eventId);

      // Update teachers: Delete existing, then add current list (simplest way to handle changes)
      db.prepare('DELETE FROM event_teachers WHERE event_id = ?').run(eventId);
      for (const teacherName of teacherList) {
        let teacher = db.prepare('SELECT id FROM teachers WHERE name = ?').get(teacherName);
        if (!teacher) {
          const result = db.prepare('INSERT INTO teachers (name) VALUES (?)').run(teacherName);
          teacher = { id: result.lastInsertRowid };
        }
        db.prepare('INSERT INTO event_teachers (event_id, teacher_id) VALUES (?, ?)').run(eventId, teacher.id);
      }
      
      // Note: event_classes are not managed here, assuming they are handled separately or default on creation.

      db.exec('COMMIT');
    } catch (dbError) {
      db.exec('ROLLBACK');
      console.error('Error updating event:', dbError);
      return fail(500, {
        error: true,
        message: 'Adatbázis hiba történt az esemény frissítésekor.',
        errors: { database: ['Adatbázis hiba: ' + dbError.message] },
        data: { name, description, teacherNames: teacherNamesRaw, max_votes_per_code: maxVotesPerCodeRaw }
      });
    }

    // If we reached here, the transaction was successful and committed.
    // Now, perform the redirect.
    throw redirect(303, `/admin/events/${eventId}`);
  }
}; 