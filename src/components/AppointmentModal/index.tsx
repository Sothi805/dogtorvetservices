import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faPaw, faSyringe, faUserMd, faXmark, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { appointmentsApi, Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../../api/appointments';
import { clientsApi, Client } from '../../api/clients';
import { petsApi, Pet } from '../../api/pets';
import { servicesApi, Service } from '../../api/services';
import { usersApi, User } from '../../api/users';
import './index.less';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  onSuccess: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateAppointmentRequest & { appointment_time: string }>({
    client_id: '',
    pet_id: '',
    service_id: '',
    veterinarian_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    appointment_status: 'scheduled',
    notes: ''
  });

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);

  // Search and pagination states
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [petSearchTerm, setPetSearchTerm] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [veterinarianSearchTerm, setVeterinarianSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [petPage, setPetPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [veterinarianPage, setVeterinarianPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (appointment) {
        setIsEditMode(true);
        // Parse the appointment date to extract just the date part for the input field
        const appointmentDate = appointment.appointment_date ? 
          new Date(appointment.appointment_date).toISOString().split('T')[0] : '';
        
        // Parse the appointment time to extract just the time part for the input field
        const appointmentTime = appointment.appointment_date ? 
          new Date(appointment.appointment_date).toTimeString().slice(0, 5) : '';
        
        setFormData({
          client_id: appointment.client_id || '',
          pet_id: appointment.pet_id || '',
          service_id: appointment.service_id || '',
          veterinarian_id: appointment.veterinarian_id || '',
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_minutes: appointment.duration_minutes || 30,
          appointment_status: appointment.appointment_status || 'scheduled',
          notes: appointment.notes || ''
        });
      } else {
        setIsEditMode(false);
        setFormData({
          client_id: '',
          pet_id: '',
          service_id: '',
          veterinarian_id: '',
          appointment_date: '',
          appointment_time: '',
          duration_minutes: 30,
          appointment_status: 'scheduled',
          notes: ''
        });
      }
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (formData.client_id) {
      loadPetsForClient(formData.client_id);
    } else {
      setPets([]);
      setFormData(prev => ({ ...prev, pet_id: '' }));
    }
  }, [formData.client_id]);

  const loadInitialData = async () => {
    try {
      setError(null);
      console.log('🔄 Loading initial data for appointment modal...');
      
      // Load clients
      let clientsData = [];
      try {
        const clientsResponse = await clientsApi.getClients();
        clientsData = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse as any)?.data || [];
        setClients(clientsData);
        console.log('✅ Clients loaded:', clientsData.length);
      } catch (err: any) {
        console.error('❌ Failed to load clients:', err);
        throw new Error(`Failed to load clients: ${err.response?.data?.detail || err.message}`);
      }

      // Load services
      let servicesData = [];
      try {
        const servicesResponse = await servicesApi.getServices({ status: 'active' });
        servicesData = servicesResponse;
        setServices(servicesData);
        console.log('✅ Services loaded:', servicesData.length);
      } catch (err: any) {
        console.error('❌ Failed to load services:', err);
        throw new Error(`Failed to load services: ${err.response?.data?.detail || err.message}`);
      }

      // Load veterinarians
      let veterinariansData = [];
      try {
        const veterinariansResponse = await usersApi.getUsers();
        veterinariansData = veterinariansResponse.data || [];
        setVeterinarians(veterinariansData);
        console.log('✅ Veterinarians loaded:', veterinariansData.length);
        
        // Set default veterinarian to admin@dogtorvet.com
        const adminUser = veterinariansData.find(vet => vet.email === 'admin@dogtorvet.com');
        if (adminUser) {
          setFormData(prev => ({
            ...prev,
            veterinarian_id: adminUser.id
          }));
          console.log('✅ Set default veterinarian to admin:', adminUser.name);
        }
      } catch (err: any) {
        console.error('❌ Failed to load veterinarians:', err);
        throw new Error(`Failed to load veterinarians: ${err.response?.data?.detail || err.message}`);
      }

      console.log('✅ All initial data loaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load initial data';
      setError(errorMessage);
      console.error('❌ loadInitialData error:', err);
    }
  };

  const loadPetsForClient = async (clientId: string) => {
    try {
      console.log('🔄 Loading pets for client:', clientId);
      const petsData = await petsApi.getPets({ client_id: clientId });
      console.log('🐾 petsData in modal:', petsData);
      setPets(petsData.data || []);
      console.log('✅ Pets loaded:', (petsData.data || []).length);
    } catch (err) {
      console.error('Failed to load pets:', err);
      setPets([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting appointment with data:', formData);
      
      // Validate required fields
      if (!formData.client_id) {
        throw new Error('Client selection is required');
      }
      if (!formData.pet_id) {
        throw new Error('Pet selection is required');
      }
      if (!formData.service_id) {
        throw new Error('Service selection is required');
      }
      if (!formData.veterinarian_id) {
        throw new Error('Veterinarian selection is required');
      }
      if (!formData.appointment_date) {
        throw new Error('Appointment date is required');
      }
      if (!formData.appointment_time) {
        throw new Error('Appointment time is required');
      }

      // Combine date and time into a single datetime string
      const appointmentDateTime = `${formData.appointment_date} ${formData.appointment_time}:00`;

      const appointmentData = {
        client_id: formData.client_id,
        pet_id: formData.pet_id,
        service_id: formData.service_id,
        veterinarian_id: formData.veterinarian_id,
        appointment_date: appointmentDateTime,
        duration_minutes: formData.duration_minutes,
        appointment_status: formData.appointment_status,
        notes: formData.notes
      };

      if (isEditMode && appointment) {
        // Update existing appointment
        await appointmentsApi.updateAppointment(appointment.id, appointmentData as UpdateAppointmentRequest);
        console.log('✅ Appointment updated successfully');
      } else {
        // Create new appointment
        await appointmentsApi.createAppointment(appointmentData);
        console.log('✅ Appointment created successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('❌ Appointment operation failed:', err);
      let errorMessage = 'Failed to save appointment';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      pet_id: '',
      service_id: '',
      veterinarian_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: 30,
      appointment_status: 'scheduled',
      notes: ''
    });
    setError(null);
    setClientSearchTerm('');
    setPetSearchTerm('');
    setServiceSearchTerm('');
    setVeterinarianSearchTerm('');
    setClientPage(1);
    setPetPage(1);
    setServicePage(1);
    setVeterinarianPage(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter and paginate functions
  const filteredClients = clients
    .filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.other_contact_info?.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Put selected client at the top
      if (a.id === formData.client_id) return -1;
      if (b.id === formData.client_id) return 1;
      return 0;
    });

  const filteredPets = pets
    .filter(pet => 
      pet.name.toLowerCase().includes(petSearchTerm.toLowerCase()) ||
      pet.species?.name.toLowerCase().includes(petSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Put selected pet at the top
      if (a.id === formData.pet_id) return -1;
      if (b.id === formData.pet_id) return 1;
      return 0;
    });

  const filteredServices = services
    .filter(service => 
      service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Put selected service at the top
      if (a.id.toString() === formData.service_id) return -1;
      if (b.id.toString() === formData.service_id) return 1;
      return 0;
    });

  const filteredVeterinarians = veterinarians
    .filter(vet => 
      (vet.name || '').toLowerCase().includes(veterinarianSearchTerm.toLowerCase()) ||
      vet.email?.toLowerCase().includes(veterinarianSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Put selected veterinarian at the top
      if (a.id === formData.veterinarian_id) return -1;
      if (b.id === formData.veterinarian_id) return 1;
      return 0;
    });

  const paginatedClients = filteredClients.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
  const paginatedPets = filteredPets.slice((petPage - 1) * itemsPerPage, petPage * itemsPerPage);
  const paginatedServices = filteredServices.slice((servicePage - 1) * itemsPerPage, servicePage * itemsPerPage);
  const paginatedVeterinarians = filteredVeterinarians.slice((veterinarianPage - 1) * itemsPerPage, veterinarianPage * itemsPerPage);

  const totalClientPages = Math.ceil(filteredClients.length / itemsPerPage);
  const totalPetPages = Math.ceil(filteredPets.length / itemsPerPage);
  const totalServicePages = Math.ceil(filteredServices.length / itemsPerPage);
  const totalVeterinarianPages = Math.ceil(filteredVeterinarians.length / itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Apple-like liquid glass background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Minimal floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
      </div>
      
      {/* Modal container with Apple-like transparent glass effect */}
      <div className="relative w-full max-w-4xl max-h-[90vh]">
        {/* Transparent glass effect with drop shadow */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#007c7c]" />
              {isEditMode ? 'Edit Appointment' : 'Create New Appointment'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-100 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-[#007c7c]" />
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      {paginatedClients.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {clientSearchTerm ? 'No clients found' : 'No clients available'}
                        </div>
                      ) : (
                        <>
                          {paginatedClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, client_id: client.id }))}
                              className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                formData.client_id === client.id ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{client.name}</div>
                              {client.other_contact_info && <div className="text-xs text-gray-600">{client.other_contact_info}</div>}
                            </button>
                          ))}
                          {totalClientPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                                disabled={clientPage === 1}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {clientPage} of {totalClientPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setClientPage(prev => Math.min(totalClientPages, prev + 1))}
                                disabled={clientPage === totalClientPages}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pet Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#007c7c]" />
                    Pet <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search pets..."
                        value={petSearchTerm}
                        onChange={(e) => setPetSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        disabled={!formData.client_id}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      {!formData.client_id ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Select a client first
                        </div>
                      ) : paginatedPets.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {petSearchTerm ? 'No pets found' : 'No pets available for this client'}
                        </div>
                      ) : (
                        <>
                          {paginatedPets.map(pet => (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, pet_id: pet.id }))}
                              className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                formData.pet_id === pet.id ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{pet.name}</div>
                              {pet.species?.name && <div className="text-xs text-gray-600">{pet.species.name}</div>}
                            </button>
                          ))}
                          {totalPetPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => setPetPage(prev => Math.max(1, prev - 1))}
                                disabled={petPage === 1}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {petPage} of {totalPetPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPetPage(prev => Math.min(totalPetPages, prev + 1))}
                                disabled={petPage === totalPetPages}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faSyringe} className="mr-2 text-[#007c7c]" />
                    Service <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      {paginatedServices.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {serviceSearchTerm ? 'No services found' : 'No services available'}
                        </div>
                      ) : (
                        <>
                          {paginatedServices.map(service => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, service_id: service.id.toString() }))}
                              className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                formData.service_id === service.id.toString() ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{service.name}</div>
                              {service.description && <div className="text-xs text-gray-600">{service.description}</div>}
                              <div className="text-xs text-gray-500">${service.price}</div>
                            </button>
                          ))}
                          {totalServicePages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => setServicePage(prev => Math.max(1, prev - 1))}
                                disabled={servicePage === 1}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {servicePage} of {totalServicePages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setServicePage(prev => Math.min(totalServicePages, prev + 1))}
                                disabled={servicePage === totalServicePages}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Veterinarian Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUserMd} className="mr-2 text-[#007c7c]" />
                    Veterinarian <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search veterinarians..."
                        value={veterinarianSearchTerm}
                        onChange={(e) => setVeterinarianSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      {paginatedVeterinarians.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {veterinarianSearchTerm ? 'No veterinarians found' : 'No veterinarians available'}
                        </div>
                      ) : (
                        <>
                          {paginatedVeterinarians.map(vet => (
                            <button
                              key={vet.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, veterinarian_id: vet.id }))}
                              className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                formData.veterinarian_id === vet.id ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{vet.name || 'Unknown'}</div>
                              {vet.email && <div className="text-xs text-gray-600">{vet.email}</div>}
                            </button>
                          ))}
                          {totalVeterinarianPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => setVeterinarianPage(prev => Math.max(1, prev - 1))}
                                disabled={veterinarianPage === 1}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {veterinarianPage} of {totalVeterinarianPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setVeterinarianPage(prev => Math.min(totalVeterinarianPages, prev + 1))}
                                disabled={veterinarianPage === totalVeterinarianPages}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      required
                      min={isEditMode ? undefined : new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Status
                  </label>
                  <select
                    name="appointment_status"
                    value={formData.appointment_status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Notes <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  placeholder="Additional notes about the appointment..."
                />
              </div>

              {/* Footer with subtle glass effect */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/40 hover:bg-white/60 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>{isEditMode ? 'Update Appointment' : 'Create Appointment'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal; 