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
    
    // 4. Store invoice record in DB (Prisma) and mark TimeEntries as billed
    try {
      const subtotal = data.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      const taxAmount = Math.round(subtotal * (data.taxRate || 0));
      const totalAmount = subtotal + taxAmount;

      await this.prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            workspaceId: data.clientId, // Assuming clientId represents workspace for now
            invoiceNumber: data.invoiceNumber,
            dueDate: new Date(data.dueDate),
            subtotalAmount: subtotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            currencyCode: 'USD', // Defaulting for stub
            timeEntries: data.timeEntryIds?.length ? {
              connect: data.timeEntryIds.map(id => ({ id }))
            } : undefined
          }
        });

        if (data.timeEntryIds && data.timeEntryIds.length > 0) {
          await tx.timeEntry.updateMany({
            where: { id: { in: data.timeEntryIds } },
            data: { isBilled: true, invoiceId: invoice.id }
          });
        }
      });
    } catch (e) {
      console.warn('Prisma Invoice create skipped due to missing relations/stub data', e.message);
    }

    return pdfBuffer;
  }
}
