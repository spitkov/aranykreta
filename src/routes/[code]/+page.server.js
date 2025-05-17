import db from '$lib/server/database';
import { error, redirect, fail } from '@sveltejs/kit';

export async function load({ params }) {
  const codeValue = params.code;

  const codeRecord = db.prepare(
    'SELECT id, code, used, event_id FROM codes WHERE code = ?'
  ).get(codeValue);

  if (!codeRecord) {
    throw error(404, 'Szavazókód nem található.');
  }

  if (codeRecord.used === 1) {
    throw redirect(303, `/success?code=${codeValue}&status=already_submitted`);
  }

  const event = db.prepare(
    'SELECT id, name, description, max_votes_per_code FROM events WHERE id = ?'
  ).get(codeRecord.event_id);

  if (!event) {
    throw error(404, 'Esemény nem található ehhez a kódhoz.');
  }

  const teachers = db.prepare(`
    SELECT t.id, t.name
    FROM teachers t
    JOIN event_teachers et ON t.id = et.teacher_id
    WHERE et.event_id = ?
    ORDER BY t.name
  `).all(event.id);

  if (teachers.length === 0) {
    throw error(500, 'Nincsenek tanárok rendelve ehhez az eseményhez.');
  }
  
  return {
    code: codeRecord.code,
    event,
    teachers
  };
}

export const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    const selectedTeacherIdsRaw = formData.getAll('teacherId'); 
    const teacherIds = selectedTeacherIdsRaw.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    const codeValue = params.code;

    const eventDetails = db.prepare('SELECT max_votes_per_code FROM events e JOIN codes c ON e.id = c.event_id WHERE c.code = ?')
                           .get(codeValue);

    if (!eventDetails) {
        return fail(404, { error: true, message: 'Esemény nem található a kódhoz.', codeValue });
    }
    const maxVotes = eventDetails.max_votes_per_code;

    if (teacherIds.length === 0) {
      return fail(400, { 
        error: true, 
        message: 'Kérjük, válasszon legalább egy tanárt.', 
        codeValue 
      });
    }

    if (teacherIds.length !== maxVotes) {
      return fail(400, {
        error: true,
        message: `Kérjük, pontosan ${maxVotes} tanárt válasszon. Ön ${teacherIds.length} tanárt választott.`,
        codeValue,
        selectedTeacherIds: teacherIds
      });
    }
    
    const codeRecord = db.prepare(
      'SELECT id, code, used, event_id FROM codes WHERE code = ?'
    ).get(codeValue);

    if (!codeRecord) {
      return fail(400, {
        error: true,
        message: 'Érvénytelen szavazókód.',
        codeValue
      });
    }

    if (codeRecord.used === 1) {
      return fail(403, {
        error: true,
        message: 'Ezt a kódot már felhasználták.',
        codeValue
      });
    }
    
    for (const teacherId of teacherIds) {
        const teacherExists = db.prepare(
          'SELECT 1 FROM event_teachers WHERE event_id = ? AND teacher_id = ?'
        ).get(codeRecord.event_id, teacherId);

        if (!teacherExists) {
            return fail(400, {
                error: true,
                message: `Érvénytelen tanárválasztás (ID: ${teacherId}).`,
                codeValue
            });
        }
    }

    try {
      db.exec('BEGIN TRANSACTION');
      for (const teacherId of teacherIds) {
        db.prepare('INSERT INTO votes (event_id, code, teacher_id) VALUES (?, ?, ?)')
          .run(codeRecord.event_id, codeRecord.code, teacherId);
      }
      db.prepare('UPDATE codes SET used = 1 WHERE id = ?').run(codeRecord.id);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      console.error('Vote submission error:', e);
      return fail(500, {
        error: true,
        message: 'Hiba történt a szavazat mentésekor.',
        codeValue
      });
    }

    throw redirect(303, `/success?code=${codeValue}&status=submitted`);
  }
}; 