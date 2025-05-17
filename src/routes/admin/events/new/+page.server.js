import db from '$lib/server/database';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const teacherNames = formData.get('teacherNames');
    const maxVotesPerCodeRaw = formData.get('max_votes_per_code');
    const category = formData.get('category'); // Get the selected category

    // Validation
    const errors = {};
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.name = ['Az esemény neve kötelező.'];
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      errors.category = ['Az esemény kategóriája kötelező.'];
    }
    
    if (!teacherNames || typeof teacherNames !== 'string' || teacherNames.trim() === '') {
      errors.teacherNames = ['Legalább egy tanár nevét meg kell adni.'];
    }

    // Process teacher names
    const teacherListRaw = teacherNames?.split('\n')
      .map(name => name.trim())
      .filter(name => name !== '') || [];

    // Ensure unique teacher names before processing to avoid duplicate linking
    const uniqueTeacherNames = [...new Set(teacherListRaw)];

    if (uniqueTeacherNames.length === 0) {
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
        data: { name, description, teacherNames, category, max_votes_per_code: maxVotesPerCodeRaw }
      });
    }

    let eventId;

    try {
      db.exec('BEGIN TRANSACTION');

      // 1. Create the event, now including its category
      const eventResult = db.prepare(
        'INSERT INTO events (name, description, category, max_votes_per_code) VALUES (?, ?, ?, ?)'
      ).run(name.trim(), description?.trim() || null, category, maxVotesPerCode);
      
      eventId = eventResult.lastInsertRowid;
      if (!eventId) {
        throw new Error('Failed to retrieve lastInsertRowid for event creation.');
      }

      // 2. Process teachers (create if doesn't exist and link)
      for (const teacherName of uniqueTeacherNames) {
        let teacher = db.prepare('SELECT id FROM teachers WHERE name = ?').get(teacherName);
        if (!teacher) {
          const result = db.prepare('INSERT INTO teachers (name) VALUES (?)').run(teacherName);
          teacher = { id: result.lastInsertRowid };
        }
        db.prepare('INSERT INTO event_teachers (event_id, teacher_id) VALUES (?, ?)')
          .run(eventId, teacher.id);
      }

      // 3. Link classes based on selected category
      let classesToLink;
      if (category === 'Minden Osztály') {
        classesToLink = db.prepare('SELECT id FROM classes').all();
      } else {
        // Ensure the category matches one of the defined ones for security/consistency
        if (category !== 'Felső Tagozat' && category !== 'Gimnázium') {
            throw new Error('Invalid event category selected for class linking.');
        }
        classesToLink = db.prepare('SELECT id FROM classes WHERE category = ?').all(category);
      }
      
      for (const cls of classesToLink) {
        db.prepare('INSERT INTO event_classes (event_id, class_id, student_count) VALUES (?, ?, 0)')
          .run(eventId, cls.id);
      }

      db.exec('COMMIT');

    } catch (dbError) {
      db.exec('ROLLBACK');
      console.error('Error creating event:', dbError);
      return fail(500, {
        error: true,
        message: 'Adatbázis hiba történt az esemény létrehozásakor.',
        errors: { database: ['Adatbázis hiba: ' + dbError.message] },
        data: { name, description, teacherNames, category, max_votes_per_code: maxVotesPerCodeRaw }
      });
    }

    if (eventId) {
      throw redirect(303, `/admin/events/${eventId}`);
    } else {
      return fail(500, {
        error: true,
        message: 'Esemény létrehozva, de átirányítás sikertelen (nincs eventId).',
        data: { name, description, teacherNames, category, max_votes_per_code: maxVotesPerCodeRaw }
      });
    }
  }
}; 