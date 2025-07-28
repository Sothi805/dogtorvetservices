import axiosInstance from './axios';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; // Computed property for compatibility
  email: string;
  role: 'admin' | 'vet';
  status: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  specialization?: string;
  today_appointments_count?: number;
  appointments?: Array<{
    id: string;
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
  skip?: number;
  limit?: number;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

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

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'vet';
  status?: boolean;
  phone?: string;
  specialization?: string;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {}

export const usersApi = {
  // Get all users with optional filters
  getUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await axiosInstance.get(`/users/?${params.toString()}`);
    
    // Add computed name property for compatibility
    const usersWithNames = (response.data.data || []).map((user: User) => ({
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    }));
    
    return {
      data: usersWithNames,
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
        per_page: usersWithNames.length,
        to: usersWithNames.length,
        total: usersWithNames.length
      }
    };
  },

  // Get all staff (simple array for dropdowns)
  getStaffArray: async (): Promise<User[]> => {
    const response = await usersApi.getUsers({ per_page: 100 });
    return response.data;
  },

  // Get single user by ID
  getUser: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`/users/${id}`);
    const user = response.data;
    // Add computed name property for compatibility
    return {
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    };
  },

  // Create new user (staff member)
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await axiosInstance.post('/users', userData);
    const user = response.data;
    // Add computed name property for compatibility
    return {
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    };
  },

  // Update existing user
  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    const user = response.data;
    // Add computed name property for compatibility
    return {
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    };
  },

  // Update user password
  updatePassword: async (id: string, newPassword: string): Promise<void> => {
    await axiosInstance.put(`/users/${id}/password`, { password: newPassword });
  },

  // Delete user (soft delete)
  deleteUser: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },

  // Get users by role
  getUsersByRole: async (role: User['role']): Promise<User[]> => {
    const response = await usersApi.getUsers({ per_page: 100 });
    return response.data.filter(user => user.role === role);
  },

  // Get veterinarians only
  getVeterinarians: async (): Promise<User[]> => {
    return await usersApi.getUsersByRole('vet');
  },

  // Get all staff (vets, excluding admins)
  getStaff: async (): Promise<User[]> => {
    const vets = await usersApi.getUsersByRole('vet');
    return vets.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  // Get user's today appointments count
  getUserTodayAppointments: async (_userId: string): Promise<number> => {
    try {
      // This would need to be implemented when appointment endpoints are ready
      return 0;
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return 0;
    }
  },

  // Get users with today's appointment counts
  getUsersWithAppointmentCounts: async (filters?: UserFilters): Promise<User[]> => {
    const response = await usersApi.getUsers(filters);
    
    // Get appointment counts for each user
    const usersWithCounts = await Promise.all(
      response.data.map(async (user) => {
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
  createStaffMember: async (name: string, role: 'vet', email: string, phone?: string, specialization?: string): Promise<User> => {
    // Generate a secure password
    const password = usersApi.generatePassword();
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    
    return await usersApi.createUser({
      first_name,
      last_name,
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