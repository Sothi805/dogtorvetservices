import axiosInstance from './axios';

export interface Pet {
  id: string;  // Changed from number to string to match ObjectId
  name: string;
  gender: 'male' | 'female';
  dob: string;
  species_id: string;  // Changed from number to string
  breed_id: string;    // Changed from number to string
  weight: number;
  color: string;
  medical_history?: string;
  client_id: string;   // Changed from number to string
  sterilized?: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;        // Changed from number to string
    name: string;
    email: string;
  };
  species?: {
    id: string;        // Changed from number to string
    name: string;
  };
  breed?: {
    id: string;        // Changed from number to string
    name: string;
  };
  allergies?: Array<{
    id: string;        // Changed from number to string
    name: string;
    description: string;
  }>;
  vaccinations?: Array<{
    id: string;        // Changed from number to string
    name: string;
    description: string;
    duration_months: number;
    pivot: {
      vaccination_date: string;
      next_due_date: string;
    };
  }>;
}

export interface PetFilters {
  client_id?: string;   // Changed from number to string
  species_id?: string;  // Changed from number to string
  breed_id?: string;    // Changed from number to string
  gender?: 'male' | 'female';
  search?: string;
  include_inactive?: string;
  status?: 'active' | 'inactive' | 'all';
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreatePetRequest {
  name: string;
  gender: 'male' | 'female';
  dob: string;
  species_id: string;  // Changed from number to string
  breed_id?: string | null;    // Changed from number to string, optional
  weight: number;
  color: string;
  medical_history?: string;
  client_id: string;   // Changed from number to string
  sterilized?: boolean;
  status?: boolean;
}

export interface UpdatePetRequest extends Partial<CreatePetRequest> {}

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

export const petsApi = {
  // Get all pets with optional filters
  getPets: async (filters?: PetFilters): Promise<PaginatedResponse<Pet>> => {
    console.log('🔍 API: Getting pets with filters:', filters);
    try {
      const params = new URLSearchParams();
      
      // Always add default pagination parameters
      params.append('page', (filters?.page || 1).toString());
      params.append('per_page', (filters?.per_page || 15).toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'per_page') {
            params.append(key, value.toString());
          }
        });
      }
      
      const queryString = params.toString();
      const response = await axiosInstance.get(`/pets${queryString ? `?${queryString}` : ''}`);
      console.log('📊 API: Pets response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Pets error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Get single pet by ID
  getPet: async (id: string, include?: string): Promise<Pet> => {
    console.log('🔍 API: Getting pet:', id, 'include:', include);
    try {
      const params = include ? `?include=${include}` : '';
      const response = await axiosInstance.get(`/pets/${id}${params}`);
      console.log('📊 API: Single pet response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Single pet error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Create new pet
  createPet: async (petData: CreatePetRequest): Promise<Pet> => {
    console.log('🔍 API: Creating pet:', petData);
    try {
      const response = await axiosInstance.post('/pets/', petData);
      console.log('📊 API: Create pet response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Create pet error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Update existing pet
  updatePet: async (id: string, petData: UpdatePetRequest): Promise<any> => {
    console.log('🔍 API: Updating pet:', id, petData);
    try {
      const response = await axiosInstance.put(`/pets/${id}`, petData);
      console.log('📊 API: Update pet response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Update pet error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Add allergy to pet
  addAllergy: async (petId: string, allergyId: string): Promise<void> => {
    console.log('🔍 API: Adding allergy to pet:', petId, allergyId);
    try {
      const response = await axiosInstance.post(`/pets/${petId}/allergies`, { allergy_id: allergyId });
      console.log('📊 API: Add allergy response:', response.data);
    } catch (error: any) {
      console.error('❌ API: Add allergy error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Remove allergy from pet
  removeAllergy: async (petId: string, allergyId: string): Promise<void> => {
    console.log('🔍 API: Removing allergy from pet:', petId, allergyId);
    try {
      const response = await axiosInstance.delete(`/pets/${petId}/allergies/${allergyId}`);
      console.log('📊 API: Remove allergy response:', response.data);
    } catch (error: any) {
      console.error('❌ API: Remove allergy error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Add vaccination to pet
  addVaccination: async (petId: string, vaccinationData: {
    vaccination_id: string;  // Changed from number to string
    vaccination_date: string;
    next_due_date: string;
    notes?: string;
    batch_number?: string;
    create_next_appointment?: boolean;
    appointment_time?: string;
  }): Promise<{ message: string; appointment_created: boolean }> => {
    console.log('🔍 API: Adding vaccination to pet:', petId, vaccinationData);
    try {
      const response = await axiosInstance.post(`/pets/${petId}/vaccinations`, vaccinationData);
      console.log('📊 API: Add vaccination response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Add vaccination error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Remove vaccination from pet
  removeVaccination: async (petId: string, vaccinationId: string): Promise<void> => {
    console.log('🔍 API: Removing vaccination from pet:', petId, vaccinationId);
    try {
      const response = await axiosInstance.delete(`/pets/${petId}/vaccinations/${vaccinationId}`);
      console.log('📊 API: Remove vaccination response:', response.data);
    } catch (error: any) {
      console.error('❌ API: Remove vaccination error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};

export default petsApi; 