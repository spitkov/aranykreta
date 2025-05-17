import db from '$lib/server/database';
import { error, fail } from '@sveltejs/kit';

export function load({ params }) {
  const eventId = parseInt(params.id, 10);
  if (isNaN(eventId)) {
    throw error(400, 'Érvénytelen esemény azonosító');
  }

  // Get event details
  const event = db.prepare(`
    SELECT id, name, description, category, created_at, max_votes_per_code
    FROM events 
    WHERE id = ?
  `).get(eventId);

  if (!event) {
    throw error(404, 'Esemény nem található');
  }

  // Get event stats
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT et.teacher_id) as teacher_count,
      COUNT(DISTINCT ec.class_id) as class_count,
      COUNT(DISTINCT c.id) as code_count,
      COUNT(DISTINCT v.id) as vote_count
    FROM events e
    LEFT JOIN event_teachers et ON e.id = et.event_id
    LEFT JOIN event_classes ec ON e.id = ec.event_id
    LEFT JOIN codes c ON e.id = c.event_id
    LEFT JOIN votes v ON e.id = v.event_id
    WHERE e.id = ?
  `).get(eventId);

  // Get teachers associated with this event
  const teachersRaw = db.prepare(`
    SELECT t.id, t.name
    FROM teachers t
    JOIN event_teachers et ON t.id = et.teacher_id
    WHERE et.event_id = ?
    ORDER BY t.name
  `).all(eventId);

  const teachers = teachersRaw.map(teacher => {
    const studentCountRecord = db.prepare(`
      SELECT students_taught_count 
      FROM event_teacher_student_counts
      WHERE event_id = ? AND teacher_id = ?
    `).get(eventId, teacher.id);
    return {
      ...teacher,
      students_taught_count: studentCountRecord?.students_taught_count || 0
    };
  });

  // Get classes with student counts and participation stats
  const classesRaw = db.prepare(`
    SELECT 
      c.id,
      c.grade,
      c.section,
      c.category,
      ec.student_count,
      COUNT(codes.id) as code_count,
      SUM(codes.used) as used_count
    FROM classes c
    JOIN event_classes ec ON c.id = ec.class_id
    LEFT JOIN codes ON codes.event_id = ec.event_id AND codes.class_id = c.id
    WHERE ec.event_id = ?
    GROUP BY c.id
    ORDER BY c.grade, c.section
  `).all(eventId);

  const classes = classesRaw.map(classData => {
    const codes = db.prepare(`
      SELECT 
        c.code, 
        c.used,
        (CASE 
          WHEN c.used = 1 THEN (
            SELECT GROUP_CONCAT(t.name, ', ') 
            FROM votes v 
            JOIN teachers t ON v.teacher_id = t.id 
            WHERE v.event_id = c.event_id AND v.code = c.code
          )
          ELSE NULL 
        END) as voted_teachers_names
      FROM codes c
      WHERE c.event_id = ? AND c.class_id = ?
      ORDER BY c.code
    `).all(eventId, classData.id);
    return { ...classData, codes };
  });

  return {
    event,
    stats,
    teachers,
    classes
  };
}

// Action to update student counts
export const actions = {
  updateClass: async ({ request }) => {
    const formData = await request.formData();
    const eventId = parseInt(formData.get('eventId'), 10);
    const classId = parseInt(formData.get('classId'), 10);
    const studentCount = parseInt(formData.get('studentCount'), 10);

    if (isNaN(eventId) || isNaN(classId) || isNaN(studentCount) || studentCount < 0) {
      return fail(400, {
        success: false,
        message: 'Érvénytelen adatok'
      });
    }

    try {
      db.prepare(`
        UPDATE event_classes 
        SET student_count = ? 
        WHERE event_id = ? AND class_id = ?
      `).run(studentCount, eventId, classId);

      return {
        success: true,
        message: 'Osztály létszám frissítve'
      };
    } catch (error) {
      console.error('Error updating class:', error);
      return fail(500, {
        success: false,
        message: 'Adatbázis hiba történt a frissítés során'
      });
    }
  },

  generateCodes: async ({ request }) => {
    const formData = await request.formData();
    const eventId = parseInt(formData.get('eventId'), 10);
    const classId = parseInt(formData.get('classId'), 10);

    if (isNaN(eventId) || isNaN(classId)) {
      return fail(400, {
        success: false,
        message: 'Érvénytelen adatok'
      });
    }

    try {
      // Get student count for this class
      const eventClass = db.prepare(`
        SELECT student_count 
        FROM event_classes 
        WHERE event_id = ? AND class_id = ?
      `).get(eventId, classId);

      if (!eventClass) {
        return fail(404, {
          success: false,
          message: 'Osztály nem található ehhez az eseményhez'
        });
      }
      
      if (eventClass.student_count === 0) {
        return fail(400, {
            success: false,
            message: 'Nem lehet kódokat generálni 0 fős osztályhoz.'
        });
      }

      // Check how many codes we already have
      const existingCodesResult = db.prepare(`
        SELECT COUNT(*) as count
        FROM codes
        WHERE event_id = ? AND class_id = ?
      `).get(eventId, classId);
      const existingCodeCount = existingCodesResult.count;

      if (existingCodeCount >= eventClass.student_count) {
        return fail(400, {
          success: false,
          message: 'Már van elegendő vagy több kód generálva ehhez az osztályhoz a jelenlegi létszám alapján.'
        });
      }

      // Get class details for code prefix
      const classDetails = db.prepare(`
        SELECT grade, section
        FROM classes
        WHERE id = ?
      `).get(classId);

      // Generate codes
      const prefix = `${classDetails.grade}${classDetails.section}`;
      const codesToGenerate = eventClass.student_count - existingCodeCount; // Calculate how many new codes to generate
      const generatedCodesList = []; // To keep track of newly generated codes for the message
      
      db.exec('BEGIN TRANSACTION');

      for (let i = 0; i < codesToGenerate; i++) { // Loop for the number of new codes needed
        // Generate a random 4-digit code with prefix
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const fullCode = `${prefix}-${randomCode}`;
        
        // Insert the code
        db.prepare(`
          INSERT INTO codes (event_id, class_id, code, used)
          VALUES (?, ?, ?, 0)
        `).run(eventId, classId, fullCode);
        
        generatedCodesList.push(fullCode);
      }

      db.exec('COMMIT');

      return {
        success: true,
        message: `${generatedCodesList.length} új kód sikeresen generálva. Összesen ${existingCodeCount + generatedCodesList.length} kód van ehhez az osztályhoz.`, // Updated message
        generatedClass: classId
      };
    } catch (error) {
      db.exec('ROLLBACK');
      console.error('Error generating codes:', error);
      return fail(500, {
        success: false,
        message: 'Adatbázis hiba történt a kódok generálása során'
      });
    }
  },

  setAllDefaults: async ({ request }) => {
    const formData = await request.formData();
    const eventId = parseInt(formData.get('eventId'), 10);

    if (isNaN(eventId)) {
      return fail(400, {
        success: false,
        message: 'Érvénytelen esemény azonosító.'
      });
    }

    try {
      db.exec('BEGIN TRANSACTION');

      const classes = db.prepare('SELECT class_id FROM event_classes WHERE event_id = ?').all(eventId);
      let studentCountsUpdated = 0;
      let codesGeneratedForClasses = 0;
      let codesSkippedForClasses = 0;

      for (const eventClass of classes) {
        const classId = eventClass.class_id;

        // Set student count to 30
        db.prepare('UPDATE event_classes SET student_count = 30 WHERE event_id = ? AND class_id = ?')
          .run(eventId, classId);
        studentCountsUpdated++;

        // Check if codes already exist
        const existingCodes = db.prepare('SELECT COUNT(*) as count FROM codes WHERE event_id = ? AND class_id = ?')
                                .get(eventId, classId);

        if (existingCodes.count === 0) {
          // Get class details for code prefix
          const classDetails = db.prepare('SELECT grade, section FROM classes WHERE id = ?').get(classId);
          const prefix = `${classDetails.grade}${classDetails.section}`;
          
          for (let i = 0; i < 30; i++) {
            // Generate a random 4-digit code with prefix
            // Ensure uniqueness within this batch and globally (though global check is harder without more queries)
            // For now, simple random; in a high-load system, a more robust generation/check might be needed.
            let fullCode;
            let attempts = 0;
            do {
              const randomCode = Math.floor(1000 + Math.random() * 9000);
              fullCode = `${prefix}-${randomCode}`;
              attempts++;
              if (attempts > 10) throw new Error(`Could not generate unique code for class ${classId} after 10 attempts`);
            } while (db.prepare('SELECT COUNT(*) as count FROM codes WHERE code = ?').get(fullCode).count > 0);
            
            db.prepare('INSERT INTO codes (event_id, class_id, code, used) VALUES (?, ?, ?, 0)')
              .run(eventId, classId, fullCode);
          }
          codesGeneratedForClasses++;
        } else {
          codesSkippedForClasses++;
        }
      }

      db.exec('COMMIT');
      return {
        success: true,
        message: `Alapbeállítások alkalmazva. ${studentCountsUpdated} osztály létszáma 30-ra állítva. ${codesGeneratedForClasses} osztályhoz kódok generálva. ${codesSkippedForClasses} osztályhoz a kódgenerálás kihagyva (már léteztek kódok).`
      };

    } catch (error) {
      db.exec('ROLLBACK');
      console.error('Error setting default student counts and generating codes:', error);
      return fail(500, {
        success: false,
        message: 'Hiba történt az alapbeállítások alkalmazása közben: ' + error.message
      });
    }
  },

  updateAllTeacherStudentCounts: async ({ request }) => {
    const formData = await request.formData();
    const eventId = parseInt(formData.get('eventId'), 10);
    const teacherIdsRaw = formData.getAll('teacherIds');
    const studentsTaughtCountsRaw = formData.getAll('studentsTaughtCounts');

    if (isNaN(eventId)) {
      return fail(400, {
        success: false,
        message: 'Érvénytelen esemény azonosító.',
        formName: 'teacherStudentCounts'
      });
    }

    if (teacherIdsRaw.length !== studentsTaughtCountsRaw.length) {
      return fail(400, {
        success: false,
        message: 'A tanár azonosítók és diáklétszámok száma nem egyezik.',
        formName: 'teacherStudentCounts'
      });
    }

    const updates = [];
    for (let i = 0; i < teacherIdsRaw.length; i++) {
      const teacherId = parseInt(teacherIdsRaw[i], 10);
      const studentsTaughtCount = parseInt(studentsTaughtCountsRaw[i], 10);
      if (isNaN(teacherId) || isNaN(studentsTaughtCount) || studentsTaughtCount < 0) {
        return fail(400, {
          success: false,
          message: `Érvénytelen adat a(z) ${i + 1}. tanárnál (ID: ${teacherIdsRaw[i]}). Diáklétszám nem lehet negatív.`,
          formName: 'teacherStudentCounts'
        });
      }
      updates.push({ teacherId, studentsTaughtCount });
    }

    try {
      db.transaction(() => {
        for (const update of updates) {
          db.prepare(`
            INSERT INTO event_teacher_student_counts (event_id, teacher_id, students_taught_count)
            VALUES (?, ?, ?)
            ON CONFLICT(event_id, teacher_id) DO UPDATE SET students_taught_count = excluded.students_taught_count
          `).run(eventId, update.teacherId, update.studentsTaughtCount);
        }
      })();

      return {
        success: true,
        message: 'Az összes tanár diáklétszáma sikeresen frissítve.',
        formName: 'teacherStudentCounts'
      };
    } catch (error) {
      console.error('Error updating all teacher student counts:', error);
      return fail(500, {
        success: false,
        message: 'Adatbázis hiba történt a tanári diáklétszámok frissítése során.',
        formName: 'teacherStudentCounts'
      });
    }
  }
}; 