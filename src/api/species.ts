import axiosInstance from './axios';

export interface Species {
  id: string;
  name: string;
  description?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Breed {
  id: string;
  name: string;
  species_id: string;
  description?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  species?: Species;
}

export interface CreateSpeciesRequest {
  name: string;
  description?: string;
  status?: boolean;
}

export interface CreateBreedRequest {
  name: string;
  species_id: string;
  description?: string;
  status?: boolean;
}

export const speciesApi = {
  // Get all species
  getSpecies: async (status?: 'active' | 'inactive' | 'all'): Promise<Species[]> => {
    console.log('🔍 Calling species API');
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    const url = status && status !== 'all' ? `/species/?${params.toString()}` : '/species';
    const response = await axiosInstance.get(url);
    console.log('✅ Species API response:', response.data);
    return response.data || [];  // Axios interceptor already extracts the data
  },

  // Get single species by ID
  getSpeciesById: async (id: string): Promise<Species> => {
    const response = await axiosInstance.get(`/species/${id}`);
    return response.data;  // Axios interceptor already extracts the data
  },

  // Create new species
  createSpecies: async (speciesData: CreateSpeciesRequest): Promise<Species> => {
    const response = await axiosInstance.post('/species', speciesData);
    return response.data;  // Axios interceptor already extracts the data
  },

  // Update species
  updateSpecies: async (id: string, speciesData: Partial<CreateSpeciesRequest>): Promise<Species> => {
    const response = await axiosInstance.put(`/species/${id}`, speciesData);
    return response.data;  // Axios interceptor already extracts the data
  },

  // Delete species
  deleteSpecies: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/species/${id}`);
  },
};

export default speciesApi; 