import axiosInstance from './axios';

export interface Client {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  other_contact_info?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  pets?: Array<{
    id: string;
    name: string;
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    total: number;
  }>;
  appointments?: Array<{
    id: string;
    appointment_date: string;
    service?: {
      name: string;
    };
  }>;
}

export interface ClientFilters {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface CreateClientRequest {
  name: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  other_contact_info?: string;
  status?: boolean;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: boolean;
}

export const clientsApi = {
  // Get all clients with optional filters
  getClients: async (filters?: ClientFilters): Promise<Client[]> => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.skip !== undefined) {
        params.append('skip', filters.skip.toString());
      }
      if (filters?.limit !== undefined) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.search !== undefined) {
        params.append('search', filters.search);
      }
      
      const queryString = params.toString();
      const url = `/clients${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔄 Fetching clients from:', url);
      const response = await axiosInstance.get(url);
      console.log('✅ Clients response:', response.data);
      
      // The axios interceptor already extracts the data from APIResponse
      // So response.data should be the actual clients array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      throw error;
    }
  },

  // Get single client by ID
  getClient: async (id: string): Promise<Client> => {
    try {
      console.log('🔄 Fetching client:', id);
      const response = await axiosInstance.get(`/clients/${id}`);
      console.log('✅ Client response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      throw error;
    }
  },

  // Create new client
  createClient: async (clientData: CreateClientRequest): Promise<Client> => {
    try {
      console.log('🔄 Creating client:', clientData);
      const response = await axiosInstance.post('/clients', clientData);
      console.log('✅ Client created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating client:', error);
      throw error;
    }
  },

  // Update existing client
  updateClient: async (id: string, clientData: UpdateClientRequest): Promise<Client> => {
    try {
      console.log('🔄 Updating client:', id, clientData);
      const response = await axiosInstance.put(`/clients/${id}`, clientData);
      console.log('✅ Client updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating client:', error);
      throw error;
    }
  },

  // Delete client (soft delete)
  deleteClient: async (id: string): Promise<void> => {
    try {
      console.log('🔄 Deleting client:', id);
      await axiosInstance.delete(`/clients/${id}`);
      console.log('✅ Client deleted');
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      throw error;
    }
  },

  // Get clients with pets
  getClientsWithPets: async (): Promise<Client[]> => {
    return await clientsApi.getClients({ skip: 0, limit: 100 });
  },

  // Search clients
  searchClients: async (searchTerm: string): Promise<Client[]> => {
    return await clientsApi.getClients({ search: searchTerm });
  }
};

export default clientsApi; 