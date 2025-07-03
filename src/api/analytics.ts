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
    collections: Record<string, {
      documents: number;
      size_mb: number;
      avg_obj_size: number;
    }>;
  };
  activity: {
    new_clients: number;
    new_pets: number;
    new_appointments: number;
    new_invoices: number;
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
  return response.data;
};

// Performance metrics (admin/vet only)
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const response = await axiosInstance.get('/analytics/performance');
  return response.data;
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
  return response.data;
};

// Invoice PDF download
export const downloadInvoicePDF = async (invoiceId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}; 