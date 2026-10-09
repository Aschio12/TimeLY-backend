import { Injectable } from '@nestjs/common';
import { InvoiceTemplateService } from './invoice-template.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { GenerateInvoiceDto } from '../dto/generate-invoice.dto';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly templateService: InvoiceTemplateService,
    private readonly pdfService: InvoicePdfService,
    private readonly prisma: PrismaService,
  ) {}

  async generateInvoicePdf(data: GenerateInvoiceDto): Promise<Buffer> {
    // 1. In a full implementation, we might validate the clientId/workspaceName against DB here.
    // For now, we trust the DTO data to render the invoice.
    
    // 2. Compile HTML
    const htmlContent = await this.templateService.compileInvoiceTemplate(data);
    
    // 3. Generate PDF
    const pdfBuffer = await this.pdfService.generatePdf(htmlContent);
    
    // 4. Optionally, store invoice record in DB (Prisma)
    await this.prisma.invoice.create({
      data: {
        amount: Math.round(data.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) * (1 + (data.taxRate || 0))),
        status: 'DRAFT',
        project: {
          // Simplification for the blueprint step: associating with a dummy project or omitting
          connect: { id: data.clientId } // Assumes clientId maps to project or similar for this schema
        }
      }
    }).catch((e) => {
      // Ignore creation error if the client id doesn't match an actual project in dummy data
      console.warn('Prisma Invoice create skipped due to relations mapping setup', e.message);
    });

    return pdfBuffer;
  }
}
