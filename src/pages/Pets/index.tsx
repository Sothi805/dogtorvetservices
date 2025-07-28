import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
  faPaw,
  faStethoscope,
  faExclamationTriangle,
  faShieldAlt,
  faEdit,
  faTrash,
  faCalendarPlus,
  faTimes,
  faFileAlt,
  faHeartbeat,
  faCheckCircle,
  faWeightHanging,
  faVenusMars,
  faSyringe,
  faCalendarAlt,
  faInfoCircle,
  faUser,
  faSave,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
//import { User } from 'lucide-react';
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import PetRegistrationModal from "../../components/PetRegistrationModal";
import PetProfileModal from "../../components/PetProfileModal";
import { petsApi, Pet, PetFilters } from "../../api/pets";
import { allergiesApi, Allergy } from "../../api/allergies";
import { vaccinationsApi, Vaccination } from "../../api/vaccinations";
import { appointmentsApi, Appointment, CreateAppointmentRequest } from "../../api/appointments";
import { servicesApi, Service } from "../../api/services";
import { usersApi, User } from "../../api/users";
import { TableSkeleton, MobileCardSkeleton, EmptyState } from "../../components/ui/loading";
import "./index.less";

// Component implementation uses Pet type from API

const Pets: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [detailedPet, setDetailedPet] = useState<Pet | null>(null);
  const [petAppointments, setPetAppointments] = useState<Appointment[]>([]);
  const [appointmentFormData, setAppointmentFormData] = useState<CreateAppointmentRequest & { appointment_time: string }>({
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
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingVeterinarians, setIsLoadingVeterinarians] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    weight: 0,
    color: '',
    dob: '',
    medical_history: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // States for managing allergies and vaccinations in edit mode
  const [editAllergies, setEditAllergies] = useState<any[]>([]);
  const [editVaccinations, setEditVaccinations] = useState<any[]>([]);
  const [newAllergy, setNewAllergy] = useState({ name: '', description: '' });
  const [newVaccination, setNewVaccination] = useState({ 
    name: '', 
    duration_months: 0, 
    vaccination_date: '', 
    description: '',
    createAppointment: true,
    appointmentTime: '10:00'
  });

  // Medical Records Modal States
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [medicalPet, setMedicalPet] = useState<Pet | null>(null);
  const [medicalAllergies, setMedicalAllergies] = useState<any[]>([]);
  const [medicalVaccinations, setMedicalVaccinations] = useState<any[]>([]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medicalNewAllergy, setMedicalNewAllergy] = useState({ name: '', description: '' });
  const [medicalNewVaccination, setMedicalNewVaccination] = useState({ 
    name: '', 
    duration_months: 0, 
    vaccination_date: '', 
    description: '',
    createAppointment: true,
    appointmentTime: '10:00'
  });
  const [isMedicalUpdating, setIsMedicalUpdating] = useState(false);
  const [medicalSuccessMessage, setMedicalSuccessMessage] = useState<string | null>(null);
  const [medicalActiveTab, setMedicalActiveTab] = useState<'history' | 'allergies' | 'vaccinations'>('history');

  // Available allergy and vaccination types
  const [availableAllergies, setAvailableAllergies] = useState<Allergy[]>([]);
  const [availableVaccinations, setAvailableVaccinations] = useState<Vaccination[]>([]);
  const [isLoadingAllergies, setIsLoadingAllergies] = useState(false);
  const [isLoadingVaccinations, setIsLoadingVaccinations] = useState(false);
  
  // Search states for medical records
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [vaccinationSearchTerm, setVaccinationSearchTerm] = useState('');

  // Filtered data for search
  const filteredAllergies = availableAllergies.filter(allergy =>
    (allergy.name.toLowerCase().includes(allergySearchTerm.toLowerCase()) ||
    (allergy.description && allergy.description.toLowerCase().includes(allergySearchTerm.toLowerCase()))) &&
    !medicalAllergies.some(existingAllergy => existingAllergy.id === allergy.id)
  );

  const filteredVaccinations = availableVaccinations.filter(vaccination =>
    vaccination.name.toLowerCase().includes(vaccinationSearchTerm.toLowerCase()) ||
    (vaccination.description && vaccination.description.toLowerCase().includes(vaccinationSearchTerm.toLowerCase()))
  );

  // Data states
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPets, setTotalPets] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Force default to "active" on component mount to show only active pets
  useEffect(() => {
    setStatusFilter("active");
    console.log("🔧 Pets tab opened - filter set to 'active'");
  }, []);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Load pets from API
  useEffect(() => {
    loadPets();
  }, [currentPage, pageSize, statusFilter, genderFilter, searchTerm, sortOrder]);

  const loadPets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: PetFilters = {
        page: currentPage,
        per_page: pageSize,
        sort_by: 'name',
        sort_order: sortOrder,
        include: 'client,species,breed',
        search: searchTerm || undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await petsApi.getPets(filters);
      console.log('🔥 PETS RESPONSE:', response);
      
      // Handle paginated response format
      if (response && response.data && Array.isArray(response.data)) {
        setPets(response.data);
      if (response.meta) {
        setTotalPets(response.meta.total);
        setTotalPages(response.meta.last_page);
      } else {
          setTotalPets(response.data.length);
          setTotalPages(1);
        }
      } else {
        console.error('❌ Invalid pets data format:', response);
        setError('Invalid data format received from server');
        setPets([]);
        setTotalPets(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.log('🚨 PETS ERROR:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to load pets';
      setError(`Failed to load pets: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error loading pets:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePetStatus = async (petId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this pet?`)) return;
    
    try {
      await petsApi.updatePet(petId, {
        status: !currentStatus
      });
      await loadPets(); // Reload pets after status change
    } catch (error: any) {
      console.error("Failed to update pet status", error);
      alert("Failed to update pet status");
    }
  };

  const handleViewProfile = (pet: Pet) => {
    setSelectedPetId(pet.id);
    setIsProfileModalOpen(true);
  };

  // const handleViewMedical = async (pet: Pet) => {
  //   setSelectedPetId(pet.id);
  //   setIsMedicalModalOpen(true);
  //   
  //   // Load detailed pet data with allergies and vaccinations
  //   try {
  //     const detailedPetData = await petsApi.getPet(pet.id, 'client,species,breed,allergies,vaccinations');
  //     setDetailedPet(detailedPetData);
  //   } catch (err: any) {
  //     console.error('❌ Failed to load detailed pet data:', err);
  //     // Fallback to basic pet data
  //     setDetailedPet(pet);
  //   }
  // };

  const handleScheduleAppointment = async (pet: Pet) => {
    setSelectedPetId(pet.id);
    setIsScheduleModalOpen(true);
    
    // Load detailed pet data with allergies and vaccinations
    try {
      console.log('🔍 Loading detailed pet data for schedule appointment:', pet.id);
      const detailedPetData = await petsApi.getPet(pet.id, 'client,species,breed,allergies,vaccinations');
      console.log('📊 Detailed pet data loaded:', detailedPetData);
      // Update the pets array with detailed data so selectedPet will have the updated data
      setPets(prevPets => prevPets.map(p => p.id === pet.id ? detailedPetData : p));
    } catch (err: any) {
      console.error('❌ Failed to load detailed pet data:', err);
      // Keep the original pet data
    }
    
    // Load pet's appointments
    try {
      console.log('🔍 Loading appointments for pet:', pet.id);
      const appointmentsResponse = await appointmentsApi.getAppointments({
        pet_id: pet.id,
        include: 'client,pet,service,user',
        per_page: 50,
        sort_by: 'appointment_date',
        sort_order: 'desc'
      });
      console.log('📊 Appointments loaded:', appointmentsResponse.data);
      setPetAppointments(appointmentsResponse.data);
    } catch (err: any) {
      console.error('❌ Failed to load pet appointments:', err);
      setPetAppointments([]);
    }
    
    // Load services and veterinarians
    try {
      setIsLoadingServices(true);
      setIsLoadingVeterinarians(true);
      
      console.log('🔍 Loading services...');
      const servicesResponse = await servicesApi.getServices({
        status: 'active',
        per_page: 100,
        sort_by: 'name',
        sort_order: 'asc'
      });
      console.log('📊 Services loaded:', servicesResponse);
      setServices(servicesResponse);
      
      console.log('🔍 Loading veterinarians...');
      const veterinariansResponse = await usersApi.getUsers();
      const veterinariansData = veterinariansResponse.data || [];
      console.log('📊 Veterinarians loaded:', veterinariansData);
      setVeterinarians(veterinariansData);
      
      // Set default veterinarian to admin@dogtorvet.com
      let defaultVetId = '';
      const adminUser = veterinariansData.find(vet => vet.email === 'admin@dogtorvet.com');
      if (adminUser) {
        defaultVetId = adminUser.id;
        console.log('🏥 Set default veterinarian to admin:', adminUser.name);
      } else if (veterinariansData && veterinariansData.length > 0) {
        // Fallback to first veterinarian if admin not found
        defaultVetId = veterinariansData[0].id;
        console.log('🏥 Set default veterinarian to first available:', veterinariansData[0].name);
      }
      
      // Set initial form data with default veterinarian
      setAppointmentFormData({
        client_id: pet.client_id || '',
        pet_id: pet.id,
        service_id: '',
        veterinarian_id: defaultVetId,
        appointment_date: new Date().toISOString().split('T')[0], // Set today as default
        appointment_time: '10:00', // Set default time
        duration_minutes: 30,
        appointment_status: 'scheduled',
        notes: ''
      });
    } catch (err: any) {
      console.error('❌ Failed to load services/veterinarians:', err);
      setServices([]);
      setVeterinarians([]);
      
      // Set initial form data without default veterinarian
      setAppointmentFormData({
        client_id: pet.client_id || '',
        pet_id: pet.id,
        service_id: '',
        veterinarian_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00', // Set default time
        duration_minutes: 30,
        appointment_status: 'scheduled',
        notes: ''
      });
    } finally {
      setIsLoadingServices(false);
      setIsLoadingVeterinarians(false);
    }
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPetId(pet.id);
    setEditFormData({
      name: pet.name,
      gender: pet.gender,
      weight: pet.weight,
      color: pet.color || '',
      dob: pet.dob,
      medical_history: pet.medical_history || ''
    });
    
    // Initialize allergies and vaccinations for editing
    setEditAllergies(pet.allergies || []);
    setEditVaccinations(pet.vaccinations || []);
    
    // Reset new item forms
    setNewAllergy({ name: '', description: '' });
    setNewVaccination({ name: '', duration_months: 0, vaccination_date: '', description: '', createAppointment: true, appointmentTime: '10:00' });
    
    setIsEditModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadPets(); // Reload pets after successful registration
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedPetId) return;

    setIsUpdating(true);
    try {
      // Update basic pet information
      await petsApi.updatePet(selectedPetId, editFormData);
      
      // Handle allergies - find the original pet data
      const originalPet = pets.find(p => p.id === selectedPetId);
      const originalAllergies = originalPet?.allergies || [];
      
      // Remove allergies that were deleted
      for (const originalAllergy of originalAllergies) {
        const stillExists = editAllergies.find(a => a.id === originalAllergy.id);
        if (!stillExists) {
          await petsApi.removeAllergy(selectedPetId, originalAllergy.id);
        }
      }
      
      // Add new allergies
      for (const allergy of editAllergies) {
        if (allergy.isNew) {
          // Create the allergy first, then add it to the pet
          const newAllergy = await allergiesApi.createAllergy({
            name: allergy.name,
            description: allergy.description || ''
          });
          await petsApi.addAllergy(selectedPetId, newAllergy.id.toString());
        }
      }
      
      // Handle vaccinations
      const originalVaccinations = originalPet?.vaccinations || [];
      
      // Remove vaccinations that were deleted
      for (const originalVaccination of originalVaccinations) {
        const stillExists = editVaccinations.find(v => v.id === originalVaccination.id);
        if (!stillExists) {
          await petsApi.removeVaccination(selectedPetId, originalVaccination.id.toString());
        }
      }
      
      // Add new vaccinations and create appointments
      let appointmentsCreated = 0;
      for (const vaccination of editVaccinations) {
        if (vaccination.isNew && vaccination.pivot) {
          // Create the vaccination first, then add it to the pet
          const newVaccination = await vaccinationsApi.createVaccination({
            name: vaccination.name,
            description: vaccination.description || '',
            duration_months: vaccination.duration_months
          });
          const result = await petsApi.addVaccination(selectedPetId, {
            vaccination_id: String(newVaccination.id),
            vaccination_date: vaccination.pivot.vaccination_date,
            next_due_date: vaccination.pivot.next_due_date,
            create_next_appointment: vaccination.createAppointment || false,
            appointment_time: vaccination.appointmentTime || '10:00'
          });

          // Track appointment creation for success message
          if (result.appointment_created) {
            appointmentsCreated++;
          }
        }
      }
      
      await loadPets(); // Reload the pets list
      setIsEditModalOpen(false);
      
      // Show success message with appointment creation info
      const newVaccinationsCount = editVaccinations.filter(v => v.isNew).length;
      if (appointmentsCreated > 0) {
        alert(`Pet information updated successfully! ${appointmentsCreated} vaccination appointment(s) have been automatically scheduled for next due dates.`);
      } else if (newVaccinationsCount > 0) {
        alert(`Pet information updated successfully! ${newVaccinationsCount} vaccination(s) added (no appointments scheduled).`);
      } else {
        alert('Pet information updated successfully!');
      }
    } catch (error: any) {
      console.error('Failed to update pet:', error);
      alert('Failed to update pet information. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Allergy management functions
  const handleAddAllergy = () => {
    if (!newAllergy.name.trim()) {
      alert('Please enter an allergy name');
      return;
    }
    
    const newAllergyItem = {
      id: Date.now().toString(), // Temporary ID for new items
      name: newAllergy.name,
      description: newAllergy.description,
      isNew: true // Flag to identify new items
    };
    
    setEditAllergies(prev => [...prev, newAllergyItem]);
    setNewAllergy({ name: '', description: '' });
  };

  const handleRemoveAllergy = (allergyId: string) => {
    if (confirm('Are you sure you want to remove this allergy?')) {
      setEditAllergies(prev => prev.filter(allergy => allergy.id !== allergyId));
    }
  };

  // Vaccination management functions
  const handleAddVaccination = () => {
    if (!newVaccination.name.trim() || !newVaccination.vaccination_date) {
      alert('Please enter vaccination name and date');
      return;
    }
    
    const newVaccinationItem = {
      id: Date.now().toString(), // Temporary ID for new items
      name: newVaccination.name,
      duration_months: newVaccination.duration_months || 12,
      description: newVaccination.description,
      pivot: {
        vaccination_date: newVaccination.vaccination_date,
        next_due_date: calculateNextDueDate(newVaccination.vaccination_date, newVaccination.duration_months || 12)
      },
      createAppointment: newVaccination.createAppointment,
      appointmentTime: newVaccination.appointmentTime,
      isNew: true // Flag to identify new items
    };
    
    setEditVaccinations(prev => [...prev, newVaccinationItem]);
    setNewVaccination({ name: '', duration_months: 0, vaccination_date: '', description: '', createAppointment: true, appointmentTime: '10:00' });
  };

  const handleRemoveVaccination = (vaccinationId: string) => {
    if (confirm('Are you sure you want to remove this vaccination record?')) {
      setEditVaccinations(prev => prev.filter(vaccination => vaccination.id !== vaccinationId));
    }
  };

  const calculateNextDueDate = (vaccinationDate: string, durationMonths: number): string => {
    const date = new Date(vaccinationDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split('T')[0];
  };

  const setTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setNewVaccination(prev => ({ ...prev, vaccination_date: today }));
  };

  const getSpeciesIcon = (species?: string) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      case 'hamster':
        return '🐹';
      case 'parrot':
        return '🦜';
      case 'fish':
        return '🐠';
      case 'guinea pig':
        return '🐹';
      case 'rabbit':
        return '🐰';
      case 'reptile':
        return '🦎';
      case 'turtle':
        return '🐢';
      case 'bird':
        return '🐦';
      default:
        return '🐾';
    }
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '♂️';
      case 'female':
        return '♀️';
      default:
        return '❓';
    }
  };

  const getVaccinationStatus = (pet: Pet) => {
    if (!pet.vaccinations || pet.vaccinations.length === 0) {
      return { status: 'none', color: 'bg-gray-100 text-gray-800' };
    }

    const now = new Date();
    const overdue = pet.vaccinations.some(v => 
      v.pivot && v.pivot.next_due_date && new Date(v.pivot.next_due_date) < now
    );
    const dueSoon = pet.vaccinations.some(v => {
      if (!v.pivot || !v.pivot.next_due_date) return false;
      const dueDate = new Date(v.pivot.next_due_date);
      const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30 && daysDiff > 0;
    });

    if (overdue) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800' };
    } else if (dueSoon) {
      return { status: 'due-soon', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'up-to-date', color: 'bg-green-100 text-green-800' };
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  const handleAppointmentFormChange = (field: string, value: string | number) => {
    setAppointmentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAppointment = async () => {
    console.log('🔍 Creating appointment with data:', appointmentFormData);
    if (!appointmentFormData.service_id || !appointmentFormData.veterinarian_id || !appointmentFormData.appointment_date || !appointmentFormData.appointment_time) {
      alert('Please fill in all required fields (Service, Veterinarian, Date, and Time)');
      return;
    }

    setIsCreatingAppointment(true);
    try {
      // Combine date and time for the API
      const appointmentDateTime = `${appointmentFormData.appointment_date} ${appointmentFormData.appointment_time}:00`;
      const appointmentData = {
        client_id: appointmentFormData.client_id,
        pet_id: appointmentFormData.pet_id,
        service_id: appointmentFormData.service_id,
        veterinarian_id: appointmentFormData.veterinarian_id,
        appointment_date: appointmentDateTime,
        duration_minutes: appointmentFormData.duration_minutes,
        appointment_status: appointmentFormData.appointment_status,
        notes: appointmentFormData.notes
      };
      
      const newAppointment = await appointmentsApi.createAppointment(appointmentData);
      console.log('✅ Appointment created:', newAppointment);
      
      // Reload appointments
      const appointmentsResponse = await appointmentsApi.getAppointments({
        pet_id: appointmentFormData.pet_id,
        include: 'client,pet,service,user',
        per_page: 50,
        sort_by: 'appointment_date',
        sort_order: 'desc'
      });
      setPetAppointments(appointmentsResponse.data);
      
      // Reset form but keep the veterinarian
      setAppointmentFormData({
        client_id: appointmentFormData.client_id,
        pet_id: appointmentFormData.pet_id,
        service_id: '',
        veterinarian_id: appointmentFormData.veterinarian_id, // Keep the selected veterinarian
        appointment_date: new Date().toISOString().split('T')[0], // Set today as default
        appointment_time: '10:00', // Set default time
        duration_minutes: 30,
        appointment_status: 'scheduled',
        notes: ''
      });
      
      // Show success message
      console.log('✅ Appointment scheduled successfully!');
      
    } catch (err: any) {
      console.error('❌ Failed to create appointment:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to schedule appointment. Please try again.';
      alert(`Failed to schedule appointment: ${errorMessage}`);
    } finally {
      setIsCreatingAppointment(false);
    }
  };



  const selectedPet = pets.find(p => p.id === selectedPetId);

  // Medical Records Modal Functions
  const handleViewMedical = async (pet: Pet) => {
    try {
      console.log('🩺 Opening medical records for pet:', pet.name);
      
      // Load available allergy and vaccination types
      setIsLoadingAllergies(true);
      setIsLoadingVaccinations(true);
      
      try {
        const [allergiesResponse, vaccinationsResponse] = await Promise.all([
          allergiesApi.getAllergies('active'),
          vaccinationsApi.getVaccinations('active')
        ]);
        
        setAvailableAllergies(allergiesResponse);
        setAvailableVaccinations(vaccinationsResponse);
        console.log('📋 Available allergies:', allergiesResponse);
        console.log('💉 Available vaccinations:', vaccinationsResponse);
      } catch (error: any) {
        console.error('❌ Failed to load allergy/vaccination types:', error);
        // Continue anyway, user can still see existing data
      } finally {
        setIsLoadingAllergies(false);
        setIsLoadingVaccinations(false);
      }
      
      // Fetch detailed pet data including allergies and vaccinations
      const detailedPetData = await petsApi.getPet(pet.id, 'client,species,breed,allergies,vaccinations');
      console.log('📋 Detailed pet data:', detailedPetData);
      
      setMedicalPet(detailedPetData);
      setMedicalAllergies(detailedPetData.allergies || []);
      setMedicalVaccinations(detailedPetData.vaccinations || []);
      setMedicalHistory(detailedPetData.medical_history || '');
      setMedicalNewAllergy({ name: '', description: '' });
      setMedicalNewVaccination({ 
        name: '', 
        duration_months: 0, 
        vaccination_date: '', 
        description: '',
        createAppointment: true,
        appointmentTime: '10:00'
      });
      setIsMedicalModalOpen(true);
    } catch (error: any) {
      console.error('❌ Failed to load medical records:', error);
      alert('Failed to load medical records. Please try again.');
    }
  };

  const handleMedicalAddAllergy = () => {
    if (!medicalNewAllergy.name.trim()) {
      alert('Please select an allergy type');
      return;
    }
    
    // Find the selected allergy from available allergies
    const selectedAllergy = availableAllergies.find(a => a.id === medicalNewAllergy.name);
    if (!selectedAllergy) {
      alert('Please select a valid allergy type');
      return;
    }
    
    const newAllergyItem = {
      id: selectedAllergy.id,
      name: selectedAllergy.name,
      description: selectedAllergy.description,
      isNew: true
    };
    
    setMedicalAllergies(prev => [...prev, newAllergyItem]);
    setMedicalNewAllergy({ name: '', description: '' });
  };

  const handleMedicalRemoveAllergy = (allergyId: string) => {
    if (confirm('Are you sure you want to remove this allergy?')) {
      setMedicalAllergies(prev => prev.filter(allergy => allergy.id !== allergyId));
    }
  };

  const handleMedicalAddVaccination = () => {
    if (!medicalNewVaccination.name.trim() || !medicalNewVaccination.vaccination_date) {
      alert('Please select a vaccination type and date');
      return;
    }
    
    // Find the selected vaccination from available vaccinations
    const selectedVaccination = availableVaccinations.find(v => v.id === medicalNewVaccination.name);
    if (!selectedVaccination) {
      alert('Please select a valid vaccination type');
      return;
    }
    
    const newVaccinationItem = {
      id: selectedVaccination.id,
      name: selectedVaccination.name,
      duration_months: selectedVaccination.duration_months,
      description: selectedVaccination.description,
      pivot: {
        vaccination_date: medicalNewVaccination.vaccination_date,
        next_due_date: calculateNextDueDate(medicalNewVaccination.vaccination_date, selectedVaccination.duration_months)
      },
      createAppointment: medicalNewVaccination.createAppointment,
      appointmentTime: medicalNewVaccination.appointmentTime,
      isNew: true
    };
    
    setMedicalVaccinations(prev => [...prev, newVaccinationItem]);
    setMedicalNewVaccination({ 
      name: '', 
      duration_months: 0, 
      vaccination_date: '', 
      description: '',
      createAppointment: true,
      appointmentTime: '10:00'
    });
  };

  const handleMedicalRemoveVaccination = (vaccinationId: string) => {
    if (confirm('Are you sure you want to remove this vaccination record?')) {
      setMedicalVaccinations(prev => prev.filter(vaccination => vaccination.id !== vaccinationId));
    }
  };

  const handleMedicalSaveChanges = async () => {
    if (!medicalPet) return;
    
    setIsMedicalUpdating(true);
    setMedicalSuccessMessage(null);
    try {
      console.log('💾 Saving medical records for pet:', medicalPet.name);
      
      // Save medical history if changed
      if (medicalHistory !== medicalPet.medical_history) {
        try {
          await petsApi.updatePet(medicalPet.id, { medical_history: medicalHistory });
          console.log('✅ Medical history updated');
        } catch (error: any) {
          console.error('❌ Failed to update medical history:', error);
          setMedicalSuccessMessage('Failed to update medical history');
          return;
        }
      }
      
      // Save allergies
      const newAllergies = medicalAllergies.filter(a => a.isNew);
      for (const allergy of newAllergies) {
        try {
          await petsApi.addAllergy(medicalPet.id, allergy.id);
          console.log('✅ Allergy added:', allergy.name);
        } catch (error: any) {
          console.error('❌ Failed to add allergy:', error);
          setMedicalSuccessMessage(`Failed to add allergy: ${allergy.name}`);
          return;
        }
      }
      
      // Save vaccinations
      const newVaccinations = medicalVaccinations.filter(v => v.isNew);
      let appointmentsCreated = 0;
      
      for (const vaccination of newVaccinations) {
        try {
          await petsApi.addVaccination(medicalPet.id, {
            vaccination_id: vaccination.id,
            vaccination_date: vaccination.pivot.vaccination_date,
            next_due_date: vaccination.pivot.next_due_date,
            notes: vaccination.description,
            create_next_appointment: vaccination.createAppointment,
            appointment_time: vaccination.appointmentTime
          });
          console.log('✅ Vaccination added:', vaccination.name);
          appointmentsCreated++;
        } catch (error: any) {
          console.error('❌ Failed to add vaccination:', error);
          setMedicalSuccessMessage(`Failed to add vaccination: ${vaccination.name}`);
          return;
        }
      }
      
      // Show success message
      const newAllergiesCount = newAllergies.length;
      const newVaccinationsCount = newVaccinations.length;
      const historyUpdated = medicalHistory !== medicalPet.medical_history;
      
      let successMessage = `Medical records updated successfully!`;
      if (historyUpdated) {
        successMessage += ` Medical history updated.`;
      }
      if (newAllergiesCount > 0) {
        successMessage += ` ${newAllergiesCount} allergy(ies) added.`;
      }
      if (newVaccinationsCount > 0) {
        successMessage += ` ${newVaccinationsCount} vaccination(s) added.`;
      }
      if (appointmentsCreated > 0) {
        successMessage += ` ${appointmentsCreated} appointment(s) scheduled.`;
      }
      
      setMedicalSuccessMessage(successMessage);
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setIsMedicalModalOpen(false);
        setMedicalSuccessMessage(null);
        loadPets(); // Refresh the pets list
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Failed to save medical records:', error);
      setMedicalSuccessMessage('Failed to save medical records. Please try again.');
    } finally {
      setIsMedicalUpdating(false);
    }
  };

  const setMedicalTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setMedicalNewVaccination(prev => ({ ...prev, vaccination_date: today }));
  };

  return (
    <Layout title="Pets">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search pets..."
          />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-[9px] rounded-md flex items-center justify-center space-x-2 transition-all duration-200 min-h-[42px] whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Register New Pet</span>
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
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as "all" | "male" | "female")}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
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
                setGenderFilter("all");
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
              className={`text-lg transition-transform duration-300 ${
                isMenuVisible ? 'transform rotate-0' : 'transform rotate-180'
              }`} 
            />
          </button>

          <div className={`flex items-center space-x-4 transition-all duration-500 ease-in-out ${
            isMenuVisible 
              ? 'transform translate-x-0 opacity-100 max-w-full' 
              : 'transform -translate-x-full opacity-0 max-w-0'
          }`}>
            <div className="flex space-x-2 flex-shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "all" ? "bg-gray-800" : "bg-gray-400 hover:bg-gray-600"
                }`}
              >
                <span>All</span>
              </button>

              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "active" ? "bg-green-500" : "bg-green-300 hover:bg-green-400"
                }`}
              >
                <span>Active</span>{" "}
                <FontAwesomeIcon icon={faCheck} />
              </button>

              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "inactive" ? "bg-red-500" : "bg-red-300 hover:bg-red-400"
                }`}
              >
                <span>Inactive</span>{" "}
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Gender :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as "all" | "male" | "female")}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Sort :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Show :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>



        {/* Error State */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            {error.includes('Failed to load') && (
              <button
                onClick={loadPets}
                className="ml-2 underline hover:no-underline focus:outline-none"
              >
                Retry Loading
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <>
            <MobileCardSkeleton items={5} />
            <div className="hidden lg:block">
              <TableSkeleton rows={5} cols={6} />
          </div>
          </>
        ) : (
          <>
            {/* Debug log for pets array */}
            {console.log('Current pets in table:', pets)}
            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {pets.length === 0 ? (
                <EmptyState
                  icon="🐾"
                  title="No pets found"
                  message="No pets match your current search and filter criteria. Try adjusting your filters or register a new pet."
                  actionText="Register New Pet"
                  onAction={() => setIsModalOpen(true)}
                />
              ) : (
                pets.map((pet) => {
                  const vaccinationStatus = getVaccinationStatus(pet);
                  return (
                    <div key={pet.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">{getSpeciesIcon(pet.species?.name)}</div>
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center">
                              {pet.name}
                              {pet.allergies && pet.allergies.length > 0 && (
                                <FontAwesomeIcon icon={faShieldAlt} className="ml-2 text-red-500 text-xs" title="Has allergies" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize flex items-center">
                              <span className="mr-1">{getGenderIcon(pet.gender)}</span>
                              {pet.gender}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          pet.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pet.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="text-sm font-medium">{pet.client?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Species & Breed</p>
                          <p className="text-sm font-medium capitalize">{pet.species?.name}</p>
                          <p className="text-xs text-gray-400">{pet.breed?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Age & Weight</p>
                          <p className="text-sm font-medium">{calculateAge(pet.dob)}</p>
                          <p className="text-xs text-gray-400">{pet.weight} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vaccinations</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vaccinationStatus.color}`}>
                            {vaccinationStatus.status}
                          </span>
                          {vaccinationStatus.status === 'overdue' && (
                            <FontAwesomeIcon icon={faExclamationTriangle} className="ml-1 text-red-500 text-xs" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Top row - 3 buttons */}
                        <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewProfile(pet)}
                          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPaw} className="mr-1" />
                          Profile
                        </button>
                        <button 
                          onClick={() => handleViewMedical(pet)}
                          className="flex-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faStethoscope} className="mr-1" />
                          Medical
                        </button>
                        <button 
                          onClick={() => handleScheduleAppointment(pet)}
                          className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faCalendarPlus} className="mr-1" />
                          Schedule
                        </button>
                        </div>
                        
                        {/* Bottom row - 2 buttons */}
                        <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditPet(pet)}
                            className="flex-1 bg-orange-50 text-orange-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                        >
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Edit
                        </button>
                        {pet.status ? (
                          <button 
                            onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                              className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                              <FontAwesomeIcon icon={faTrash} className="mr-1" />
                              Deactivate
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                              className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                              <FontAwesomeIcon icon={faCheck} className="mr-1" />
                              Activate
                          </button>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species & Breed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age & Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccinations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl mb-2">🐾</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No pets found</h3>
                            <p className="text-gray-600 text-center mb-4">No pets match your current search and filter criteria.</p>
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="bg-[#007c7c] text-white px-4 py-2 rounded-lg hover:bg-[#005f5f] transition-colors"
                            >
                              Register New Pet
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pets.map((pet) => {
                        const vaccinationStatus = getVaccinationStatus(pet);
                        return (
                          <tr key={pet.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-2xl mr-3">{getSpeciesIcon(pet.species?.name)}</div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center">
                                    {pet.name}
                                    {pet.allergies && pet.allergies.length > 0 && (
                                      <FontAwesomeIcon icon={faShieldAlt} className="ml-2 text-red-500 text-xs" title="Has allergies" />
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 capitalize flex items-center">
                                    <span className="mr-1">{getGenderIcon(pet.gender)}</span>
                                    {pet.gender}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pet.client?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">{pet.species?.name}</div>
                              <div className="text-sm text-gray-500">{pet.breed?.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{calculateAge(pet.dob)}</div>
                              <div className="text-gray-500">{pet.weight} kg</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vaccinationStatus.color}`}>
                                {vaccinationStatus.status}
                              </span>
                              {vaccinationStatus.status === 'overdue' && (
                                <FontAwesomeIcon icon={faExclamationTriangle} className="ml-1 text-red-500 text-xs" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleViewProfile(pet)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors mr-2"
                                title="View Profile"
                              >
                                <FontAwesomeIcon icon={faPaw} className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleViewMedical(pet)}
                                className="text-purple-600 hover:text-purple-800 mr-3" 
                                title="Medical Records"
                              >
                                <FontAwesomeIcon icon={faStethoscope} />
                              </button>
                              <button 
                                onClick={() => handleScheduleAppointment(pet)}
                                className="text-green-600 hover:text-green-900 mr-3" 
                                title="Schedule Appointment"
                              >
                                <FontAwesomeIcon icon={faCalendarPlus} />
                              </button>
                              <button 
                                onClick={() => handleEditPet(pet)}
                                className="text-orange-600 hover:text-orange-900 mr-3" 
                                title="Edit Pet"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              {pet.status ? (
                                <button 
                                  onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Set Inactive"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Set Active"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * pageSize, totalPets)}</span> of{' '}
                        <span className="font-medium">{totalPets}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}



        {/* Medical Records Modal */}
        {isMedicalModalOpen && medicalPet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Apple-like liquid glass background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
              onClick={() => setIsMedicalModalOpen(false)}
            />
            
            {/* Minimal floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
              <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
                  </div>
                  
            {/* Modal container with Apple-like transparent glass effect */}
            <div className="relative w-full max-w-4xl max-h-[95vh]">
              {/* Transparent glass effect with drop shadow */}
              <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
                {/* Header with subtle glass effect */}
                <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faFileAlt} className="mr-3 text-[#007c7c]" />
                    Medical Records - {medicalPet.name}
                  </h2>
                  <button
                    onClick={() => setIsMedicalModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    disabled={isMedicalUpdating}
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
                  </button>
                    </div>

                {/* Success Message */}
                {medicalSuccessMessage && (
                  <div className="mx-6 mt-4 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-3" />
                      <span className="text-green-800 font-medium">{medicalSuccessMessage}</span>
                    </div>
                  </div>
                )}

                {/* Content with transparent glass styling */}
                <div className="max-h-[calc(95vh-140px)] overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Pet Information - Compact */}
                    <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#007c7c]" />
                        Pet Information
                        </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                          <div className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm text-gray-900">
                            {medicalPet.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Species</label>
                          <div className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm text-gray-900">
                            {medicalPet.species?.name || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
                          <div className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm text-gray-900">
                            {medicalPet.breed?.name || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                          <div className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm text-gray-900">
                            {medicalPet.dob ? calculateAge(medicalPet.dob) : 'Not specified'}
                          </div>
                        </div>
                    </div>
                    </div>

                    {/* Medical Records Tabs */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                      <div className="flex border-b border-white/20">
                        <button
                          onClick={() => setMedicalActiveTab('history')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            medicalActiveTab === 'history'
                              ? 'bg-white/20 text-[#007c7c] border-b-2 border-[#007c7c]'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
                          }`}
                        >
                          <FontAwesomeIcon icon={faHeartbeat} className="mr-2" />
                          Medical History
                        </button>
                        <button
                          onClick={() => setMedicalActiveTab('allergies')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            medicalActiveTab === 'allergies'
                              ? 'bg-white/20 text-[#007c7c] border-b-2 border-[#007c7c]'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
                          }`}
                        >
                          <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                          Allergies ({medicalAllergies?.length || 0})
                        </button>
                        <button
                          onClick={() => setMedicalActiveTab('vaccinations')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            medicalActiveTab === 'vaccinations'
                              ? 'bg-white/20 text-[#007c7c] border-b-2 border-[#007c7c]'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
                          }`}
                        >
                          <FontAwesomeIcon icon={faSyringe} className="mr-2" />
                          Vaccinations ({medicalVaccinations?.length || 0})
                        </button>
                    </div>

                      {/* History Tab */}
                      {medicalActiveTab === 'history' && (
                        <div className="p-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faHeartbeat} className="mr-2 text-blue-500" />
                            Medical History
                          </h4>
                          
                          {/* Current Medical History */}
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Current Medical History</h5>
                            {medicalHistory ? (
                              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-blue-200/30">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                      {medicalHistory}
                    </div>
                    </div>
                                  <button 
                                    onClick={() => setMedicalHistory('')}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100/20 transition-colors ml-2"
                                    title="Clear history"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                  </button>
                  </div>
                </div>
                            ) : (
                              <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/30">
                                <p className="text-gray-500 italic text-sm">No medical history recorded</p>
                              </div>
                            )}
                  </div>
                  
                          {/* Edit Medical History */}
                          <div className="border-t border-blue-200/30 pt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Update Medical History</h5>
                            <div className="space-y-3">
                              <textarea
                                value={medicalHistory}
                                onChange={(e) => setMedicalHistory(e.target.value)}
                                placeholder="Enter medical history, conditions, treatments, surgeries, medications, or any other relevant medical information..."
                                className="w-full h-32 px-3 py-2 bg-white/30 backdrop-blur-sm border border-blue-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                  Include any medical conditions, treatments, surgeries, medications, or other relevant information
                                </p>
                                <div className="text-xs text-gray-400">
                                  {medicalHistory.length} characters
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Allergies Tab */}
                      {medicalActiveTab === 'allergies' && (
                        <div className="p-6">
                          {/* Existing Allergies */}
                          <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                              <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-red-500" />
                              Current Allergies
                            </h4>
                            <div className="space-y-3">
                              {medicalAllergies && medicalAllergies.length > 0 ? (
                                medicalAllergies.map((allergy) => (
                                  <div key={allergy.id} className="flex justify-between items-center p-3 bg-white/20 backdrop-blur-sm border border-red-200/30 rounded-lg">
                                    <div>
                                      <div className="font-medium text-red-800 text-sm">
                                {allergy.name}
                                        {allergy.isNew && <span className="text-xs text-green-600 ml-2">(New)</span>}
                  </div>
                            {allergy.description && (
                                        <div className="text-xs text-red-600 mt-1">{allergy.description}</div>
                            )}
                          </div>
                                    <button 
                                      onClick={() => handleMedicalRemoveAllergy(allergy.id)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100/20 transition-colors"
                                      title="Remove allergy"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                    </button>
                      </div>
                                ))
                              ) : (
                                <p className="text-red-600 italic text-sm">No allergies recorded</p>
                              )}
                  </div>
                </div>

                          {/* Add New Allergy */}
                          <div className="border-t border-red-200/30 pt-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Add New Allergy</h4>
                            <div className="space-y-3">
                              <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                  type="text"
                                  placeholder="Search allergies..."
                                  value={allergySearchTerm}
                                  onChange={(e) => setAllergySearchTerm(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-white/30 backdrop-blur-sm border border-red-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                                  disabled={isLoadingAllergies}
                                />
                              </div>
                              <div className="max-h-32 overflow-y-auto bg-white/20 backdrop-blur-sm border border-red-200/30 rounded-lg">
                                {filteredAllergies.length === 0 ? (
                                  <div className="p-3 text-center text-gray-500 text-xs">
                                    {allergySearchTerm ? 'No allergies found' : 'No allergies available'}
                                  </div>
                                ) : (
                                  filteredAllergies.map(allergy => (
                                    <button
                                      key={allergy.id}
                                      type="button"
                                      onClick={() => {
                                        setMedicalNewAllergy(prev => ({ ...prev, name: allergy.id }));
                                        setAllergySearchTerm('');
                                      }}
                                      className="w-full p-2 text-left hover:bg-white/30 transition-colors text-gray-900 text-sm"
                                    >
                                      <div className="font-medium">{allergy.name}</div>
                                      {allergy.description && <div className="text-xs text-gray-600">{allergy.description}</div>}
                                    </button>
                                  ))
                      )}
                  </div>
                              {medicalNewAllergy.name && (
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-red-700">
                                    Selected: {availableAllergies.find(a => a.id === medicalNewAllergy.name)?.name}
                                  </div>
                                  <button 
                                    onClick={handleMedicalAddAllergy}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    disabled={isLoadingAllergies}
                                  >
                                    {isLoadingAllergies ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />
                                        Add
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vaccinations Tab */}
                      {medicalActiveTab === 'vaccinations' && (
                        <div className="p-6">
                          {/* Existing Vaccinations */}
                          <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                              <FontAwesomeIcon icon={faSyringe} className="mr-2 text-blue-500" />
                              Current Vaccinations
                            </h4>
                            <div className="space-y-3">
                              {medicalVaccinations && medicalVaccinations.length > 0 ? (
                                medicalVaccinations.map((vaccination) => (
                                  <div key={vaccination.id} className="flex justify-between items-center p-3 bg-white/20 backdrop-blur-sm border border-blue-200/30 rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium text-blue-800 text-sm">
                                {vaccination.name}
                                        {vaccination.isNew && <span className="text-xs text-green-600 ml-2">(New)</span>}
                            </div>
                                      <div className="text-xs text-blue-600 mt-1">
                                        Duration: {vaccination.duration_months} months
                                      </div>
                                      {vaccination.pivot && (
                                        <>
                                          {vaccination.pivot.vaccination_date && (
                                            <div className="text-xs text-blue-600">
                                              Given: {vaccination.pivot.vaccination_date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(vaccination.pivot.vaccination_date).toLocaleDateString()}
                                            </div>
                                          )}
                                          {vaccination.pivot.next_due_date && (
                                            <div className="text-xs text-blue-600">
                                              Next Due: {new Date(vaccination.pivot.next_due_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </>
                                      )}
                            {vaccination.description && (
                                        <div className="text-xs text-blue-600 mt-1">{vaccination.description}</div>
                              )}
                                 </div>
                                    <button 
                                      onClick={() => handleMedicalRemoveVaccination(vaccination.id)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100/20 transition-colors ml-2"
                                      title="Remove vaccination"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-blue-600 italic text-sm">No vaccinations recorded</p>
                              )}
                              </div>
                          </div>

                          {/* Add New Vaccination */}
                          <div className="border-t border-blue-200/30 pt-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Add New Vaccination</h4>
                            <div className="space-y-3">
                              <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                  type="text"
                                  placeholder="Search vaccinations..."
                                  value={vaccinationSearchTerm}
                                  onChange={(e) => setVaccinationSearchTerm(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-white/30 backdrop-blur-sm border border-blue-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                  disabled={isLoadingVaccinations}
                                />
                              </div>
                              <div className="max-h-32 overflow-y-auto bg-white/20 backdrop-blur-sm border border-blue-200/30 rounded-lg">
                                {filteredVaccinations.length === 0 ? (
                                  <div className="p-3 text-center text-gray-500 text-xs">
                                    {vaccinationSearchTerm ? 'No vaccinations found' : 'No vaccinations available'}
                                  </div>
                                ) : (
                                  filteredVaccinations.map(vaccination => (
                                    <button
                                      key={vaccination.id}
                                      type="button"
                                      onClick={() => {
                                        setMedicalNewVaccination(prev => ({ ...prev, name: vaccination.id }));
                                        setVaccinationSearchTerm('');
                                      }}
                                      className="w-full p-2 text-left hover:bg-white/30 transition-colors text-gray-900 text-sm"
                                    >
                                      <div className="font-medium">{vaccination.name}</div>
                                      <div className="text-xs text-gray-600">Duration: {vaccination.duration_months} months</div>
                                      {vaccination.description && <div className="text-xs text-gray-600">{vaccination.description}</div>}
                                    </button>
                                  ))
                            )}
                          </div>
                              {medicalNewVaccination.name && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm text-blue-700">
                                      Selected: {availableVaccinations.find(v => v.id === medicalNewVaccination.name)?.name}
                      </div>
                                    <button 
                                      onClick={handleMedicalAddVaccination}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                                      disabled={isLoadingVaccinations}
                                    >
                                      {isLoadingVaccinations ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />
                                          Add
                                        </>
                                      )}
                                    </button>
                          </div>
                                  
                                  {/* Vaccination Date */}
                                  <div className="flex gap-2">
                                    <input 
                                      type="date" 
                                      value={medicalNewVaccination.vaccination_date}
                                      onChange={(e) => setMedicalNewVaccination(prev => ({ ...prev, vaccination_date: e.target.value }))}
                                      className="flex-1 px-3 py-2 bg-white/30 backdrop-blur-sm border border-blue-300/50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    />
                                    <button 
                                      type="button"
                                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                      onClick={setMedicalTodayDate}
                                    >
                                      Today
                                    </button>
                                  </div>
                                  
                                  {/* Appointment Scheduling */}
                                  <div className="bg-green-50/50 backdrop-blur-sm border border-green-200/30 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <input 
                                        type="checkbox" 
                                        id="medicalCreateAppointment"
                                        checked={medicalNewVaccination.createAppointment}
                                        onChange={(e) => setMedicalNewVaccination(prev => ({ ...prev, createAppointment: e.target.checked }))}
                                        className="w-4 h-4 text-green-600 bg-white/30 border-green-300/50 rounded"
                                      />
                                      <label htmlFor="medicalCreateAppointment" className="text-sm font-medium text-green-800">
                                        Schedule next appointment
                                      </label>
                                    </div>
                                    {medicalNewVaccination.createAppointment && (
                                      <div className="ml-6 flex items-center space-x-2">
                                        <span className="text-xs text-green-700">Time:</span>
                                        <input 
                                          type="time" 
                                          value={medicalNewVaccination.appointmentTime}
                                          onChange={(e) => setMedicalNewVaccination(prev => ({ ...prev, appointmentTime: e.target.value }))}
                                          className="px-2 py-1 border border-green-300/50 rounded text-xs bg-white/30 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                                        />
                                        <span className="text-xs text-green-600">
                                          (Next due: {medicalNewVaccination.vaccination_date && medicalNewVaccination.name ? 
                                            (() => {
                                              const selectedVaccination = availableVaccinations.find(v => v.id === medicalNewVaccination.name);
                                              return selectedVaccination ? 
                                                new Date(calculateNextDueDate(medicalNewVaccination.vaccination_date, selectedVaccination.duration_months)).toLocaleDateString() : 
                                                'Select vaccination type first';
                                            })() : 
                                            'Select date & vaccination type first'})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-white/20 bg-white/10">
                  <div className="flex space-x-3">
                  <button
                      onClick={() => setIsMedicalModalOpen(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                      disabled={isMedicalUpdating}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleMedicalSaveChanges}
                      disabled={isMedicalUpdating}
                      className="px-6 py-2 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMedicalUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="text-sm" />
                          <span>Save Medical Records</span>
                        </>
                      )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Schedule Appointment Modal */}
        {isScheduleModalOpen && selectedPet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Apple-like liquid glass background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
              onClick={() => {
                setIsScheduleModalOpen(false);
                setPetAppointments([]);
              }}
            />
            
            {/* Minimal floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
              <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
                </div>

            {/* Modal container with Apple-like transparent glass effect */}
            <div className="relative w-full max-w-6xl h-[90vh]">
              {/* Transparent glass effect with drop shadow */}
              <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40 h-full flex flex-col">
                {/* Header with subtle glass effect */}
                <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#007c7c]" />
                    Schedule Appointment - {selectedPet.name}
                  </h2>
                  <button
                    onClick={() => {
                      setIsScheduleModalOpen(false);
                      setPetAppointments([]);
                    }}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
                  </button>
                </div>

                {/* Content with transparent glass styling */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Left Panel - Appointment Records */}
                    <div className="space-y-6">
                      {/* Scheduled Appointments */}
                        <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                          <FontAwesomeIcon icon={faCalendarPlus} className="mr-3 text-[#007c7c]" />
                            Scheduled Appointments ({petAppointments.filter(apt => apt.appointment_status === 'scheduled').length})
                        </h3>
                          {petAppointments.filter(apt => apt.appointment_status === 'scheduled').length > 0 ? (
                            <div className="space-y-2">
                              {petAppointments.filter(apt => apt.appointment_status === 'scheduled').map((appointment) => (
                                <div key={appointment.id} className="bg-blue-50/50 backdrop-blur-sm p-3 rounded-xl border border-blue-200/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <FontAwesomeIcon icon={faCalendarPlus} className="mr-2 text-blue-500 w-3" />
                                      <span className="font-medium text-blue-800">{appointment.service?.name || 'Unknown Service'}</span>
                                    </div>
                                    <span className="text-xs text-blue-600">
                                      {new Date(appointment.appointment_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    <FontAwesomeIcon icon={faUser} className="mr-1 w-3" />
                                    {appointment.user?.name || 'Unknown Vet'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50/50 backdrop-blur-sm p-3 rounded-xl border border-gray-200/30">
                              <div className="text-gray-600 flex items-center">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-400 w-4" />
                                No scheduled appointments
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Previous Appointments */}
                      <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-gray-600" />
                            Previous Appointments ({petAppointments.filter(apt => apt.appointment_status !== 'scheduled').length})
                        </h3>
                          {petAppointments.filter(apt => apt.appointment_status !== 'scheduled').length > 0 ? (
                            <div className="space-y-2">
                              {petAppointments.filter(apt => apt.appointment_status !== 'scheduled').map((appointment) => (
                                <div key={appointment.id} className="bg-green-50/50 backdrop-blur-sm p-3 rounded-xl border border-green-200/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-500 w-3" />
                                      <span className="font-medium text-green-800">{appointment.service?.name || 'Unknown Service'}</span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      appointment.appointment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                      appointment.appointment_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {appointment.appointment_status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 w-3" />
                                    {new Date(appointment.appointment_date).toLocaleDateString()}
                                    <span className="mx-2">•</span>
                                    <FontAwesomeIcon icon={faUser} className="mr-1 w-3" />
                                    {appointment.user?.name || 'Unknown Vet'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50/50 backdrop-blur-sm p-3 rounded-xl border border-gray-200/30">
                              <div className="text-gray-600 flex items-center">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-400 w-4" />
                                No previous appointments found
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Right Panel - New Appointment Form */}
                  <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                          <FontAwesomeIcon icon={faCalendarPlus} className="mr-3 text-[#007c7c]" />
                          New Appointment
                        </h3>
                        <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                            <input 
                              type="date" 
                              value={appointmentFormData.appointment_date}
                              onChange={(e) => handleAppointmentFormChange('appointment_date', e.target.value)}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Time</label>
                            <input 
                              type="time" 
                              value={appointmentFormData.appointment_time}
                              onChange={(e) => handleAppointmentFormChange('appointment_time', e.target.value)}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                            />
                          </div>
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                            <select 
                              value={appointmentFormData.service_id}
                              onChange={(e) => handleAppointmentFormChange('service_id', e.target.value)}
                              disabled={isLoadingServices}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {isLoadingServices ? 'Loading services...' : 
                                 services && services.length > 0 ? 'Select a service' : 'No services available'}
                              </option>
                              {services && services.length > 0 && services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {service.name} - ${typeof service.price === 'string' ? parseFloat(service.price) : service.price}
                                </option>
                              ))}
                            </select>
                          {!appointmentFormData.service_id && !isLoadingServices && services.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Please select a service to continue</p>
                          )}
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Veterinarian</label>
                            <select 
                              value={appointmentFormData.veterinarian_id}
                              onChange={(e) => handleAppointmentFormChange('veterinarian_id', e.target.value)}
                              disabled={isLoadingVeterinarians}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {isLoadingVeterinarians ? 'Loading veterinarians...' : 
                                 veterinarians && veterinarians.length > 0 ? 'Select a veterinarian' : 'No veterinarians available'}
                              </option>
                              {veterinarians && veterinarians.length > 0 && veterinarians.map((vet) => (
                                <option key={vet.id} value={vet.id}>
                                  {vet.name} ({vet.role})
                                </option>
                              ))}
                            </select>
                          {!appointmentFormData.veterinarian_id && !isLoadingVeterinarians && veterinarians.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Please select a veterinarian to continue</p>
                          )}
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                            <input 
                              type="number" 
                              value={appointmentFormData.duration_minutes}
                              onChange={(e) => handleAppointmentFormChange('duration_minutes', parseInt(e.target.value))}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                              min="15"
                              max="180"
                            />
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea 
                              value={appointmentFormData.notes}
                              onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                              placeholder="Additional notes..."
                            />
                          </div>
                          
                          <button 
                            onClick={handleCreateAppointment}
                          disabled={isCreatingAppointment || !appointmentFormData.service_id || !appointmentFormData.veterinarian_id || !appointmentFormData.appointment_date || !appointmentFormData.appointment_time}
                          className="w-full px-6 py-3 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isCreatingAppointment ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCalendarPlus} className="w-4 h-4" />
                              Schedule Appointment
                            </>
                          )}
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
                                    
                  {/* Footer */}
                <div className="flex justify-end p-6 border-t border-white/20 bg-white/10 flex-shrink-0">
                    <button 
                      onClick={() => {
                        setIsScheduleModalOpen(false);
                        setPetAppointments([]);
                      }}
                      className="px-6 py-2 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Pet Modal */}
        {isEditModalOpen && selectedPet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Apple-like liquid glass background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
              onClick={() => setIsEditModalOpen(false)}
            />
            
            {/* Minimal floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
              <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
            </div>
            
            {/* Modal container with Apple-like transparent glass effect */}
            <div className="relative w-full max-w-5xl max-h-[90vh]">
              {/* Transparent glass effect with drop shadow */}
              <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
                {/* Header with subtle glass effect */}
                <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faEdit} className="mr-3 text-[#007c7c]" />
                  Edit Pet - {selectedPet.name}
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    disabled={isUpdating}
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
                  </button>
                </div>
              
                              {/* Content with transparent glass styling */}
                <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
                  <div className="p-6 space-y-6">
                {/* Basic Information */}
                    <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#007c7c]" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                      <input 
                        type="text" 
                        value={editFormData.name} 
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm" 
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select 
                        value={editFormData.gender} 
                        onChange={(e) => handleEditFormChange('gender', e.target.value)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={editFormData.weight} 
                        onChange={(e) => handleEditFormChange('weight', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm" 
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <input 
                        type="text" 
                        value={editFormData.color} 
                        onChange={(e) => handleEditFormChange('color', e.target.value)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm" 
                      />
                    </div>
                    <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input 
                        type="date" 
                        value={editFormData.dob} 
                        onChange={(e) => handleEditFormChange('dob', e.target.value)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm" 
                      />
                    </div>
                    <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                      <textarea 
                        value={editFormData.medical_history} 
                        onChange={(e) => handleEditFormChange('medical_history', e.target.value)}
                            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm resize-none" 
                        rows={3}
                        placeholder="Enter medical history..."
                      />
                    </div>
                  </div>
                </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-white/20 bg-white/10">
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveChanges}
                      disabled={isUpdating}
                      className="px-6 py-2 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="text-sm" />
                          <span>Save All Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pet Registration Modal */}
        {isModalOpen && (
          <PetRegistrationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
        )}

      {/* Pet Profile Modal */}
      <PetProfileModal
        isOpen={isProfileModalOpen}
        petId={selectedPetId}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
    </Layout>
  );
};

export default Pets; 