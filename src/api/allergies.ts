import axiosInstance from './axios';

export interface Allergy {
  id: number;
  name: string;
  description: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAllergyRequest {
  name: string;
  description: string;
  status?: boolean;
}

export const allergiesApi = {
  // Get all allergies with filtering
  getAllergies: async (status: 'active' | 'inactive' | 'all' = 'active'): Promise<Allergy[]> => {
    const response = await axiosInstance.get('/allergies', {
      params: { status }
    });
    return response.data.data;
  },

  // Create new allergy
  createAllergy: async (allergyData: CreateAllergyRequest): Promise<Allergy> => {
    const response = await axiosInstance.post('/allergies', allergyData);
    return response.data.data;
  },

  // Update allergy
  updateAllergy: async (id: number, allergyData: Partial<CreateAllergyRequest>): Promise<Allergy> => {
    const response = await axiosInstance.put(`/allergies/${id}`, allergyData);
    return response.data.data;
  },

  // Toggle allergy status (soft delete)
  toggleAllergyStatus: async (id: number): Promise<void> => {
    await axiosInstance.put(`/allergies/${id}/toggle-status`);
  }
};

export default allergiesApi; 