export interface AuthResponse {
    status: string;
    message: string;
    data: {
      name: string;
      email: string;
      token: string;
    };
  }
  