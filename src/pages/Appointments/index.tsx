import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faEdit,
  faEye,
  faCalendar,
  faCheck,
  faXmark,
  faBarsStaggered,
  faUser,
  faPaw,
  faStethoscope
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../layouts/PageLayout';
import Search from '../../components/Search';
import { appointmentsApi, Appointment, AppointmentFilters } from '../../api/appointments';
import { TableSkeleton, ErrorState, EmptyState } from '../../components/ui/loading';
import AppointmentModal from '../../components/AppointmentModal';

const Appointments: React.FC = () => {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("scheduled");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"all" | "vaccination" | "consultation" | "surgery" | "grooming" | "emergency">("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, _setCurrentPage] = useState(1);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    loadAppointments();
  }, [currentPage, pageSize, statusFilter, serviceTypeFilter, searchTerm, sortOrder]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading appointments with filters:', {
        currentPage,
        pageSize,
        sortOrder,
        statusFilter,
        searchTerm
      });

      const filters: AppointmentFilters = {
        page: currentPage,
        per_page: pageSize,
        sort_by: 'appointment_date',
        sort_order: sortOrder,
        include: 'client,pet,service,user',
        search: searchTerm || undefined,
        appointment_status: statusFilter !== 'all' ? statusFilter : undefined,
        include_inactive: true
      };

      const response = await appointmentsApi.getAppointments(filters);
      console.log('📊 Appointments response received:', response);

      if (response && response.data && Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        console.error('❌ Invalid appointments data format:', response);
        setError('Invalid data format received from server');
        setAppointments([]);
      }
    } catch (err: any) {
      console.error('❌ Failed to load appointments:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load appointments';
      setError(errorMessage);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };



  const handleCreateAppointment = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setIsViewModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setIsEditModalOpen(true);
  };



  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['appointment_status']) => {
    try {
      console.log('🔄 Updating appointment status:', appointmentId, 'to:', newStatus);
      const result = await appointmentsApi.updateAppointment(appointmentId, { appointment_status: newStatus });
      console.log('✅ Status update successful:', result);
      
      // Reload appointments to get the updated data
      await loadAppointments();
      
      // Show success message
      console.log(`✅ Appointment status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('❌ Failed to update appointment status:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to update appointment status';
      alert(`Failed to update appointment status: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: Appointment['appointment_status']) => {
    switch (status) {
      case 'scheduled': return faCalendar;
      case 'completed': return faCheck;
      case 'cancelled': return faXmark;
      default: return faCalendar;
    }
  };

  const getStatusColor = (status: Appointment['appointment_status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-800 bg-green-200';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId);

  return (
    <Layout title="Appointments">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search appointments, clients, pets..."
          />
          </div>
          <button
            onClick={handleCreateAppointment}
            className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>New Appointment</span>
          </button>
        </div>

        {/* Mobile/Tablet Filter Controls */}
        <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "scheduled" | "completed" | "cancelled")}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value as "all" | "vaccination" | "consultation" | "surgery" | "grooming" | "emergency")}
              >
                <option value="all">All Services</option>
                <option value="vaccination">Vaccinations</option>
                <option value="consultation">Consultations</option>
                <option value="surgery">Surgery</option>
                <option value="grooming">Grooming</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">Earliest First</option>
                <option value="desc">Latest First</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Show</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={15}>15 items</option>
                <option value={20}>20 items</option>
                <option value={25}>25 items</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setStatusFilter("all");
                setServiceTypeFilter("all");
                setSortOrder("asc");
                setPageSize(15);
                setSearchTerm("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600 mb-4 overflow-hidden">
          <button 
            onClick={toggleMenu}
            className="hover:text-[#007c7c] transition-all duration-300 p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            title={isMenuVisible ? "Hide Filters" : "Show Filters"}
          >
            <FontAwesomeIcon 
              icon={faBarsStaggered} 
              className={"text-lg transition-transform duration-300 " + (isMenuVisible ? 'transform rotate-0' : 'transform rotate-180')}
            />
          </button>

          <div className={"flex items-center space-x-4 transition-all duration-500 ease-in-out " + (isMenuVisible ? 'transform translate-x-0 opacity-100 max-w-full' : 'transform -translate-x-full opacity-0 max-w-0')}>
            <div className="flex space-x-2 flex-shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "all" ? "bg-gray-800" : "bg-gray-400 hover:bg-gray-600")}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter("scheduled")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "scheduled" ? "bg-blue-500" : "bg-blue-300 hover:bg-blue-400")}
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                Scheduled
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "completed" ? "bg-green-600" : "bg-green-300 hover:bg-green-500")}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "cancelled" ? "bg-red-500" : "bg-red-300 hover:bg-red-400")}
              >
                <FontAwesomeIcon icon={faXmark} className="mr-1" />
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Failed to load appointments"
            message={error}
            onRetry={loadAppointments}
            retryText="Retry Loading"
          />
        )}

        {loading ? (
          <>
            <TableSkeleton rows={5} cols={6} />
          </>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No appointments found"
            message="No appointments match your current search and filter criteria. Try adjusting your filters or schedule a new appointment."
            actionText="New Appointment"
            onAction={handleCreateAppointment}
          />
        ) : (
          <>
            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {appointments.map((appointment) => {
                const dateTime = formatDateTime(appointment.appointment_date);
                return (
                  <div key={appointment.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <FontAwesomeIcon icon={faCalendar} className="mr-2 text-[#007c7c]" />
                          {dateTime.date}
                        </h3>
                        <p className="text-sm text-gray-500">{dateTime.time} • {appointment.duration_minutes} min</p>
                      </div>
                      <span className={"px-2 py-1 text-xs font-semibold rounded-full " + getStatusColor(appointment.appointment_status)}>
                        <FontAwesomeIcon icon={getStatusIcon(appointment.appointment_status)} className="mr-1" />
                        {appointment.appointment_status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="text-sm font-medium flex items-center">
                          <FontAwesomeIcon icon={faUser} className="mr-1" />
                          {appointment.client?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pet</p>
                        <p className="text-sm font-medium flex items-center">
                          <FontAwesomeIcon icon={faPaw} className="mr-1" />
                          {appointment.pet?.name}
                        </p>
                        <p className="text-xs text-gray-400">({appointment.pet?.species?.name})</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Service</p>
                        <p className="text-sm font-medium flex items-center">
                          <FontAwesomeIcon icon={faStethoscope} className="mr-1 text-[#007c7c]" />
                          {appointment.service?.name}
                        </p>
                        <p className="text-xs text-gray-400">${appointment.service?.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Veterinarian</p>
                        <p className="text-sm font-medium">{appointment.user?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{appointment.user?.role}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewAppointment(appointment)}
                        className="flex-1 bg-[#007c7c] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#005f5f] transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      {appointment.appointment_status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faXmark} className="mr-1" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client & Pet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veterinarian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">📅</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No appointments found</h3>
                          <p className="text-gray-600 text-center mb-4">No appointments match your current search and filter criteria.</p>
                          <button 
                            onClick={handleCreateAppointment}
                            className="bg-[#007c7c] text-white px-4 py-2 rounded-lg hover:bg-[#005f5f] transition-colors"
                          >
                            New Appointment
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => {
                      const dateTime = formatDateTime(appointment.appointment_date);
                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{dateTime.date}</div>
                            <div className="text-sm text-gray-500">{dateTime.time}</div>
                            <div className="text-xs text-gray-400">{appointment.duration_minutes} min</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              <FontAwesomeIcon icon={faUser} className="mr-1" />
                              {appointment.client?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              <FontAwesomeIcon icon={faPaw} className="mr-1" />
                              {appointment.pet?.name} ({appointment.pet?.species?.name})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FontAwesomeIcon 
                                icon={faStethoscope} 
                                className="mr-2 text-[#007c7c]" 
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.service?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ${appointment.service?.price}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.user?.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{appointment.user?.role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={"inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold " + getStatusColor(appointment.appointment_status)}>
                              <FontAwesomeIcon icon={getStatusIcon(appointment.appointment_status)} className="mr-1" />
                              {appointment.appointment_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleViewAppointment(appointment)}
                                className="text-[#007c7c] hover:text-[#005f5f] p-1 rounded hover:bg-gray-100 transition-colors"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => handleEditAppointment(appointment)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              {appointment.appointment_status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                    title="Complete"
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                    title="Cancel"
                                  >
                                    <FontAwesomeIcon icon={faXmark} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Appointment Modal */}
        <AppointmentModal
          isOpen={isCreateModalOpen || isEditModalOpen || isViewModalOpen}
          onClose={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
            setIsViewModalOpen(false);
          }}
          appointment={selectedAppointment}
          onSuccess={loadAppointments}
        />
      </div>
    </Layout>
  );
};

export default Appointments; 