import axiosInstance from './axios';

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  duration_minutes: number;
  service_type: 'consultation' | 'vaccination' | 'surgery' | 'grooming' | 'emergency' | 'other';
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFilters {
  service_type?: string;
  price_min?: number;
  price_max?: number;
  duration_min?: number;
  duration_max?: number;
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  service_type: 'consultation' | 'vaccination' | 'surgery' | 'grooming' | 'emergency' | 'other';
  status?: boolean;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {}

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

export const servicesApi = {
  // Get all services with optional filters
  getServices: async (filters?: ServiceFilters): Promise<PaginatedResponse<Service>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/services?${params.toString()}`);
    return response.data;
  },

  // Get single service by ID
  getService: async (id: number, include?: string): Promise<Service> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/services/${id}${params}`);
    return response.data.data;
  },

  // Create new service
  createService: async (serviceData: CreateServiceRequest): Promise<Service> => {
    const response = await axiosInstance.post('/services', serviceData);
    return response.data.data;
  },

  // Update existing service
  updateService: async (id: number, serviceData: UpdateServiceRequest): Promise<Service> => {
    const response = await axiosInstance.put(`/services/${id}`, serviceData);
    return response.data.data;
  },

  // Delete service (soft delete)
  deleteService: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/services/${id}`);
  },

  // Get services by type
  getServicesByType: async (serviceType: Service['service_type']): Promise<Service[]> => {
    const response = await servicesApi.getServices({
      service_type: serviceType,
      sort_by: 'name',
      sort_order: 'asc'
    });
    return response.data;
  },

  // Get vaccination services
  getVaccinationServices: async (): Promise<Service[]> => {
    return await servicesApi.getServicesByType('vaccination');
  }
};

export default servicesApi; 