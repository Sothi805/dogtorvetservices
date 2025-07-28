import React, { useState, useEffect } from 'react';
import { getDashboardStats, getPerformanceMetrics, DashboardStats, PerformanceMetrics } from '../../api/analytics';
import { appointmentsApi, Appointment } from '../../api/appointments';
import { clientsApi } from '../../api/clients';
import { petsApi } from '../../api/pets';
import { useAuth } from '../../context/AuthContext';

// Shared status configurations
const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-gray-500'
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show'
};

const TODAY_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800'
};

// Modern Stat Card Component
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}> = ({ title, value, subtitle, gradient, icon, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${gradient}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-white/70">{subtitle}</p>
        {trend && (
          <div className={`inline-flex items-center text-xs mt-2 px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-white/20' : 'bg-white/20'
          }`}>
            <span className={trend.isPositive ? 'text-green-200' : 'text-red-200'}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-white/80 text-2xl">
        {icon}
      </div>
    </div>
    {/* Background decoration */}
    <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
  </div>
);

// Modern Chart Card Component
const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ 
  title, 
  children, 
  className = '' 
}) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div>{children}</div>
  </div>
);

// Modern Line Chart Component
const ModernLineChart: React.FC<{ 
  data: Array<{ _id: string; count?: number; revenue?: number }>; 
  type: 'appointments' | 'revenue';
}> = ({ data, type }) => {
  // Add minimum value to prevent all bars being same height when data is sparse
  const values = data.map(d => d.count || d.revenue || 0);
  const maxValue = Math.max(...values, 1); // Ensure at least 1
  const minValue = Math.min(...values, 0);
  const hasVariation = maxValue > minValue;
  
  const gradientColor = type === 'appointments' ? 'from-blue-400 to-blue-600' : 'from-emerald-400 to-emerald-600';
  
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available</p>
          <p className="text-xs">Create some {type} to see trends</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-auto min-h-[280px]">
      {/* Mobile: Horizontal scrollable chart */}
      <div className="md:hidden">
        <div className="overflow-x-auto pb-4">
          <div className="flex items-end h-48 px-2 min-w-[600px]">
            {data.map((item, _index) => {
              const value = item.count || item.revenue || 0;
              const height = hasVariation 
                ? Math.max(((value - minValue) / (maxValue - minValue)) * 140 + 20, 8)
                : Math.max((value / maxValue) * 140, 8);
              
              const tooltipText = type === 'revenue' 
                ? '$' + (item.revenue || 0).toFixed(2)
                : (item.count || 0).toString() + ' appointments';
              
              const dateFormatted = new Date(item._id).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <div key={item._id} className="flex flex-col items-center group mx-2">
                  <div className="relative mb-2">
                    <div 
                      className={`w-8 bg-gradient-to-t ${gradientColor} rounded-t-lg transition-all duration-500 shadow-sm`}
                      style={{ height: height + 'px' }}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {tooltipText}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 text-center whitespace-nowrap">
                    {dateFormatted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center mb-2">← Swipe to see more →</div>
      </div>

      {/* Desktop: Normal chart */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between h-48 px-2">
          {data.map((item, _index) => {
            const value = item.count || item.revenue || 0;
            const height = hasVariation 
              ? Math.max(((value - minValue) / (maxValue - minValue)) * 140 + 20, 8)
              : Math.max((value / maxValue) * 140, 8);
            
            const tooltipText = type === 'revenue' 
              ? '$' + (item.revenue || 0).toFixed(2)
              : (item.count || 0).toString() + ' appointments';
            
            const dateFormatted = new Date(item._id).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            
            return (
              <div key={item._id} className="flex flex-col items-center group flex-1 max-w-[60px]">
                <div className="relative mb-2 w-full flex justify-center">
                  <div 
                    className={`w-6 bg-gradient-to-t ${gradientColor} rounded-t-lg transition-all duration-500 hover:opacity-80 group-hover:scale-110 shadow-sm`}
                    style={{ height: height + 'px' }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold">{tooltipText}</div>
                    <div className="text-gray-300">{dateFormatted}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 text-center truncate w-full">
                  {dateFormatted}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary stats - Mobile friendly */}
      <div className="mt-4 grid grid-cols-3 gap-2 md:flex md:justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="text-center md:text-left">
          <div className="font-medium text-gray-900">{values.reduce((a, b) => a + b, 0).toLocaleString()}</div>
          <div className="text-gray-500">Total</div>
        </div>
        <div className="text-center md:text-left">
          <div className="font-medium text-gray-900">{(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}</div>
          <div className="text-gray-500">Average</div>
        </div>
        <div className="text-center md:text-left">
          <div className="font-medium text-gray-900">{maxValue.toLocaleString()}</div>
          <div className="text-gray-500">Peak</div>
        </div>
      </div>
    </div>
  );
};

// Modern Service List Component
const ServiceList: React.FC<{ 
  services: Array<{ _id: string; count: number; revenue: number }>;
}> = ({ services }) => (
  <div className="space-y-3">
    {services.slice(0, 5).map((service, index) => (
      <div key={service._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
            index === 0 ? 'bg-yellow-500' : 
            index === 1 ? 'bg-gray-400' : 
            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {index + 1}
          </div>
          <div>
            <p className="font-medium text-gray-900">{service._id}</p>
            <p className="text-sm text-gray-500">{service.count} appointments</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">${service.revenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500">revenue</p>
        </div>
      </div>
    ))}
  </div>
);

// Modern Calendar Component
const AppointmentCalendar: React.FC = () => {
  // Start at July 2025 where appointment data actually exists, instead of June 2025
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025 (month is 0-indexed)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    loadMonthAppointments();
  }, [currentDate]);

  const loadMonthAppointments = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Format dates as YYYY-MM-DD
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      console.log('📅 Calendar loading appointments for:', {
        year,
        month: month + 1,
        startDate,
        endDate,
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString()
      });

      const response = await appointmentsApi.getAppointments({
        appointment_date_from: startDate,
        appointment_date_to: endDate,
        include: 'client,pet,service,user',
        per_page: 100  // Fixed: backend max is 100, not 1000
      });

      console.log('📅 Calendar appointments loaded:', {
        month: `${startDate} to ${endDate}`,
        count: response.data?.length || 0,
        appointments: response.data?.slice(0, 3) || [], // Show first 3 for debugging
        julyCount: response.data?.filter(apt => 
          apt.appointment_date && apt.appointment_date.split('T')[0].startsWith('2025-07')
        ).length || 0,
        note: 'Calendar now starts at July 2025 where appointment data actually exists! 🎯'
      });

      setAppointments(response.data || []);
    } catch (error) {
      console.error('❌ Failed to load calendar appointments:', error);
      setAppointments([]); // Ensure we have an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const matchingAppointments = appointments.filter(apt => 
      apt.appointment_date && apt.appointment_date.split('T')[0] === dateStr
    );
    
    // Debug logging for July dates where appointments actually exist
    if (dateStr === '2025-07-28' || dateStr === '2025-07-29' || dateStr === '2025-07-30') {
      console.log(`🔍 Checking appointments for ${dateStr}:`, {
        dateStr,
        totalAppointments: appointments.length,
        matchingAppointments: matchingAppointments.length,
        allAppointmentDates: appointments.map(apt => apt.appointment_date?.split('T')[0])
      });
    }
    
    return matchingAppointments;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedDateAppointments(getAppointmentsForDate(date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateAppointments([]);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to safely get appointment status
  const getAppointmentStatus = (appointment: any): keyof typeof APPOINTMENT_STATUS_COLORS => {
    const validStatuses = Object.keys(APPOINTMENT_STATUS_COLORS) as (keyof typeof APPOINTMENT_STATUS_COLORS)[];
    
    if (typeof appointment.appointment_status === 'string' && validStatuses.includes(appointment.appointment_status as keyof typeof APPOINTMENT_STATUS_COLORS)) {
      return appointment.appointment_status as keyof typeof APPOINTMENT_STATUS_COLORS;
    }
    
    // Handle case where status might be a boolean or other type
    if (appointment.status === true || appointment.status === 'active') {
      return 'scheduled'; // Changed from 'confirmed' to 'scheduled'
    }
    if (appointment.status === false || appointment.status === 'inactive') {
      return 'cancelled';
    }
    if (typeof appointment.status === 'string' && validStatuses.includes(appointment.status as keyof typeof APPOINTMENT_STATUS_COLORS)) {
      return appointment.status as keyof typeof APPOINTMENT_STATUS_COLORS;
    }
    
    return 'scheduled'; // default fallback
  };
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">📅 Appointments Calendar</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(null);
              setSelectedDateAppointments([]);
            }}
            className="px-3 py-1 text-sm bg-[#007c7c] text-white rounded-lg hover:bg-[#005f5f] transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const statusCounts = dayAppointments.reduce((acc, apt) => {
                const status = getAppointmentStatus(apt);
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative p-3 min-h-[60px] border rounded-lg cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-[#007c7c] text-white shadow-lg scale-105' : 'hover:bg-gray-50'}
                    ${isToday(date) && !isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}
                    ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50' : 'text-gray-900'}
                  `}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>
                  
                  {/* Appointment Indicators */}
                  {dayAppointments.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center space-x-1">
                      {Object.entries(statusCounts).slice(0, 3).map(([status, count]) => (
                        <div
                          key={status}
                          className={`w-2 h-2 rounded-full ${APPOINTMENT_STATUS_COLORS[status as keyof typeof APPOINTMENT_STATUS_COLORS]} 
                                     ${isSelected ? 'bg-white/80' : ''}`}
                          title={`${count} ${APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS]}`}
                        />
                      ))}
                      {Object.keys(statusCounts).length > 3 && (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/60' : 'bg-gray-400'}`} />
                      )}
                    </div>
                  )}

                  {/* Appointment Count */}
                  {dayAppointments.length > 0 && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                   ${isSelected ? 'bg-white text-[#007c7c]' : 'bg-[#007c7c] text-white'}`}>
                      {dayAppointments.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#007c7c] to-emerald-600 text-white p-4 rounded-xl">
            <h5 className="font-semibold mb-1">
              {selectedDate ? 
                selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) :
                'Select a date'
              }
            </h5>
            <p className="text-sm text-white/80">
              {selectedDate ? 
                `${selectedDateAppointments.length} appointment${selectedDateAppointments.length !== 1 ? 's' : ''}` :
                'Click on a date to view appointments'
              }
            </p>
          </div>

          {/* Status Legend */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h6 className="font-medium text-gray-900 mb-3">Status Legend</h6>
            <div className="space-y-2">
              {Object.entries(APPOINTMENT_STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-gray-600 capitalize">
                    {APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Appointments */}
          {selectedDateAppointments.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-3">
              <h6 className="font-medium text-gray-900 sticky top-0 bg-white py-2">Today's Schedule</h6>
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {appointment.client?.name || 'Unknown Client'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.pet?.name || 'Unknown Pet'} • {appointment.service?.name || 'General'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      APPOINTMENT_STATUS_COLORS[getAppointmentStatus(appointment)]
                    }`}>
                      {APPOINTMENT_STATUS_LABELS[getAppointmentStatus(appointment)]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#007c7c]">
                      {formatTime(appointment.appointment_date)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {appointment.duration_minutes || 30}min
                    </span>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{appointment.notes}"</p>
                  )}
        </div>
      ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007c7c]"></div>
        </div>
      )}
    </div>
  );
};

// Recent Activity Feed Component
const RecentActivityFeed: React.FC = () => {
  const [recentData, setRecentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        // Get recent appointments and clients separately
        const [appointmentsResponse, clientsResponse] = await Promise.all([
          appointmentsApi.getAppointments({ 
            per_page: 5, 
            sort_by: 'appointment_date', 
            sort_order: 'desc'
          }),
          clientsApi.getClients({ 
            limit: 3
          }).catch(() => null)
        ]);
        
        const appointmentsData = Array.isArray(appointmentsResponse) ? 
          appointmentsResponse : appointmentsResponse.data || [];
        const clientsData = clientsResponse ? 
          (Array.isArray(clientsResponse) ? clientsResponse : []) : [];
        
        // Since include doesn't work properly, we need to fetch client and pet names manually
        const enrichedAppointments = await Promise.all(
          appointmentsData.slice(0, 5).map(async (apt: any) => {
            try {
              const [clientResponse, petResponse] = await Promise.all([
                apt.client_id ? clientsApi.getClient(apt.client_id).catch(() => null) : null,
                apt.pet_id ? petsApi.getPet(apt.pet_id).catch(() => null) : null
              ]);
              
              return {
                ...apt,
                client: clientResponse ? { name: clientResponse.name } : null,
                pet: petResponse ? { name: petResponse.name } : null
              };
            } catch (error) {
              console.warn('Failed to enrich appointment:', apt.id, error);
              return apt;
            }
          })
        );

        console.log('🕒 Recent activity loaded:', {
          appointmentsCount: enrichedAppointments.length,
          clientsCount: clientsData?.length || 0,
          sampleEnrichedAppointment: enrichedAppointments[0] || null,
          sampleClient: clientsData?.[0] || null
        });

        setRecentData({
          appointments: enrichedAppointments,
          clients: clientsData
        });
      } catch (error) {
        console.error('❌ Failed to load recent activity:', error);
        setRecentData({ appointments: [], clients: [] });
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivity();
  }, []);

  if (loading) {
    return (
      <ChartCard title="🕒 Recent Activity">
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="🕒 Recent Activity">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {recentData?.appointments?.slice(0, 3).map((apt: any) => (
          <div key={apt.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {apt.client?.name || 'Unknown'} - {apt.pet?.name || 'Pet'}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(apt.appointment_date).toLocaleDateString()} at {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {recentData?.clients?.slice(0, 2).map((client: any) => (
          <div key={client.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New client: {client.name}</p>
              <p className="text-xs text-gray-600">Registered recently</p>
            </div>
          </div>
        ))}
        
        {(!recentData?.appointments?.length && !recentData?.clients?.length) && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🌟</div>
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </ChartCard>
  );
};

// Upcoming Schedule Component
const UpcomingSchedule: React.FC = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingSchedule = async () => {
      try {
        // Get upcoming appointments for the next 7 days
        const response = await appointmentsApi.getUpcomingAppointments(7);
        console.log('📅 Upcoming schedule loaded:', {
          count: response?.length || 0,
          appointments: response?.slice(0, 3) || [],
          note: 'Loading next 7 days of appointments 🎯'
        });

        setUpcomingAppointments(response || []);
      } catch (error) {
        console.error('❌ Failed to load upcoming schedule:', error);
        setUpcomingAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingSchedule();
  }, []);

  if (loading) {
    return (
      <ChartCard title="📅 Upcoming Schedule">
        <div className="animate-pulse space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </ChartCard>
    );
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const groupedAppointments = upcomingAppointments.reduce((groups: any, apt: any) => {
    const dateKey = apt.appointment_date.split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(apt);
    return groups;
  }, {});

  return (
    <ChartCard title="📅 Upcoming Schedule">
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {Object.keys(groupedAppointments).length > 0 ? (
          <>
            <div className="text-xs text-gray-600 mb-3">
              {upcomingAppointments.length} appointment{upcomingAppointments.length !== 1 ? 's' : ''} in the next 7 days
            </div>
            {Object.entries(groupedAppointments).map(([date, appointments]: [string, any]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {getDateLabel(date)}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {appointments.slice(0, 3).map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between pl-2 border-l-2 border-blue-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {apt.client?.name || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {apt.pet?.name || 'Pet'} • {apt.service?.name || 'Service'}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${TODAY_STATUS_COLORS[apt.appointment_status as keyof typeof TODAY_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                        {APPOINTMENT_STATUS_LABELS[apt.appointment_status as keyof typeof APPOINTMENT_STATUS_LABELS] || apt.appointment_status?.toString().replace('_', ' ') || 'scheduled'}
                      </span>
                    </div>
                  ))}
                  {appointments.length > 3 && (
                    <p className="text-xs text-gray-500 pl-2">
                      +{appointments.length - 3} more appointment{appointments.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📅</div>
            <p>No upcoming appointments</p>
            <p className="text-xs">Schedule looks clear for the next week!</p>
          </div>
        )}
      </div>
    </ChartCard>
  );
};

// Quick Actions Component
const QuickActions: React.FC = () => {
  const quickActions = [
    {
      title: 'New Appointment',
      description: 'Schedule a visit',
      icon: '📅',
      action: () => window.location.href = '/appointments',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Add Client',
      description: 'Register new customer',
      icon: '👤',
      action: () => window.location.href = '/customer',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Register Pet',
      description: 'Add new pet profile',
      icon: '🐕',
      action: () => window.location.href = '/pets',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Create Invoice',
      description: 'Bill for services',
      icon: '💰',
      action: () => window.location.href = '/invoices',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <ChartCard title="⚡ Quick Actions">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white p-2 md:p-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group`}
          >
            <div className="text-center">
              <div className="text-base md:text-lg mb-1 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <p className="text-xs font-medium">{action.title}</p>
              <p className="text-xs opacity-80 hidden md:block">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 md:mt-4 pt-3 border-t border-gray-200">
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/entity-relationships'}
            className="text-xs text-gray-600 hover:text-[#007c7c] transition-colors"
          >
            🔗 System Overview
          </button>
        </div>
      </div>
    </ChartCard>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats(period);
      console.log('📊 Dashboard data loaded:', {
        overview: data.overview,
        trendsLength: {
          appointments: data.trends?.appointments?.length || 0,
          revenue: data.trends?.revenue?.length || 0
        },
        analyticsLength: {
          topServices: data.analytics?.top_services?.length || 0,
          speciesDistribution: data.analytics?.species_distribution?.length || 0
        },
        june5Analytics: data.trends?.appointments?.find(trend => trend._id === '2025-06-05')?.count || 0,
        fullData: data
      }); // Enhanced debug log
      setDashboardData(data);
      
      if (user?.role === 'admin' || user?.role === 'vet') {
        try {
          const perfData = await getPerformanceMetrics();
          console.log('🔥 Performance data loaded:', perfData); // Debug log
          setPerformanceData(perfData);
        } catch (perfError) {
          console.log('Performance metrics not available for this role:', perfError);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('❌ Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007c7c] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
            <p className="text-red-800 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData} 
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600">Welcome back, {user?.name || 'User'}! Here's what's happening.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
            >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {dashboardData && (
        <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <StatCard
                title="Total Clients"
                value={dashboardData.overview.total_clients.toLocaleString()}
                subtitle="Active customers"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                icon="👥"
              />
              
              <StatCard
                title="Total Pets"
                value={dashboardData.overview.total_pets.toLocaleString()}
                subtitle="Registered pets"
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                icon="🐕"
              />
              
              <StatCard
                title="Appointments"
                value={dashboardData.overview.recent_appointments.toLocaleString()}
                subtitle={`Last ${period} days`}
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                icon="📅"
              />
              
              <StatCard
                title="Revenue"
                value={`$${dashboardData.overview.period_revenue.toLocaleString()}`}
                subtitle={`Last ${period} days`}
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
                icon="💰"
                trend={{
                  value: dashboardData.analytics.revenue_growth,
                  isPositive: dashboardData.analytics.revenue_growth >= 0
                }}
              />
           </div>

          {/* Charts Section */}
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-6 mb-6 md:mb-8">
              <ChartCard title="Appointment Trends">
                {dashboardData.trends?.appointments?.length > 0 ? (
                  <ModernLineChart data={dashboardData.trends.appointments} type="appointments" />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📅</div>
                      <p>No appointment data available for this period</p>
                      <p className="text-xs mt-1">Schedule some appointments to see trends</p>
                    </div>
                  </div>
                )}
              </ChartCard>
              
              <ChartCard title="Revenue Trends">
                {dashboardData.trends?.revenue?.length > 0 ? (
                  <ModernLineChart data={dashboardData.trends.revenue} type="revenue" />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💰</div>
                      <p>No revenue data available for this period</p>
                      <p className="text-xs mt-1">Create and mark invoices as paid to see revenue trends</p>
                    </div>
                  </div>
                )}
              </ChartCard>
          </div>

          {/* Analytics Section */}
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-2">
                <ChartCard title="Top Performing Services">
                  {dashboardData.analytics?.top_services?.length > 0 ? (
                    <ServiceList services={dashboardData.analytics.top_services} />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏆</div>
                        <p>No service data available for this period</p>
                        <p className="text-xs mt-1">Complete some appointments to see top services</p>
                      </div>
                  </div>
                  )}
                </ChartCard>
              </div>
              
              <ChartCard title="🐾 Pet Demographics">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                    <p className="text-2xl font-bold text-indigo-600 mb-1">
                      {dashboardData.analytics.species_distribution.reduce((sum, species) => sum + species.count, 0)}
                    </p>
                    <p className="text-sm text-indigo-600">Total registered pets</p>
                  </div>
                  
                  <div className="space-y-3">
                    {dashboardData.analytics.species_distribution.slice(0, 4).map((species, _index) => (
                      <div key={species._id} className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm capitalize">{species._id}</span>
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-gradient-to-r from-[#007c7c] to-emerald-500 rounded-full"
                              style={{ 
                                width: `${(species.count / Math.max(...dashboardData.analytics.species_distribution.map(s => s.count))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{species.count}</span>
                        </div>
                      </div>
                    ))}
                    {dashboardData.analytics.species_distribution.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-2">🐕</div>
                        <p className="text-sm">No pet data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </ChartCard>
            </div>

                          {/* Upcoming Schedule & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <UpcomingSchedule />
              <QuickActions />
              <RecentActivityFeed />
            </div>

            {/* Modern Appointments Calendar */}
            <div className="mb-6 md:mb-8">
              <AppointmentCalendar />
            </div>

            {/* Performance Section (Admin/Vet only) - Your Database Performance is BACK! */}
            {performanceData && (user?.role === 'admin' || user?.role === 'vet') && (
              <div className="mb-6 md:mb-8">
                <ChartCard title="🔥 System Performance">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 md:p-4 rounded-xl border border-red-200">
                      <p className="text-xs text-red-600 font-medium mb-1">Database Size</p>
                      <p className="text-lg md:text-2xl font-bold text-red-700">{performanceData.database.total_size_mb.toFixed(2)} MB</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 md:p-4 rounded-xl border border-orange-200">
                      <p className="text-xs text-orange-600 font-medium mb-1">Storage Used</p>
                      <p className="text-lg md:text-2xl font-bold text-orange-700">{performanceData.database.storage_size_mb.toFixed(2)} MB</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-xl border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">New Clients (24h)</p>
                      <p className="text-lg md:text-2xl font-bold text-green-700">{performanceData.activity.new_clients_24h}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium mb-1">New Appointments (24h)</p>
                      <p className="text-lg md:text-2xl font-bold text-purple-700">{performanceData.activity.new_appointments_24h}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 md:p-4 rounded-xl border border-teal-200">
                      <p className="text-xs text-teal-600 font-medium mb-1">Collections</p>
                      <p className="text-base md:text-lg font-bold text-teal-700">{Object.keys(performanceData.database.collections).length}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 md:p-4 rounded-xl border border-indigo-200">
                      <p className="text-xs text-indigo-600 font-medium mb-1">Index Size</p>
                      <p className="text-base md:text-lg font-bold text-indigo-700">{performanceData.database.indexes_size_mb.toFixed(2)} MB</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 md:p-4 rounded-xl border border-pink-200">
                      <p className="text-xs text-pink-600 font-medium mb-1">Total Documents</p>
                      <p className="text-base md:text-lg font-bold text-pink-700">
                        {Object.values(performanceData.database.collections).reduce((sum, col) => sum + col.documents, 0)}
                      </p>
                    </div>
                  </div>
                </ChartCard>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
