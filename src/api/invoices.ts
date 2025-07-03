import axiosInstance from './axios';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  pet_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number | string;
  discount_percent: number | string;
  total: number | string;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  pet?: {
    id: string;
    name: string;
    species?: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: 'service' | 'product';
  service_id?: number;
  product_id?: number;
  item_name: string;
  item_description?: string;
  unit_price: number | string;
  quantity: number;
  discount_percent: number | string;
  net_price: number | string;
}

export interface InvoiceFilters {
  client_id?: string;
  pet_id?: string;
  payment_status?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateInvoiceRequest {
  client_id: string;
  pet_id?: string;
  invoice_date: string;
  due_date?: string;
  discount_percent?: number;
  payment_status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  status?: boolean;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export const invoicesApi = {
  // Get all invoices with optional filters
  getInvoices: async (filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/invoices?${params.toString()}`);
    return response.data;
  },

  // Get single invoice by ID
  getInvoice: async (id: string, include?: string): Promise<Invoice> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/invoices/${id}${params}`);
    return response.data.data;
  },

  // Create new invoice
  createInvoice: async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await axiosInstance.post('/invoices', invoiceData);
    return response.data.data;
  },

  // Update existing invoice
  updateInvoice: async (id: string, invoiceData: UpdateInvoiceRequest): Promise<Invoice> => {
    const response = await axiosInstance.put(`/invoices/${id}`, invoiceData);
    return response.data.data;
  },

  // Delete invoice (soft delete)
  deleteInvoice: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/invoices/${id}`);
  },

  // Download invoice PDF (deprecated - will be replaced with browser print)
  downloadInvoicePDF: async (id: string): Promise<Blob> => {
    const response = await axiosInstance.get(`/invoices/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get invoice print data for browser printing
  getInvoicePrintData: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/invoices/${id}/print`);
    return response.data;
  },

  // Print invoice using browser print
  printInvoice: async (id: string): Promise<void> => {
    const printData = await invoicesApi.getInvoicePrintData(id);
    
    // Create a new window/tab for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please check popup blocker settings.');
    }

    // Generate HTML for printing
    const htmlContent = invoicesApi.generatePrintHTML(printData.print_data);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  },

  // Generate HTML content for printing
  generatePrintHTML: (printData: any): string => {
    const { clinic_info, invoice, client, pet, items, generated_at } = printData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoice.invoice_number}</title>
        <style>
          @media print {
            @page { margin: 0.5in; }
            body { print-color-adjust: exact; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #007c7c;
            margin-bottom: 5px;
          }
          .clinic-info {
            color: #666;
            margin-bottom: 10px;
          }
          .invoice-details {
            margin-bottom: 30px;
            overflow: hidden;
          }
          .invoice-info {
            float: left;
            width: 50%;
          }
          .client-info {
            float: right;
            width: 50%;
            text-align: right;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          .info-row {
            margin-bottom: 5px;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .items-table .text-right {
            text-align: right;
          }
          .totals {
            float: right;
            width: 250px;
            margin-top: 20px;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 5px 10px;
            border-bottom: 1px solid #ddd;
          }
          .totals-table .label {
            font-weight: bold;
            width: 60%;
          }
          .totals-table .amount {
            text-align: right;
            width: 40%;
          }
          .total-row {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #333 !important;
          }
          .notes {
            clear: both;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          .status {
            text-transform: capitalize;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .status.paid { background: #d4edda; color: #155724; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.overdue { background: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinic_info.name}</div>
          <div class="clinic-info">
            ${clinic_info.tagline}<br>
            ${clinic_info.address}<br>
            Phone: ${clinic_info.phone} | Email: ${clinic_info.email}
          </div>
        </div>

        <div class="invoice-details">
          <div class="invoice-info">
            <div class="section-title">Invoice Information</div>
            <div class="info-row">
              <span class="label">Invoice #:</span>
              ${invoice.invoice_number}
            </div>
            <div class="info-row">
              <span class="label">Invoice Date:</span>
              ${new Date(invoice.invoice_date).toLocaleDateString()}
            </div>
            ${invoice.due_date ? `
            <div class="info-row">
              <span class="label">Due Date:</span>
              ${new Date(invoice.due_date).toLocaleDateString()}
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="status ${invoice.payment_status}">${invoice.payment_status}</span>
            </div>
          </div>

          <div class="client-info">
            <div class="section-title">Bill To</div>
            <div class="info-row">
              <strong>${client.name}</strong>
            </div>
            <div class="info-row">
              Phone: ${client.phone_number}
            </div>
            ${client.other_contact_info && client.other_contact_info !== 'none' ? `
            <div class="info-row">
              ${client.other_contact_info}
            </div>
            ` : ''}
            ${pet ? `
            <div class="info-row" style="margin-top: 15px;">
              <strong>Pet:</strong> ${pet.name}<br>
              <strong>Species:</strong> ${pet.species?.name || 'N/A'}<br>
              <strong>Breed:</strong> ${pet.breed?.name || 'N/A'}
            </div>
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
            <tr>
              <td>
                <strong>${item.item_name}</strong>
                ${item.item_description ? `<br><small>${item.item_description}</small>` : ''}
              </td>
              <td style="text-transform: capitalize;">${item.item_type}</td>
              <td class="text-right">$${Number(item.unit_price).toFixed(2)}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${Number(item.discount_percent).toFixed(1)}%</td>
              <td class="text-right">$${Number(item.net_price).toFixed(2)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td class="label">Subtotal:</td>
              <td class="amount">$${Number(invoice.subtotal).toFixed(2)}</td>
            </tr>
            ${Number(invoice.discount_percent) > 0 ? `
            <tr>
              <td class="label">Discount (${Number(invoice.discount_percent).toFixed(1)}%):</td>
              <td class="amount">-$${(Number(invoice.subtotal) * (Number(invoice.discount_percent) / 100)).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td class="label">Total:</td>
              <td class="amount">$${Number(invoice.total).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div class="notes">
          <div class="section-title">Notes</div>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for choosing ${clinic_info.name} for your pet's healthcare needs!</p>
          <p>Generated on ${generated_at}</p>
        </div>
      </body>
      </html>
    `;
  },

  // Get invoices by payment status
  getInvoicesByStatus: async (status: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<Invoice[]> => {
    const response = await invoicesApi.getInvoices({
      payment_status: status,
      sort_by: 'invoice_date',
      sort_order: 'desc'
    });
    return response.data;
  },

  // Get pending invoices
  getPendingInvoices: async (): Promise<Invoice[]> => {
    return await invoicesApi.getInvoicesByStatus('pending');
  },

  // Get overdue invoices
  getOverdueInvoices: async (): Promise<Invoice[]> => {
    return await invoicesApi.getInvoicesByStatus('overdue');
  },

  // Mark invoice as paid
  markAsPaid: async (id: string): Promise<Invoice> => {
    return await invoicesApi.updateInvoice(id, { payment_status: 'paid' });
  },

  // Mark invoice as overdue
  markAsOverdue: async (id: string): Promise<Invoice> => {
    return await invoicesApi.updateInvoice(id, { payment_status: 'overdue' });
  }
};

export default invoicesApi; 