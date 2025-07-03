import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarsStaggered,
  faCalendar,
  faCheck,
  faXmark,
  faPlus,
  faClock,
  faUser,
  faPaw,
  faStethoscope,
  //faShieldAlt,
  faEdit,
  faEye,
  faCalendarPlus,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import { appointmentsApi, Appointment, AppointmentFilters, CreateAppointmentRequest } from "../../api/appointments";
import { servicesApi, Service } from "../../api/services";
import { usersApi, User } from "../../api/users";
import { petsApi, Pet } from "../../api/pets";
import { clientsApi, Client } from "../../api/clients";
import { vaccinationsApi, Vaccination } from "../../api/vaccinations";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState } from "../../components/ui/loading";

const Appointments: React.FC = () => {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show">("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"all" | "vaccination" | "consultation" | "surgery" | "grooming" | "emergency">("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportingDataLoaded, setSupportingDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form states
  const [appointmentForm, setAppointmentForm] = useState({
    client_id: '',
    pet_id: '',
    service_id: '',
    veterinarian_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    appointment_status: 'scheduled' as Appointment['appointment_status'],
    notes: '',
    vaccination_id: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    loadAppointments();
  }, [currentPage, pageSize, statusFilter, serviceTypeFilter, searchTerm, sortOrder]);

  useEffect(() => {
    loadSupportingData();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      setAppointments(response.data);
      setTotalAppointments(response.meta.total);
      setTotalPages(response.meta.last_page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const [servicesResponse, usersResponse, petsResponse, clientsResponse] = await Promise.all([
        servicesApi.getServices({ per_page: 100 }),
        usersApi.getUsers({ per_page: 100 }),
        petsApi.getPets({ per_page: 100, include: 'client,species,breed' }),  // Backend max limit is 100
        clientsApi.getClients()
      ]);

      setServices(servicesResponse.data);
      setUsers(usersResponse.data);
      setPets(petsResponse.data);
      console.log('Loaded pets:', petsResponse.data);
      console.log('Sample pet:', petsResponse.data[0]);
      setClients(Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.data);
      setSupportingDataLoaded(true);
      
      // Try to load vaccinations, but don't fail if endpoint doesn't exist
      try {
        const vaccinationsResponse = await vaccinationsApi.getVaccinations();
        setVaccinations(vaccinationsResponse);
      } catch (vaccinationError) {
        console.log('Vaccinations endpoint not available yet');
        setVaccinations([]); // Set empty array as fallback
      }
    } catch (err: any) {
      console.error('Error loading supporting data:', err);
      setSupportingDataLoaded(true); // Set to true even on error to prevent infinite loading
    }
  };

  const handleCreateAppointment = () => {
    setAppointmentForm({
      client_id: '',
      pet_id: '',
      service_id: '',
      veterinarian_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: 30,
      appointment_status: 'scheduled',
      notes: '',
      vaccination_id: 0
    });
    setIsCreateModalOpen(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setIsViewModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    const appointmentDateTime = new Date(appointment.appointment_date);
    setAppointmentForm({
      client_id: appointment.client_id,
      pet_id: appointment.pet_id,
      service_id: appointment.service_id,
      veterinarian_id: appointment.veterinarian_id,
      appointment_date: appointmentDateTime.toISOString().split('T')[0],
      appointment_time: appointmentDateTime.toTimeString().slice(0, 5),
      duration_minutes: appointment.duration_minutes || 30,
      appointment_status: appointment.appointment_status,
      notes: appointment.notes || '',
      vaccination_id: 0
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAppointment = async (isEdit: boolean = false) => {
    if (!appointmentForm.client_id || !appointmentForm.pet_id || !appointmentForm.service_id || 
        !appointmentForm.veterinarian_id || !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentDateTime = `${appointmentForm.appointment_date} ${appointmentForm.appointment_time}:00`;
      
      const appointmentData: CreateAppointmentRequest = {
        client_id: appointmentForm.client_id,
        pet_id: appointmentForm.pet_id,
        service_id: appointmentForm.service_id,
        veterinarian_id: appointmentForm.veterinarian_id,
        appointment_date: appointmentDateTime,
        duration_minutes: appointmentForm.duration_minutes,
        appointment_status: appointmentForm.appointment_status,
        notes: appointmentForm.notes
      };

      if (isEdit && selectedAppointmentId) {
        await appointmentsApi.updateAppointment(selectedAppointmentId, appointmentData);
        setIsEditModalOpen(false);
      } else {
        await appointmentsApi.createAppointment(appointmentData);
        setIsCreateModalOpen(false);
      }

      await loadAppointments();
      alert(`Appointment ${isEdit ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      console.error('Failed to save appointment:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Unknown error occurred';
      alert(`Failed to ${isEdit ? 'update' : 'create'} appointment: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['appointment_status']) => {
    try {
      await appointmentsApi.updateAppointment(appointmentId, { appointment_status: newStatus });
      await loadAppointments();
    } catch (error: any) {
      console.error('Failed to update appointment status:', error);
      alert('Failed to update appointment status');
    }
  };

  const getStatusIcon = (status: Appointment['appointment_status']) => {
    switch (status) {
      case 'scheduled': return faCalendar;
      case 'confirmed': return faCheck;
      case 'in_progress': return faClock;
      case 'completed': return faCheck;
      case 'cancelled': return faXmark;
      case 'no_show': return faExclamationTriangle;
      default: return faCalendar;
    }
  };

  const getStatusColor = (status: Appointment['appointment_status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-800 bg-green-200';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no_show': return 'text-gray-600 bg-gray-100';
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
  const clientPets = pets.filter(pet => pet.client_id === appointmentForm.client_id);

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
                onChange={(e) => setStatusFilter(e.target.value as "all" | "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show")}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
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
                onClick={() => setStatusFilter("confirmed")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "confirmed" ? "bg-green-500" : "bg-green-300 hover:bg-green-400")}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Confirmed
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={"px-3 py-1 rounded-full text-white text-xs transition-all duration-200 " + (statusFilter === "completed" ? "bg-green-600" : "bg-green-300 hover:bg-green-500")}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Completed
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
            <MobileCardSkeleton items={5} />
            <div className="hidden lg:block">
              <TableSkeleton rows={5} cols={6} />
          </div>
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
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
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
                            <button
                              onClick={() => handleViewAppointment(appointment)}
                              className="text-[#007c7c] hover:text-[#005f5f] mr-3"
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            {appointment.appointment_status === 'scheduled' && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                className="text-green-600 hover:text-green-900"
                                title="Confirm"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                            )}
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

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faCalendarPlus} className="mr-2 text-[#007c7c]" />
                  {isEditModalOpen ? 'Edit Appointment' : 'Schedule New Appointment'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>

              <form className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select
                      value={appointmentForm.client_id}
                      onChange={(e) => {
                        const selectedClientId = e.target.value;
                        console.log('Selected client ID:', selectedClientId);
                        console.log('All pets:', pets);
                        console.log('Pets for this client:', pets.filter(pet => pet.client_id === selectedClientId));
                        setAppointmentForm(prev => ({ ...prev, client_id: selectedClientId, pet_id: '' }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pet *</label>
                    <select
                      value={appointmentForm.pet_id}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, pet_id: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                      disabled={!appointmentForm.client_id || !supportingDataLoaded}
                    >
                      <option value="">Select a pet</option>
                      {!supportingDataLoaded && appointmentForm.client_id && (
                        <option value="" disabled>Loading pets...</option>
                      )}
                      {clientPets.length === 0 && appointmentForm.client_id && supportingDataLoaded && (
                        <option value="" disabled>No pets found for this client</option>
                      )}
                      {clientPets.map(pet => (
                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.species?.name || 'Unknown species'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                    <select
                      value={appointmentForm.service_id}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, service_id: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - ${service.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian *</label>
                    <select
                      value={appointmentForm.veterinarian_id}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, veterinarian_id: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                    >
                      <option value="">Select a veterinarian</option>
                      {users.filter(user => user.role === 'vet' || user.role === 'admin').map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={appointmentForm.appointment_date}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      value={appointmentForm.appointment_time}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={appointmentForm.duration_minutes}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                      min="15"
                      step="15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={appointmentForm.appointment_status}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_status: e.target.value as Appointment['appointment_status'] }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] bg-white text-gray-900"
                    rows={3}
                    placeholder="Add any special notes or instructions..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSubmitAppointment(isEditModalOpen)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        <span>{isEditModalOpen ? 'Update Appointment' : 'Schedule Appointment'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Appointment Modal */}
        {isViewModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faEye} className="mr-2 text-[#007c7c]" />
                  Appointment Details
                </h2>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Client</h3>
                      <p className="text-lg font-semibold text-gray-900">{selectedAppointment.client?.name}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.client?.email}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Pet</h3>
                      <p className="text-lg font-semibold text-gray-900">{selectedAppointment.pet?.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedAppointment.pet?.species?.name} - {selectedAppointment.pet?.breed?.name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Service</h3>
                      <p className="text-lg font-semibold text-gray-900">{selectedAppointment.service?.name}</p>
                      <p className="text-sm text-gray-600">${selectedAppointment.service?.price}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Veterinarian</h3>
                      <p className="text-lg font-semibold text-gray-900">{selectedAppointment.user?.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{selectedAppointment.user?.role}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDateTime(selectedAppointment.appointment_date).date}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(selectedAppointment.appointment_date).time} ({selectedAppointment.duration_minutes} minutes)
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <span className={"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium " + getStatusColor(selectedAppointment.appointment_status)}>
                        <FontAwesomeIcon icon={getStatusIcon(selectedAppointment.appointment_status)} className="mr-2" />
                        {selectedAppointment.appointment_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-900">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditAppointment(selectedAppointment);
                    }}
                    className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] transition-colors flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit Appointment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Appointments; 