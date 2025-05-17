import db from '$lib/server/database';
import { error } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

export async function GET({ params }) {
  const eventId = parseInt(params.id, 10);

  if (isNaN(eventId)) {
    throw error(400, 'Invalid event ID');
  }

  try {
    const event = db.prepare('SELECT name FROM events WHERE id = ?').get(eventId);
    if (!event) {
      throw error(404, 'Event not found');
    }

    const classesForEvent = db.prepare(`
      SELECT
        c.id as class_id,
        c.grade,
        c.section
      FROM classes c
      JOIN event_classes ec ON c.id = ec.class_id
      WHERE ec.event_id = ?
      ORDER BY c.grade, c.section
    `).all(eventId);

    const dataForExcel = [];
    dataForExcel.push(['Osztály', 'Szavazott Diákok']); // Headers

    for (const cls of classesForEvent) {
      const className = `${cls.grade}.${cls.section}`;

      const usedCodesCountResult = db.prepare(`
        SELECT COUNT(id) as count
        FROM codes
        WHERE event_id = ? AND class_id = ? AND used = 1
      `).get(eventId, cls.class_id);
      
      const votedStudents = usedCodesCountResult ? usedCodesCountResult.count : 0;

      dataForExcel.push([className, votedStudents]);
    }

    if (dataForExcel.length <= 1 && classesForEvent.length === 0) {
        // Only headers, no data, meaning no classes assigned or no students
        dataForExcel.push(['Nincsenek osztályok hozzárendelve az eseményhez.', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Szavazók');

    // Adjust column widths
    const colWidths = [
        { wch: 15 }, // Osztály
        { wch: 20 }, // Szavazott Diákok
    ];
    ws['!cols'] = colWidths;

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeEventName = event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `szavazok_${safeEventName}_${eventId}.xlsx`;

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error('Error generating voters XLSX:', err);
    if (err.status && err.body && typeof err.body.message === 'string') { // re-throw SvelteKit errors
        throw error(err.status, err.body.message);
    }
    throw error(500, 'Hiba történt az XLSX fájl generálása közben.');
  }
} 