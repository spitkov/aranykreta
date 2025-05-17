import db from '$lib/server/database';
import { error, json } from '@sveltejs/kit';

export async function GET({ params }) {
  const eventId = parseInt(params.id, 10);
  if (isNaN(eventId)) {
    throw error(400, 'Érvénytelen esemény azonosító');
  }

  const event = db.prepare('SELECT id, name FROM events WHERE id = ?').get(eventId);
  if (!event) {
    throw error(404, 'Esemény nem található');
  }

  const classesWithCodes = db.prepare(`
    SELECT 
      cl.id as class_id,
      cl.grade as class_grade,
      cl.section as class_section,
      c.code,
      c.used,
      (
        SELECT GROUP_CONCAT(t.name, ', ') 
        FROM votes v 
        JOIN teachers t ON v.teacher_id = t.id 
        WHERE v.event_id = c.event_id AND v.code = c.code
      ) as voted_teachers_names
    FROM codes c
    JOIN classes cl ON c.class_id = cl.id
    WHERE c.event_id = ?
    ORDER BY cl.grade, cl.section, c.code
  `).all(eventId);

  const exportData = {
    eventId: event.id,
    eventName: event.name,
    exportedAt: new Date().toISOString(),
    voteDetails: classesWithCodes.map(item => ({
      classInfo: `${item.class_grade}.${item.class_section}`,
      code: item.code,
      status: item.used ? 'Leadva' : 'Elérhető',
      votedFor: item.used && item.voted_teachers_names ? item.voted_teachers_names.split(', ') : []
    }))
  };

  const safeEventName = event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `event_votes_${event.id}_${safeEventName}.json`;

  return json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
} 