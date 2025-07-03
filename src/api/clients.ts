import axiosInstance from './axios';

export interface Client {
  id: string;  // Changed from number to string to match ObjectId
  name: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  other_contact_info?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  pets?: Array<{
    id: number;
    name: string;
  }>;
  invoices?: Array<{
    id: number;
    invoice_number: string;
    total: number;
  }>;
  appointments?: Array<{
    id: number;
    appointment_date: string;
    service?: {
      name: string;
    };
  }>;
}

export interface ClientFilters {
  gender?: 'male' | 'female' | 'other';
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateClientRequest {
  name: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  other_contact_info?: string;
  status?: boolean;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: boolean; // Explicitly include status for updates
}

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

export const clientsApi = {
  // Get all clients with optional filters
  getClients: async (filters?: ClientFilters): Promise<Client[] | PaginatedResponse<Client>> => {
    const params = new URLSearchParams();
    
    // Always add default pagination parameters
    params.append('page', (filters?.page || 1).toString());
    params.append('per_page', (filters?.per_page || 15).toString());
    
    // Only add supported parameters for clients route
    if (filters?.search && filters.search.trim()) {
      params.append('search', filters.search);
        }
    
    // Note: clients route only supports page, per_page, and search
    // Other parameters like sort_by, sort_order, gender, etc. are NOT supported
    
    const queryString = params.toString();
    const url = `/clients${queryString ? `?${queryString}` : ''}`;
    
    // Debug logging to see exact URL being called
    console.log('Clients API URL:', url);
    console.log('Query params:', queryString);
    
    const response = await axiosInstance.get(url);
    
    // Return paginated response if per_page is specified, otherwise return data array
    return filters?.per_page ? response.data : response.data.data;
  },

  // Get single client by ID
  getClient: async (id: string, include?: string): Promise<Client> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/clients/${id}${params}`);
    return response.data.data;
  },

  // Create new client
  createClient: async (clientData: CreateClientRequest): Promise<Client> => {
    const response = await axiosInstance.post('/clients', clientData);
    return response.data.data;
  },

  // Update existing client
  updateClient: async (id: string, clientData: UpdateClientRequest): Promise<Client> => {
    const response = await axiosInstance.put(`/clients/${id}`, clientData);
    return response.data.data;
  },

  // Delete client (soft delete)
  deleteClient: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/clients/${id}`);
  },

  // Get clients with pets
  getClientsWithPets: async (): Promise<Client[]> => {
    // Note: clients route doesn't support 'include' parameter, so we get basic client data
    const response = await clientsApi.getClients({ page: 1, per_page: 100 });  // Backend max limit is 100
    return Array.isArray(response) ? response : response.data;
  },

  // Search clients
  searchClients: async (searchTerm: string): Promise<Client[]> => {
    const response = await clientsApi.getClients({ search: searchTerm });
    return Array.isArray(response) ? response : response.data;
  }
};

export default clientsApi; 