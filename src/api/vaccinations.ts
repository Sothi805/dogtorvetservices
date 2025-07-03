import axiosInstance from './axios';

export interface Vaccination {
  id: number;
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
    const response = await axiosInstance.get('/vaccinations', {
      params: { status }
    });
    return response.data.data;
  },

  // Create new vaccination
  createVaccination: async (vaccinationData: CreateVaccinationRequest): Promise<Vaccination> => {
    const response = await axiosInstance.post('/vaccinations', vaccinationData);
    return response.data.data;
  },

  // Update vaccination
  updateVaccination: async (id: number, vaccinationData: Partial<CreateVaccinationRequest>): Promise<Vaccination> => {
    const response = await axiosInstance.put(`/vaccinations/${id}`, vaccinationData);
    return response.data.data;
  },

  // Toggle vaccination status (soft delete)
  toggleVaccinationStatus: async (id: number): Promise<void> => {
    await axiosInstance.put(`/vaccinations/${id}/toggle-status`);
  }
};

export default vaccinationsApi; 