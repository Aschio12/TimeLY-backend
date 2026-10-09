import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { GenerateInvoiceDto } from '../dto/generate-invoice.dto';

@Injectable()
export class InvoiceTemplateService {
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers() {
    handlebars.registerHelper('formatCurrency', (cents: number) => {
      return '$' + (cents / 100).toFixed(2);
    });
    handlebars.registerHelper('multiply', (a: number, b: number) => {
      return a * b;
    });
  }

  async compileInvoiceTemplate(data: GenerateInvoiceDto): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'modules',
        'invoice',
        'templates',
        'invoice.hbs',
      );
      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateHtml);
      
      // Calculate derived fields (amount, subtotal, taxAmount, total)
      let subtotal = 0;
      const lineItemsWithAmount = data.lineItems.map(item => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
          ...item,
          amount,
        };
      });

      const taxRate = data.taxRate || 0;
      const taxAmount = Math.round(subtotal * taxRate);
      const total = subtotal + taxAmount;

      const templateData = {
        ...data,
        lineItems: lineItemsWithAmount,
        subtotal,
        taxAmount,
        total,
      };

      return template(templateData);
    } catch (error) {
      throw new InternalServerErrorException('Failed to compile invoice template: ' + error.message);
    }
  }
}
