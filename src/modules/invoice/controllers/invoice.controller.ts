import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { GenerateInvoiceDto } from '../dto/generate-invoice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a PDF invoice' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF generated successfully' })
  async generateInvoice(
    @Body() generateInvoiceDto: GenerateInvoiceDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoiceService.generateInvoicePdf(generateInvoiceDto);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${generateInvoiceDto.invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
