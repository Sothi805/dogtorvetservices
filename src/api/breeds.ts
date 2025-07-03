import axiosInstance from './axios';

export interface Breed {
  id: string;
  name: string;
  species_id: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  species?: {
    id: string;
    name: string;
  };
  pets?: Array<{
    id: string;
    name: string;
  }>;
}

export interface BreedFilters {
  species_id?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateBreedRequest {
  name: string;
  species_id: string;
  status?: boolean;
}

export interface UpdateBreedRequest extends Partial<CreateBreedRequest> {}

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

export const breedsApi = {
  // Get all breeds with optional filters
  getBreeds: async (filters?: BreedFilters): Promise<PaginatedResponse<Breed>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/breeds?${params.toString()}`);
    return response.data;
  },

  // Get all breeds as simple array (for dropdowns)
  getBreedsArray: async (speciesId?: string): Promise<Breed[]> => {
    const filters: BreedFilters = { per_page: 100 };  // Backend max limit is 100
    if (speciesId) filters.species_id = speciesId;
    
    const paginatedResponse = await breedsApi.getBreeds(filters);
    return paginatedResponse.data;
  },

  // Get breeds by species
  getBreedsBySpecies: async (speciesId: string): Promise<Breed[]> => {
    return await breedsApi.getBreedsArray(speciesId);
  },

  // Get single breed by ID
  getBreed: async (id: string, include?: string): Promise<Breed> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/breeds/${id}${params}`);
    return response.data.data;
  },

  // Create new breed
  createBreed: async (breedData: CreateBreedRequest): Promise<Breed> => {
    const response = await axiosInstance.post('/breeds', breedData);
    return response.data;
  },

  // Update existing breed
  updateBreed: async (id: string, breedData: UpdateBreedRequest): Promise<Breed> => {
    const response = await axiosInstance.put(`/breeds/${id}`, breedData);

    return response.data;
  },

  // Delete breed (soft delete)
  deleteBreed: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/breeds/${id}`);
  },

  // Get breeds with status filtering (for table display)
  getBreedsWithStatus: async (status: 'active' | 'inactive' | 'all' = 'active', speciesId?: string): Promise<Breed[]> => {
    const params = new URLSearchParams();
    params.append('status', status);
    params.append('per_page', '100');
    
    if (speciesId && speciesId !== 'all') {
      params.append('species_id', speciesId);
    }
    
    const response = await axiosInstance.get(`/breeds?${params.toString()}`);
    return response.data.data;  // Backend returns { data: [...breeds...], meta: {...}, links: {...} }
  }
};

export default breedsApi; 