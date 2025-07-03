import axiosInstance from './axios';

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
  created_at: string;
  updated_at: string;
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
  };
  service?: {
    id: number;
    name: string;
    price: number;
  };
  product?: {
    id: number;
    name: string;
    price: number;
  };
}

export interface InvoiceItemFilters {
  invoice_id?: string;
  item_type?: 'service' | 'product';
  service_id?: number;
  product_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateInvoiceItemRequest {
  invoice_id: string;
  item_type: 'service' | 'product';
  service_id?: number;
  product_id?: number;
  item_name: string;
  item_description?: string;
  unit_price: number;
  quantity: number;
  discount_percent?: number;
}

export interface UpdateInvoiceItemRequest extends Partial<Omit<CreateInvoiceItemRequest, 'invoice_id'>> {}

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

export const invoiceItemsApi = {
  // Get all invoice items with optional filters
  getInvoiceItems: async (filters?: InvoiceItemFilters): Promise<PaginatedResponse<InvoiceItem>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/invoice-items?${params.toString()}`);
    return response.data;
  },

  // Get invoice items by invoice ID
  getInvoiceItemsByInvoice: async (invoiceId: string): Promise<InvoiceItem[]> => {
    const response = await axiosInstance.get(`/invoice-items?invoice_id=${invoiceId}`);
    return response.data.data;
  },

  // Get single invoice item by ID
  getInvoiceItem: async (id: string, include?: string): Promise<InvoiceItem> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/invoice-items/${id}${params}`);
    return response.data.data;
  },

  // Create new invoice item
  createInvoiceItem: async (itemData: CreateInvoiceItemRequest): Promise<InvoiceItem> => {
    const response = await axiosInstance.post('/invoice-items', itemData);
    return response.data.data;
  },

  // Update existing invoice item
  updateInvoiceItem: async (id: string, itemData: UpdateInvoiceItemRequest): Promise<InvoiceItem> => {
    const response = await axiosInstance.put(`/invoice-items/${id}`, itemData);
    return response.data.data;
  },

  // Delete invoice item
  deleteInvoiceItem: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/invoice-items/${id}`);
  },

  // Add service to invoice
  addServiceToInvoice: async (invoiceId: string, serviceId: number, quantity: number = 1, discount?: number): Promise<InvoiceItem> => {
    // First get service details
    const serviceResponse = await axiosInstance.get(`/services/${serviceId}`);
    const service = serviceResponse.data.data;

    return await invoiceItemsApi.createInvoiceItem({
      invoice_id: invoiceId,
      item_type: 'service',
      service_id: serviceId,
      item_name: service.name,
      item_description: service.description,
      unit_price: service.price,
      quantity: quantity,
      discount_percent: discount || 0
    });
  },

  // Add product to invoice
  addProductToInvoice: async (invoiceId: string, productId: number, quantity: number = 1, discount?: number): Promise<InvoiceItem> => {
    // First get product details
    const productResponse = await axiosInstance.get(`/products/${productId}`);
    const product = productResponse.data.data;

    return await invoiceItemsApi.createInvoiceItem({
      invoice_id: invoiceId,
      item_type: 'product',
      product_id: productId,
      item_name: product.name,
      item_description: product.description,
      unit_price: product.price,
      quantity: quantity,
      discount_percent: discount || 0
    });
  }
};

export default invoiceItemsApi; 