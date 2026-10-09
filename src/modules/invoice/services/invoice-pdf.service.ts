import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  async generatePdf(htmlContent: string): Promise<Buffer> {
    let browser: puppeteer.Browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // We set the content of the page to our compiled HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0', // Wait until all resources are loaded
      });

      // Emulate print media type
      await page.emulateMediaType('print');

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Print CSS backgrounds
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Failed to generate PDF', error.stack);
      throw new InternalServerErrorException('PDF generation failed');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
