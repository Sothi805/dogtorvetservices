import axiosInstance from './axios';

export interface Appointment {
  id: string;
  client_id: string;
  pet_id: string;
  service_id: string;
  veterinarian_id: string;
  appointment_date: string;
  duration_minutes?: number;
  appointment_status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  status?: boolean;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pet?: {
    id: string;
    name: string;
    species?: {
      id: string;
      name: string;
    };
    breed?: {
      id: string;
      name: string;
    };
  };
  service?: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  };
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface AppointmentFilters {
  client_id?: string;
  pet_id?: string;
  service_id?: string;
  veterinarian_id?: string;
  appointment_status?: 'scheduled' | 'completed' | 'cancelled';
  appointment_date_from?: string;
  appointment_date_to?: string;
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateAppointmentRequest {
  client_id: string;
  pet_id: string;
  service_id: string;
  veterinarian_id: string;
  appointment_date: string;
  duration_minutes?: number;
  appointment_status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  status?: boolean;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {}

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

export const appointmentsApi = {
  // Get all appointments with optional filters
  getAppointments: async (filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> => {
    console.log('🔍 API: Getting appointments with filters:', filters);
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axiosInstance.get(`/appointments/?${params.toString()}`);
      console.log('📊 API: Appointments response:', response.data);
      
      // The axios interceptor already extracts the data for paginated endpoints
      // So response.data should be the paginated response directly
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          links: response.data.links || {
            first: '',
            last: '',
            prev: null,
            next: null
          },
          meta: response.data.meta || {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 100,
            to: response.data.data.length,
            total: response.data.data.length
          }
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ API: Appointments error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Get single appointment by ID
  getAppointment: async (id: string, include?: string): Promise<Appointment> => {
    console.log('🔍 API: Getting appointment:', id, 'include:', include);
    try {
      const params = include ? `?include=${include}` : '';
      const response = await axiosInstance.get(`/appointments/${id}${params}`);
      console.log('📊 API: Single appointment response:', response.data);
      
      // The axios interceptor flattens the response, so response.data is the appointment object
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ API: Single appointment error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Create new appointment
  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
    console.log('🔍 API: Creating appointment:', appointmentData);
    try {
      const response = await axiosInstance.post('/appointments/', appointmentData);
      console.log('📊 API: Create appointment response:', response.data);
      
      // The axios interceptor flattens the response, so response.data is the appointment object
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ API: Create appointment error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Update existing appointment
  updateAppointment: async (id: string, appointmentData: UpdateAppointmentRequest): Promise<Appointment> => {
    console.log('🔍 API: Updating appointment:', id, appointmentData);
    try {
      const response = await axiosInstance.put(`/appointments/${id}`, appointmentData);
      console.log('📊 API: Update appointment response:', response.data);
      
      // The axios interceptor flattens the response, so response.data is the appointment object
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ API: Update appointment error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Delete appointment (soft delete)
  deleteAppointment: async (id: string): Promise<void> => {
    console.log('🔍 API: Deleting appointment:', id);
    try {
      const response = await axiosInstance.delete(`/appointments/${id}`);
      console.log('📊 API: Delete appointment response:', response.data);
      
      if (!response.data.success) {
        throw new Error('Failed to delete appointment');
      }
    } catch (error: any) {
      console.error('❌ API: Delete appointment error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Get appointments for today
  getTodayAppointments: async (): Promise<Appointment[]> => {
    console.log('🔍 API: Getting today appointments');
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentsApi.getAppointments({
        appointment_date_from: today,
        appointment_date_to: today,
        include: 'client,pet,service,user',
        sort_by: 'appointment_date',
        sort_order: 'asc'
      });
      console.log('📊 API: Today appointments response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Today appointments error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (days: number = 7): Promise<Appointment[]> => {
    console.log('🔍 API: Getting upcoming appointments for', days, 'days');
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      
      const response = await appointmentsApi.getAppointments({
        appointment_date_from: today.toISOString().split('T')[0],
        appointment_date_to: futureDate.toISOString().split('T')[0],
        include: 'client,pet,service,user',
        sort_by: 'appointment_date',
        sort_order: 'asc'
      });
      console.log('📊 API: Upcoming appointments response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Upcoming appointments error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Get appointments by status
  getAppointmentsByStatus: async (status: Appointment['appointment_status']): Promise<Appointment[]> => {
    console.log('🔍 API: Getting appointments by status:', status);
    try {
      const response = await appointmentsApi.getAppointments({
        appointment_status: status,
        include: 'client,pet,service,user',
        sort_by: 'appointment_date',
        sort_order: 'asc'
      });
      console.log('📊 API: Appointments by status response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Appointments by status error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};

export default appointmentsApi; 