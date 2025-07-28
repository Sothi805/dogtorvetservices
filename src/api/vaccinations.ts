import axiosInstance from './axios';

export interface Vaccination {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVaccinationRequest {
  name: string;
  description: string;
  duration_months: number;
  status?: boolean;
}

export const vaccinationsApi = {
  // Get all vaccinations with filtering
  getVaccinations: async (status: 'active' | 'inactive' | 'all' = 'active'): Promise<Vaccination[]> => {
    console.log('🔍 API: Getting vaccinations with status:', status);
    try {
      const response = await axiosInstance.get('/vaccinations/', {
        params: { status }
      });
      console.log('📊 API: Vaccinations response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Vaccinations error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Create new vaccination
  createVaccination: async (vaccinationData: CreateVaccinationRequest): Promise<Vaccination> => {
    console.log('🔍 API: Creating vaccination:', vaccinationData);
    try {
      const response = await axiosInstance.post('/vaccinations/', vaccinationData);
      console.log('📊 API: Create vaccination response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Create vaccination error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Update vaccination
  updateVaccination: async (id: string, vaccinationData: Partial<CreateVaccinationRequest>): Promise<Vaccination> => {
    console.log('🔍 API: Updating vaccination:', id, vaccinationData);
    try {
      const response = await axiosInstance.put(`/vaccinations/${id}`, vaccinationData);
      console.log('📊 API: Update vaccination response:', response.data);
      return response.data; // The interceptor already extracted the data
    } catch (error: any) {
      console.error('❌ API: Update vaccination error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Toggle vaccination status (soft delete)
  toggleVaccinationStatus: async (id: string): Promise<void> => {
    console.log('🔍 API: Toggling vaccination status:', id);
    try {
      const response = await axiosInstance.put(`/vaccinations/${id}/toggle-status`);
      console.log('📊 API: Toggle vaccination response:', response.data);
    } catch (error: any) {
      console.error('❌ API: Toggle vaccination error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};

export default vaccinationsApi; 