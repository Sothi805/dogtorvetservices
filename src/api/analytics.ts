import axiosInstance from './axios';

export interface DashboardStats {
  overview: {
    total_clients: number;
    total_pets: number;
    total_appointments: number;
    recent_appointments: number;
    period_revenue: number;
    upcoming_appointments: number;
  };
  trends: {
    appointments: Array<{ _id: string; count: number }>;
    revenue: Array<{ _id: string; revenue: number }>;
  };
  analytics: {
    top_services: Array<{ _id: string; count: number; revenue: number }>;
    species_distribution: Array<{ _id: string; count: number }>;
    revenue_growth: number;
    current_month_revenue: number;
    last_month_revenue: number;
  };
}

export interface PerformanceMetrics {
  database: {
    total_size_mb: number;
    storage_size_mb: number;
    indexes_size_mb: number;
    collections: {
      [key: string]: {
        documents: number;
        size_mb: number;
        avg_obj_size: number;
      };
    };
  };
  activity: {
    new_clients_24h: number;
    new_pets_24h: number;
    new_appointments_24h: number;
    new_invoices_24h: number;
    new_clients_7d: number;
    new_pets_7d: number;
    new_appointments_7d: number;
    new_invoices_7d: number;
  };
  system_health: {
    total_documents: number;
    active_clients: number;
    active_pets: number;
    active_users: number;
    today_appointments: number;
    upcoming_appointments: number;
    collection_count: number;
  };
  timestamp: string;
}

export interface RevenueReport {
  period: {
    start: string;
    end: string;
    group_by: string;
  };
  summary: {
    total_revenue: number;
    total_invoices: number;
    average_invoice: number;
  };
  data: Array<{
    _id: string;
    revenue: number;
    count: number;
    avg_invoice: number;
  }>;
}

// Dashboard analytics
export const getDashboardStats = async (period: string = '30'): Promise<DashboardStats> => {
  const response = await axiosInstance.get(`/analytics/dashboard?period=${period}`);
  return response.data; // Data is already extracted by axios interceptor
};

// Performance metrics (admin/vet only)
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const response = await axiosInstance.get('/analytics/performance');
  return response.data; // Data is already extracted by axios interceptor
};

// Revenue report
export const getRevenueReport = async (
  startDate: string,
  endDate: string,
  groupBy: string = 'day'
): Promise<RevenueReport> => {
  const response = await axiosInstance.get(
    `/analytics/reports/revenue?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
  );
  return response.data; // Data is already extracted by axios interceptor
};

// Invoice PDF download
export const downloadInvoicePDF = async (invoiceId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}; 