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
  breed_id: string;    // Changed from number to string
  weight: number;
  color: string;
  medical_history?: string;
  client_id: string;   // Changed from number to string
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
    return response.data;
  },

  // Get single pet by ID
  getPet: async (id: string, include?: string): Promise<Pet> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/pets/${id}${params}`);
    return response.data.data;
  },

  // Create new pet
  createPet: async (petData: CreatePetRequest): Promise<Pet> => {
    const response = await axiosInstance.post('/pets', petData);
    return response.data.data;
  },

  // Update existing pet
  updatePet: async (id: string, petData: UpdatePetRequest): Promise<any> => {
    const response = await axiosInstance.put(`/pets/${id}`, petData);
    return response.data;
  },



  // Add allergy to pet
  addAllergy: async (petId: string, allergyId: string): Promise<void> => {
    await axiosInstance.post(`/pets/${petId}/allergies`, { allergy_id: allergyId });
  },

  // Remove allergy from pet
  removeAllergy: async (petId: string, allergyId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/allergies/${allergyId}`);
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
    const response = await axiosInstance.post(`/pets/${petId}/vaccinations`, vaccinationData);
    return response.data;
  },

  // Remove vaccination from pet
  removeVaccination: async (petId: string, vaccinationId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/vaccinations/${vaccinationId}`);
  }
};

export default petsApi; 