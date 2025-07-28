import axiosInstance from './axios';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  pet_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount_percent: number;
  discount_amount?: number;
  total: number;
  // Remove payment_status since we calculate it dynamically
  notes?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string };
  pet?: { id: string; name: string };
  client_name?: string;
  pet_name?: string;
  deposit?: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  item_name: string;
  item_description?: string;
  unit_price: number | string;
  quantity: number;
  discount_percent: number | string;
  net_price: number | string;
  // Historical snapshot data
  original_service_data?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    status: boolean;
    snapshot_date: string;
  };
  original_product_data?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock_quantity?: number;
    status: boolean;
    snapshot_date: string;
  };
}

export interface InvoiceFilters {
  client_id?: string;
  pet_id?: string;
  // Remove payment_status since we calculate it dynamically
  invoice_date_from?: string;
  invoice_date_to?: string;
  search?: string;
  include_inactive?: boolean;
  include_deleted?: boolean;
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
  deposit?: number;
  // Remove payment_status since we calculate it dynamically
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
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const url = `/invoices/?${params.toString()}`;
      console.log('🔄 Fetching invoices from:', url);
      const response = await axiosInstance.get(url);
      console.log('✅ Invoices response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw error;
    }
  },

  // Get single invoice by ID
  getInvoice: async (id: string, include?: string): Promise<Invoice> => {
    try {
      const params = include ? `?include=${include}` : '';
      const url = `/invoices/${id}${params}`;
      console.log('🔄 Fetching invoice from:', url);
      const response = await axiosInstance.get(url);
      console.log('✅ Invoice response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      throw error;
    }
  },

  // Create new invoice
  createInvoice: async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
    try {
      console.log('🔄 Creating invoice:', invoiceData);
      const response = await axiosInstance.post('/invoices/', invoiceData);
      console.log('✅ Invoice created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw error;
    }
  },

  // Update existing invoice
  updateInvoice: async (id: string, invoiceData: UpdateInvoiceRequest): Promise<Invoice> => {
    try {
      console.log('🔄 Updating invoice:', id, invoiceData);
      const response = await axiosInstance.put(`/invoices/${id}`, invoiceData);
      console.log('✅ Invoice updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice (soft delete)
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      console.log('🔄 Deleting invoice:', id);
      await axiosInstance.delete(`/invoices/${id}`);
      console.log('✅ Invoice deleted');
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      throw error;
    }
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

  // Get invoices by status (now calculated dynamically)
  getInvoicesByStatus: async (status: 'pending' | 'paid' | 'empty'): Promise<Invoice[]> => {
    // Note: Status filtering is now handled on the frontend since we calculate status dynamically
    const response = await invoicesApi.getInvoices({
      sort_by: 'invoice_date',
      sort_order: 'desc'
    });
    return response.data;
  },

  // Get pending invoices
  getPendingInvoices: async (): Promise<Invoice[]> => {
    return await invoicesApi.getInvoicesByStatus('pending');
  },

  // Get empty invoices
  getEmptyInvoices: async (): Promise<Invoice[]> => {
    return await invoicesApi.getInvoicesByStatus('empty');
  },

  // Mark invoice as paid (update deposit to match total)
  markAsPaid: async (invoiceId: string): Promise<void> => {
    // Get the invoice first to get its total
    const invoice = await invoicesApi.getInvoice(invoiceId);
    if (invoice) {
      await invoicesApi.updateInvoice(invoiceId, { deposit: invoice.total });
    }
  },

  // Restore deleted invoice
  restoreInvoice: async (invoiceId: string): Promise<void> => {
    await axiosInstance.post(`/invoices/${invoiceId}/restore`);
  }
};

export default invoicesApi; 