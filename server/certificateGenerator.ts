import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function generateCertificatePDF(
  questionCount: number,
  userName: string,
  score: number
): Promise<Buffer> {
  const percentage = Math.round((score / questionCount) * 100);
  
  // Determine which certificate template to use
  const templateName = questionCount === 50 ? 'E50_Safety_Certificate.pdf' : 'E100SafetyCert.pdf';
  const templatePath = path.join(process.cwd(), 'client', 'public', templateName);
  
  // Read the template PDF
  const pdfBytes = fs.readFileSync(templatePath);
  
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  const { width, height } = firstPage.getSize();
  
  // Add the user's name centered on the line just below "Awarded to"
  const nameWidth = userName.length * 5.5; // Approximate character width at size 18
  firstPage.drawText(userName.toUpperCase(), {
    x: width / 2 - nameWidth / 2,
    y: height * 0.55,
    size: 18,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  // Add the score percentage (where the blank % is)
  firstPage.drawText(percentage.toString(), {
    x: width / 2 + 50,
    y: height * 0.62,
    size: 14,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica'),
  });
  
  // Add the date of issue
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  firstPage.drawText(dateStr, {
    x: 120,
    y: height * 0.15,
    size: 12,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica'),
  });
  
  // Save and return the PDF as a buffer
  const pdfBytesOutput = await pdfDoc.save();
  return Buffer.from(pdfBytesOutput);
}
