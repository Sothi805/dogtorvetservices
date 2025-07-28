import axiosInstance from './axios';

export interface Allergy {
  id: string;
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
    console.log('🔍 API: Getting allergies with status:', status);
    try {
      const response = await axiosInstance.get('/allergies/', {
        params: { status }
      });
      console.log('📊 API: Allergies response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Allergies error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Create new allergy
  createAllergy: async (allergyData: CreateAllergyRequest): Promise<Allergy> => {
    console.log('🔍 API: Creating allergy:', allergyData);
    try {
      const response = await axiosInstance.post('/allergies/', allergyData);
      console.log('📊 API: Create allergy response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Create allergy error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Update allergy
  updateAllergy: async (id: string, allergyData: Partial<CreateAllergyRequest>): Promise<Allergy> => {
    console.log('🔍 API: Updating allergy:', id, allergyData);
    try {
      const response = await axiosInstance.put(`/allergies/${id}`, allergyData);
      console.log('📊 API: Update allergy response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Update allergy error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Toggle allergy status (soft delete)
  toggleAllergyStatus: async (id: string): Promise<void> => {
    console.log('🔍 API: Toggling allergy status:', id);
    try {
      const response = await axiosInstance.put(`/allergies/${id}/toggle-status`);
      console.log('📊 API: Toggle allergy response:', response.data);
    } catch (error: any) {
      console.error('❌ API: Toggle allergy error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};

export default allergiesApi; 