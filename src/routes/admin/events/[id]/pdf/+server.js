import db from '$lib/server/database';
import { error } from '@sveltejs/kit';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function GET({ params, url }) {
  const eventId = parseInt(params.id, 10);
  if (isNaN(eventId)) {
    throw error(400, 'Érvénytelen esemény azonosító');
  }

  // Get event details
  const event = db.prepare('SELECT name FROM events WHERE id = ?').get(eventId);
  if (!event) {
    throw error(404, 'Esemény nem található');
  }

  // Get all classes with their codes
  const classes = db.prepare(`
    SELECT 
      c.id,
      c.grade,
      c.section,
      COUNT(codes.id) as code_count
    FROM classes c
    JOIN event_classes ec ON c.id = ec.class_id
    LEFT JOIN codes ON codes.event_id = ec.event_id AND codes.class_id = c.id
    WHERE ec.event_id = ?
    GROUP BY c.id
    HAVING code_count > 0
    ORDER BY c.grade, c.section
  `).all(eventId);

  if (classes.length === 0) {
    throw error(404, 'Nincsenek kódok ehhez az eseményhez');
  }

  // Create a PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 30,
    info: {
      Title: `Szavazókódok - ${event.name}`,
      Author: 'Votebox Rendszer',
    }
  });

  // Set response headers
  const pdfFileName = `szavazo-kodok-${eventId}-${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  
  // Pass url.origin (baseUrl) to generatePdf
  const pdfBuffer = await generatePdf(doc, event, classes, eventId, url.origin);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFileName}"`,
    }
  });
}

async function generatePdf(doc, event, classes, eventId, baseUrl) {
  // Initial setup: Buffer, promise
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Global PDF settings from user's latest file
  const codeCellHeight = 120; 
  const qrSize = 40;        
  const codesPerRow = 3;
  const codeCellWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / codesPerRow;

  // Main PDF Title
  doc.font('Helvetica-Bold').fontSize(16).text(`Szavazókódok - ${event.name}`, { align: 'center' });
  doc.moveDown(1.5); // Space after main title

  // Helper for the primary header of a class section (when it first appears on a page)
  const drawClassSectionHeader = (classInfo, pageNumForClass) => {
    doc.font('Helvetica-Bold').fontSize(12)
       .text(`${classInfo.grade}.${classInfo.section} Osztály - ${classInfo.totalCodesForClass} kód`, doc.page.margins.left, doc.page.margins.top, { underline: true });
    // Add page number for the class section on the next line
    doc.font('Helvetica-Bold').fontSize(10) 
       .text(`(${pageNumForClass}. oldal)`, doc.page.margins.left, doc.y + 2, { underline: false }); 
    doc.moveDown(2); // Space after this header complex (increased spacing a bit)
  };

  // Helper for continuation headers when a class's codes span multiple pages
  const drawContinuationClassHeader = (classInfo, pageNumForClass) => {
    const mainHeaderText = classInfo.grade + '.' + classInfo.section + ' Osztály - ' + classInfo.totalCodesForClass + ' kód';
    const pageNumText = '(' + pageNumForClass + '. oldal)';

    doc.font('Helvetica-Bold').fontSize(12)
       .text(mainHeaderText, doc.page.margins.left, doc.page.margins.top, { underline: true });
    doc.font('Helvetica-Bold').fontSize(10) 
       .text(pageNumText, doc.page.margins.left, doc.y + 2, { underline: false }); 
    doc.moveDown(2); // Space after this header complex
  };

  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const classInfo = classes[classIdx];
    const codes = db.prepare(
      'SELECT code, used FROM codes WHERE event_id = ? AND class_id = ? ORDER BY code'
    ).all(eventId, classInfo.id);

    if (codes.length === 0) continue; 

    classInfo.totalCodesForClass = codes.length; 
    let pageCounterForClass = 1; 

    // --- Start of Page and Header Logic for Current Class ---
    if (classIdx === 0) {
      // First class, starts on the first page after the main PDF title.
      drawClassSectionHeader(classInfo, pageCounterForClass);
    } else {
      // Subsequent classes ALWAYS start on a new page.
      doc.addPage();
      drawClassSectionHeader(classInfo, pageCounterForClass);
    }
    // --- End of Page and Header Logic for Current Class ---

    // --- Loop to draw code cards for the current class ---
    for (let i = 0; i < codes.length; i += codesPerRow) {
      // Check if the current row of cards will overflow the current page.
      // doc.y is the current top position for this potential row.
      if (doc.y + codeCellHeight > doc.page.height - doc.page.margins.bottom) {
        // The row will not fit. Need to add a new page for this class's content.
        doc.addPage();
        pageCounterForClass++; // Increment page number for this class.
        drawContinuationClassHeader(classInfo, pageCounterForClass); // Draw continuation header.
        // doc.y is now positioned after the continuation header at the top of the new page.
      }

      const rowCodes = codes.slice(i, i + codesPerRow);
      let currentX = doc.page.margins.left;
      const currentYForRow = doc.y; // Y position for the top of the current row of cards.

      for (const code of rowCodes) {
        // Card drawing logic (using currentX, currentYForRow) - from user's latest code
        doc.rect(currentX, currentYForRow, codeCellWidth - 5, codeCellHeight -5).stroke();
        
        doc.font('Helvetica').fontSize(8)
          .text(`${classInfo.grade}.${classInfo.section} - ${event.name}`, currentX + 5, currentYForRow + 5, { width: codeCellWidth - 15 });
        
        doc.font('Helvetica-Bold').fontSize(14)
          .text(code.code, currentX + 5, currentYForRow + 20, { width: codeCellWidth - 15, align: 'center' });
        
        const voteUrl = `${baseUrl}/${code.code}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(voteUrl, { errorCorrectionLevel: 'M', width: qrSize * 2 });
          doc.image(qrDataUrl, currentX + (codeCellWidth - 5 - qrSize) / 2, currentYForRow + 40, { fit: [qrSize, qrSize] });
        } catch (err) {
          console.error('Failed to generate QR code for URL:', voteUrl, err);
          doc.font('Helvetica').fontSize(6).fillColor('red').text('QR Hiba', currentX + 5, currentYForRow + 50, {width: codeCellWidth -15, align: 'center' });
          doc.fillColor('black'); // Reset fill color
        }
        
        doc.font('Helvetica').fontSize(7)
          .text('Szkenneld be a QR kódot vagy használd a fenti kódot az aranykreta.kig.hu oldalon.', 
                 currentX + 5, currentYForRow + 85, 
                 { width: codeCellWidth - 15, align: 'center' });
        currentX += codeCellWidth;
      }
      doc.y = currentYForRow + codeCellHeight; // Advance Y to below the row just drawn.
    }
  }

  doc.end();
  return pdfPromise; // Return the promise for the buffer
}