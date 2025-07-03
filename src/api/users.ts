import axiosInstance from './axios';

export interface User {
  id: string;  // Changed from number to string to match ObjectId
  name: string;
  email: string;
  role: 'admin' | 'vet' | 'assistant';
  status: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  // Extended fields for staff management
  phone?: string;
  specialization?: string;
  today_appointments_count?: number;
  appointments?: Array<{
    id: string;  // Changed from number to string
    appointment_date: string;
    client?: {
      name: string;
    };
    pet?: {
      name: string;
    };
    service?: {
      name: string;
    };
  }>;
}

export interface UserFilters {
  role?: 'admin' | 'vet' | 'assistant';
  search?: string;
  include_inactive?: boolean;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'vet' | 'assistant';
  status?: boolean;
  phone?: string;
  specialization?: string;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {}

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

export const usersApi = {
  // Get all users with optional filters
  getUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    
    // Always add default pagination parameters
    params.append('page', (filters?.page || 1).toString());
    params.append('per_page', (filters?.per_page || 15).toString());
    
    // Only add supported parameters for users route
    if (filters?.search && filters.search.trim()) {
      params.append('search', filters.search);
    }
    
    // Note: users route only supports page, per_page, and search
    // Other parameters like role, sort_by, sort_order, include_inactive, etc. are NOT supported
    
    const queryString = params.toString();
    const url = `/users${queryString ? `?${queryString}` : ''}`;
    
    // Debug logging to see exact URL being called
    console.log('Users API URL:', url);
    console.log('Query params:', queryString);
    
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get all staff (simple array for dropdowns)
  getStaffArray: async (): Promise<User[]> => {
    const response = await usersApi.getUsers({ 
      page: 1, 
      per_page: 100  // Backend max limit is 100
    });
    return response.data;
  },

  // Get single user by ID
  getUser: async (id: string, include?: string): Promise<User> => {
    const params = include ? `?include=${include}` : '';
    const response = await axiosInstance.get(`/users/${id}${params}`);
    return response.data.data;
  },

  // Create new user (staff member)
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await axiosInstance.post('/users', userData);
    return response.data.data;
  },

  // Update existing user
  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data.data;
  },

  // Delete user (soft delete)
  deleteUser: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },

  // Get users by role
  getUsersByRole: async (role: User['role']): Promise<User[]> => {
    const response = await usersApi.getUsers({
      page: 1,
      per_page: 100  // Backend max limit is 100
      // Note: role parameter is not supported by backend, so we get all users and filter client-side
    });
    // Filter by role on the client side since backend doesn't support role parameter
    return response.data.filter(user => user.role === role);
  },

  // Get veterinarians only
  getVeterinarians: async (): Promise<User[]> => {
    return await usersApi.getUsersByRole('vet');
  },

  // Get all staff (vets + assistants, excluding admins)
  getStaff: async (): Promise<User[]> => {
    const vets = await usersApi.getUsersByRole('vet');
    const assistants = await usersApi.getUsersByRole('assistant');
    return [...vets, ...assistants].sort((a, b) => a.name.localeCompare(b.name));
  },

  // Get user's today appointments count
  getUserTodayAppointments: async (userId: string): Promise<number> => {
    try {
      // Note: appointments route doesn't support user_id or date filtering
      // So we get all recent appointments and filter client-side
      const response = await axiosInstance.get(`/appointments?page=1&per_page=100&sort_by=appointment_date&sort_order=desc`);
      
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = response.data.data.filter((appointment: any) => {
        const appointmentDate = appointment.appointment_date?.split('T')[0];
        // Handle both string and number IDs for backward compatibility
        const vetId = appointment.veterinarian_id?.toString();
        return appointmentDate === today && vetId === userId;
      });
      
      return todayAppointments.length;
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return 0;
    }
  },

  // Get users with today's appointment counts
  getUsersWithAppointmentCounts: async (filters?: UserFilters): Promise<User[]> => {
    const usersResponse = await usersApi.getUsers({
      page: 1,
      per_page: 100,  // Backend max limit is 100
      search: filters?.search // Only pass supported parameters
    });
    
    // Get appointment counts for each user
    const usersWithCounts = await Promise.all(
      usersResponse.data.map(async (user) => {
        const todayCount = await usersApi.getUserTodayAppointments(user.id);
        return {
          ...user,
          today_appointments_count: todayCount
        };
      })
    );

    return usersWithCounts;
  },

  // Generate a random secure password for new staff
  generatePassword: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  // Quick staff creation for reference data
  createStaffMember: async (name: string, role: 'vet' | 'assistant', email: string, phone?: string, specialization?: string): Promise<User> => {
    // Generate a secure password (won't be used for login anyway)
    const password = usersApi.generatePassword();
    
    return await usersApi.createUser({
      name,
      email,
      password,
      role,
      phone,
      specialization,
      status: true
    });
  }
};

export default usersApi; 