import { PDFDocument } from 'pdf-lib';

type PdfParseResult = {
  text: string;
  numpages: number;
};

export async function extractPDFText(input: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  
  // Try 1: Use original buffer first
  try {
    const buffer = Buffer.from(
      input.buffer,
      input.byteOffset,
      input.byteLength
    );

    const data = (await pdfParse(buffer, {
      max: 0,
    })) as PdfParseResult;

    const extractedText = data.text?.trim() || '';

    if (extractedText) {
      console.log(`Extracted ${extractedText.length} characters from ${data.numpages} page(s)`);
      return extractedText;
    }
  } catch (error) {
    console.log('PDF normalization required, processing...');
  }

  // Try 2: If original fails, try with pdf-lib normalization
  try {
    const uint8Array = new Uint8Array(input);
    
    const pdfDoc = await PDFDocument.load(uint8Array, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    
    const pdfBytes = await pdfDoc.save();
    const processedBuffer = Buffer.from(pdfBytes);
    
    const buffer = Buffer.from(
      processedBuffer.buffer,
      processedBuffer.byteOffset,
      processedBuffer.byteLength
    );

    const data = (await pdfParse(buffer, {
      max: 0,
    })) as PdfParseResult;

    const extractedText = data.text?.trim() || '';

    if (extractedText) {
      console.log(`Extracted ${extractedText.length} characters from ${data.numpages} page(s) (normalized)`);
      return extractedText;
    }
  } catch (error) {
    console.error('PDF extraction failed:', error);
  }

  throw new Error('No text content could be extracted from the PDF. This may be a scanned image or the text is embedded in a format that cannot be extracted.');
}