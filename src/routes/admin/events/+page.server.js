import db from '$lib/server/database';

export function load() {
  const events = db.prepare(`
    SELECT 
      e.id, 
      e.name, 
      e.description, 
      e.created_at,
      COUNT(DISTINCT ec.class_id) as class_count,
      COUNT(DISTINCT et.teacher_id) as teacher_count,
      COUNT(DISTINCT c.id) as code_count,
      COUNT(DISTINCT v.id) as vote_count
    FROM events e
    LEFT JOIN event_classes ec ON e.id = ec.event_id
    LEFT JOIN event_teachers et ON e.id = et.event_id
    LEFT JOIN codes c ON e.id = c.event_id
    LEFT JOIN votes v ON e.id = v.event_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();

  return {
    events
  };
} 