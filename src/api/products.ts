import axiosInstance from './axios';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  sku?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  price_min?: number;
  price_max?: number;
  stock_min?: number;
  stock_max?: number;
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  sku?: string;
  status?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

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

export const productsApi = {
  // Get all products with optional filters
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/products/?${params.toString()}`);
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id: string, include?: string): Promise<Product> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/products/${id}${params}`);
    return response.data.data;
  },

  // Create new product
  createProduct: async (productData: CreateProductRequest): Promise<Product> => {
    const response = await axiosInstance.post('/products/', productData);
    return response.data.data;
  },

  // Update existing product
  updateProduct: async (id: string, productData: UpdateProductRequest): Promise<Product> => {
    const response = await axiosInstance.put(`/products/${id}`, productData);
    return response.data.data;
  },

  // Delete product (soft delete)
  deleteProduct: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`);
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const response = await productsApi.getProducts({
      category,
      sort_by: 'name',
      sort_order: 'asc'
    });
    return response.data;
  },

  // Get low stock products
  getLowStockProducts: async (threshold: number = 10): Promise<Product[]> => {
    const response = await productsApi.getProducts({
      stock_max: threshold,
      sort_by: 'stock_quantity',
      sort_order: 'asc'
    });
    return response.data;
  }
};

export default productsApi; 