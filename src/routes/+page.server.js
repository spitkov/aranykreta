import db from '$lib/server/database';
import { fail, redirect } from '@sveltejs/kit';

export function load() {
  // We don't preload teachers - they will be loaded after code validation
  return {};
}

export const actions = {
  checkCode: async ({ request }) => {
    const formData = await request.formData();
    const rawCodeValue = formData.get('code')?.trim();

    if (!rawCodeValue) {
      return fail(400, {
        error: true,
        message: 'Kérjük, add meg a szavazókódot.',
        codeValue: rawCodeValue,
      });
    }

    const codeToQuery = rawCodeValue.toUpperCase(); // Convert to uppercase, DB handles case-insensitivity

    // The COLLATE NOCASE on the column definition makes this query effectively case-insensitive.
    const codeRecord = db.prepare(
      'SELECT c.code, c.used, c.event_id, c.class_id FROM codes c WHERE c.code = ?'
    ).get(codeToQuery);

    if (!codeRecord) {
      return fail(400, {
        error: true,
        message: 'Érvénytelen vagy nem található szavazókód.',
        codeValue: rawCodeValue, // Return the original raw input on error
      });
    }

    if (codeRecord.used === 1) {
      return fail(400, {
        error: true,
        message: 'Ez a szavazókód már fel lett használva.',
        codeValue: rawCodeValue, // Return the original raw input
      });
    }

    // Valid and not used, redirect to the specific code page
    throw redirect(303, `/${codeRecord.code}`); // Use codeRecord.code for the redirect
  },

  // submitVote: async ({ request }) => {
  //   const formData = await request.formData();
  //   const code = formData.get('code')?.trim();
  //   const teacherId = parseInt(formData.get('teacherId'), 10);
  //
  //   if (!code) {
  //     return fail(400, {
  //       error: true,
  //       message: 'Hiányzó szavazókód.'
  //     });
  //   }
  //
  //   if (isNaN(teacherId)) {
  //     return fail(400, {
  //       error: true,
  //       message: 'Kérjük, válassz tanárt.'
  //     });
  //   }
  //
  //   // Verify the code again
  //   const codeRecord = db.prepare(`
  //     SELECT c.code, c.used, c.event_id, c.class_id
  //     FROM codes c
  //     WHERE c.code = ?
  //   `).get(code);
  //
  //   if (!codeRecord) {
  //     return fail(400, {
  //       error: true,
  //       message: 'Érvénytelen szavazókód.'
  //     });
  //   }
  //
  //   if (codeRecord.used === 1) {
  //     return fail(400, {
  //       error: true,
  //       message: 'Ez a szavazókód már fel lett használva.'
  //     });
  //   }
  //
  //   // Verify teacher is associated with this event
  //   const teacherExists = db.prepare(`
  //     SELECT 1
  //     FROM event_teachers
  //     WHERE event_id = ? AND teacher_id = ?
  //   `).get(codeRecord.event_id, teacherId);
  //
  //   if (!teacherExists) {
  //     return fail(400, {
  //       error: true,
  //       message: 'Érvénytelen tanárválasztás.'
  //     });
  //   }
  //
  //   try {
  //     // Begin transaction
  //     db.exec('BEGIN TRANSACTION');
  //
  //     // Save the vote
  //     db.prepare(`
  //       INSERT INTO votes (event_id, code, teacher_id)
  //       VALUES (?, ?, ?)
  //     `).run(codeRecord.event_id, code, teacherId);
  //
  //     // Mark code as used
  //     db.prepare(`
  //       UPDATE codes
  //       SET used = 1
  //       WHERE code = ?
  //     `).run(code);
  //
  //     // Commit transaction
  //     db.exec('COMMIT');
  //
  //     return {
  //       success: true,
  //       message: 'Köszönjük a szavazatod!'
  //     };
  //   } catch (error) {
  //     // Rollback on error
  //     db.exec('ROLLBACK');
  //     console.error('Error submitting vote:', error);
  //
  //     return fail(500, {
  //       error: true,
  //       message: 'Hiba történt a szavazat rögzítése során. Kérjük, próbáld újra később.'
  //     });
  //   }
  // }
}; 