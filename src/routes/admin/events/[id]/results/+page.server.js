import db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const eventId = parseInt(params.id, 10);
  if (isNaN(eventId)) {
    throw error(400, 'Érvénytelen esemény azonosító');
  }

  const event = db.prepare(`
    SELECT id, name, description, category, created_at 
    FROM events WHERE id = ?
  `).get(eventId);

  if (!event) {
    throw error(404, 'Esemény nem található');
  }

  // Get all teachers for this event and their vote counts
  const teacherResultsRaw = db.prepare(`
    SELECT 
      t.id,
      t.name,
      COUNT(v.id) as vote_count
    FROM teachers t
    JOIN event_teachers et ON t.id = et.teacher_id
    LEFT JOIN votes v ON t.id = v.teacher_id AND v.event_id = et.event_id
    WHERE et.event_id = ?
    GROUP BY t.id, t.name
  `).all(eventId);

  // Fetch students_taught_count for each teacher and calculate percentage
  const overallResults = teacherResultsRaw.map(teacher => {
    const studentCountRecord = db.prepare(
      `SELECT students_taught_count FROM event_teacher_student_counts WHERE event_id = ? AND teacher_id = ?`
    ).get(eventId, teacher.id);
    
    const studentsTaught = studentCountRecord?.students_taught_count || 0;
    let percentage = 0;
    if (studentsTaught > 0 && teacher.vote_count > 0) {
      percentage = Math.round((teacher.vote_count / studentsTaught) * 100);
    } else if (studentsTaught === 0 && teacher.vote_count > 0) {
      percentage = 0; // Or handle as a special case, e.g. "N/A" or 100% if any vote with 0 students taught is full participation
    }

    return {
      ...teacher,
      students_taught_count: studentsTaught,
      percentage
    };
  }).sort((a, b) => b.percentage - a.percentage || b.vote_count - a.vote_count || a.name.localeCompare(b.name)); // Sort by percentage, then votes, then name
  
  // The old stats and classByClass logic might not be relevant anymore or needs rethinking
  // For now, let's focus on the new overallResults by percentage
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

  return {
    event,
    stats,
    overallResults, // This will be the primary data for the results page
    // classByClass: [] // Removing for now, as per the new logic's focus
  };
} 