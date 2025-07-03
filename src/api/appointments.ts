import axiosInstance from './axios';

export interface Appointment {
  id: string;
  client_id: string;
  pet_id: string;
  service_id: string;
  veterinarian_id: string;
  appointment_date: string;
  duration_minutes?: number;
  appointment_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
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
  appointment_status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
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
  appointment_status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
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
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axiosInstance.get(`/appointments?${params.toString()}`);
    return response.data;
  },

  // Get single appointment by ID
  getAppointment: async (id: string, include?: string): Promise<Appointment> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/appointments/${id}${params}`);
    return response.data.data;
  },

  // Create new appointment
  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
    const response = await axiosInstance.post('/appointments', appointmentData);
    return response.data.data;
  },

  // Update existing appointment
  updateAppointment: async (id: string, appointmentData: UpdateAppointmentRequest): Promise<Appointment> => {
    const response = await axiosInstance.put(`/appointments/${id}`, appointmentData);
    return response.data.data;
  },

  // Delete appointment (soft delete)
  deleteAppointment: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/appointments/${id}`);
  },

  // Get appointments for today
  getTodayAppointments: async (): Promise<Appointment[]> => {
    const today = new Date().toISOString().split('T')[0];
    const response = await appointmentsApi.getAppointments({
      appointment_date_from: today,
      appointment_date_to: today,
      include: 'client,pet,service,user',
      sort_by: 'appointment_date',
      sort_order: 'asc'
    });
    return response.data;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (days: number = 7): Promise<Appointment[]> => {
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
    return response.data;
  },

  // Get appointments by status
  getAppointmentsByStatus: async (status: Appointment['appointment_status']): Promise<Appointment[]> => {
    const response = await appointmentsApi.getAppointments({
      appointment_status: status,
      include: 'client,pet,service,user',
      sort_by: 'appointment_date',
      sort_order: 'asc'
    });
    return response.data;
  }
};

export default appointmentsApi; 