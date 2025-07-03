import axiosInstance from './axios';

export interface Species {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Breed {
  id: string;
  name: string;
  species_id: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  species?: Species;
}

export interface CreateSpeciesRequest {
  name: string;
  status?: boolean;
}

export interface CreateBreedRequest {
  name: string;
  species_id: string;
  status?: boolean;
}

export const speciesApi = {
  // Get all species
  getSpecies: async (statusFilter?: 'active' | 'inactive' | 'all'): Promise<Species[]> => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'active') {
      params.append('status', statusFilter);
    }
    const queryString = params.toString();
    const response = await axiosInstance.get(`/species${queryString ? `?${queryString}` : ''}`);
    return response.data.data;
  },

  // Create new species
  createSpecies: async (speciesData: CreateSpeciesRequest): Promise<Species> => {
    const response = await axiosInstance.post('/species', speciesData);
    return response.data;  // POST response doesn't have nested data field
  },

  // Update species
  updateSpecies: async (id: string, speciesData: Partial<CreateSpeciesRequest>): Promise<Species> => {
    const response = await axiosInstance.put(`/species/${id}`, speciesData);
    return response.data;
  },

  // Delete species
  deleteSpecies: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/species/${id}`);
  },

  // NOTE: Breed operations moved to dedicated breeds.ts API file
};

export default speciesApi; 