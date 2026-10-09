import { Module } from '@nestjs/common';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceTemplateService } from './services/invoice-template.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceTemplateService,
    InvoicePdfService,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
