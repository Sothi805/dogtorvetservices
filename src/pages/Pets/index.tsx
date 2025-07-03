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
} from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
//import { User } from 'lucide-react';
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import PetRegistrationModal from "../../components/PetRegistrationModal";
import { petsApi, Pet, PetFilters } from "../../api/pets";
import { allergiesApi } from "../../api/allergies";
import { vaccinationsApi } from "../../api/vaccinations";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState, InlineSpinner } from "../../components/ui/loading";

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
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
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
      setPets(response.data);
      setTotalPets(response.meta.total);
      setTotalPages(response.meta.last_page);
    } catch (err: any) {
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

  const handleViewMedical = (pet: Pet) => {
    setSelectedPetId(pet.id);
    setIsMedicalModalOpen(true);
  };

  const handleScheduleAppointment = (pet: Pet) => {
    setSelectedPetId(pet.id);
    setIsScheduleModalOpen(true);
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



  const selectedPet = pets.find(p => p.id === selectedPetId);

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

                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleViewProfile(pet)}
                          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPaw} className="mr-1" />
                          Profile
                        </button>
                        <button 
                          onClick={() => handleViewMedical(pet)}
                          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
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
                        <button 
                          onClick={() => handleEditPet(pet)}
                          className="bg-orange-50 text-orange-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        {pet.status ? (
                          <button 
                            onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleTogglePetStatus(pet.id, pet.status)}
                            className="bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
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
                                className="text-blue-600 hover:text-blue-900 mr-3" 
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

        {/* Pet Profile Modal */}
        {isProfileModalOpen && selectedPet && (
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto !bg-white !border-gray-200 !text-gray-900">
              <DialogHeader className="!bg-white">
                <DialogTitle className="flex items-center gap-2 !text-gray-900">
                  <span className="text-2xl">🐾</span>
                  Pet Profile
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 !bg-white p-4">
                {/* Basic Information */}
                <div className="space-y-4 !bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🐕</span>
                    <h3 className="text-lg font-semibold !text-gray-900">Basic Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Name:</span>
                      <span className="!text-gray-900">{selectedPet.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Owner:</span>
                      <span className="!text-gray-900">{selectedPet.client?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Species:</span>
                      <span className="!text-gray-900">{selectedPet.species?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Breed:</span>
                      <span className="!text-gray-900">{selectedPet.breed?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Gender:</span>
                      <span className="!text-gray-900 capitalize flex items-center">
                        <span className="mr-1">{getGenderIcon(selectedPet.gender)}</span>
                        {selectedPet.gender}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Age:</span>
                      <span className="!text-gray-900">{calculateAge(selectedPet.dob)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Weight:</span>
                      <span className="!text-gray-900">{selectedPet.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Color:</span>
                      <span className="!text-gray-900">{selectedPet.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium !text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        selectedPet.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedPet.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4 !bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📋</span>
                    <h3 className="text-lg font-semibold !text-gray-900">Medical History</h3>
                  </div>
                  
                  <div className="!text-gray-700">
                    {selectedPet.medical_history || 'No medical history recorded.'}
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-4 !bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-semibold !text-gray-900">Allergies</h3>
                  </div>
                  
                  <div>
                    {selectedPet.allergies && selectedPet.allergies.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPet.allergies.map((allergy) => (
                          <div key={allergy.id} className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium text-red-800">{allergy.name}</div>
                            {allergy.description && (
                              <div className="text-sm text-red-600 mt-1">{allergy.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="!text-gray-600">No known allergies</div>
                    )}
                  </div>
                </div>

                {/* Vaccinations */}
                <div className="space-y-4 !bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">💉</span>
                    <h3 className="text-lg font-semibold !text-gray-900">Vaccinations</h3>
                  </div>
                  
                  <div>
                    {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPet.vaccinations.map((vaccination) => (
                          <div key={vaccination.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="font-medium text-blue-800">{vaccination.name}</div>
                            <div className="text-sm text-blue-600 mt-1">
                              Duration: {vaccination.duration_months} months
                            </div>
                            {vaccination.description && (
                              <div className="text-sm text-blue-600 mt-1">{vaccination.description}</div>
                            )}
                            {vaccination.pivot && vaccination.pivot.next_due_date && (
                              <div className="text-sm text-blue-600 mt-1">
                                Next Due: {new Date(vaccination.pivot.next_due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="!text-gray-600">No vaccination records</div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Medical Records Modal */}
        {isMedicalModalOpen && selectedPet && (
          <Dialog open={isMedicalModalOpen} onOpenChange={setIsMedicalModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto !bg-white !border-gray-200 !text-gray-900">
              <DialogHeader className="!bg-white">
                <DialogTitle className="flex items-center gap-2 !text-gray-900">
                  <span className="text-2xl">🩺</span>
                  Medical Records - {selectedPet.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 !bg-white p-4">
                {/* Medical History */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold !text-gray-900 mb-3">📋 Medical History</h3>
                  <p className="!text-gray-700">{selectedPet.medical_history || 'No medical history recorded.'}</p>
                </div>

                {/* Allergies */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Allergies ({selectedPet.allergies?.length || 0})</h3>
                  {selectedPet.allergies && selectedPet.allergies.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPet.allergies.map((allergy) => (
                        <div key={allergy.id} className="p-3 bg-white border border-red-200 rounded">
                          <div className="font-medium text-red-800">{allergy.name}</div>
                          {allergy.description && (
                            <div className="text-sm text-red-600 mt-1">{allergy.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-600">No known allergies</p>
                  )}
                </div>

                {/* Vaccinations */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">💉 Vaccinations ({selectedPet.vaccinations?.length || 0})</h3>
                  {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPet.vaccinations.map((vaccination) => (
                        <div key={vaccination.id} className="p-3 bg-white border border-blue-200 rounded">
                          <div className="font-medium text-blue-800">{vaccination.name}</div>
                          <div className="text-sm text-blue-600 mt-1">
                            Duration: {vaccination.duration_months} months
                          </div>
                          {vaccination.description && (
                            <div className="text-sm text-blue-600 mt-1">{vaccination.description}</div>
                          )}
                          {vaccination.pivot && vaccination.pivot.next_due_date && (
                            <div className="text-sm text-blue-600 mt-1">
                              Next Due: {new Date(vaccination.pivot.next_due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-600">No vaccination records</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Schedule Appointment Modal */}
        {isScheduleModalOpen && selectedPet && (
          <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
            <DialogContent className="max-w-2xl w-[90vw] h-[90vh] !bg-white !border-gray-200 !text-gray-900 p-0 flex flex-col rounded-lg overflow-hidden">
              <DialogHeader className="!bg-white border-b border-gray-200 p-4 pr-12 flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 !text-gray-900">
                  <span className="text-2xl">📅</span>
                  Schedule Appointment - {selectedPet.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">🐕 Pet Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedPet.name}</div>
                    <div><span className="font-medium">Owner:</span> {selectedPet.client?.name || 'Unknown'}</div>
                    <div><span className="font-medium">Species:</span> {selectedPet.species?.name || 'Unknown'}</div>
                    <div><span className="font-medium">Age:</span> {calculateAge(selectedPet.dob)}</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Appointment Booking</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Appointment Date</label>
                      <input type="date" className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Appointment Time</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900">
                        <option>9:00 AM</option>
                        <option>10:00 AM</option>
                        <option>11:00 AM</option>
                        <option>2:00 PM</option>
                        <option>3:00 PM</option>
                        <option>4:00 PM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Service Type</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900">
                        <option>General Checkup</option>
                        <option>Vaccination</option>
                        <option>Surgery</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Notes</label>
                      <textarea className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" rows={3} placeholder="Additional notes..."></textarea>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 !bg-white flex-shrink-0">
                <button 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 !text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('Appointment scheduled successfully!');
                    setIsScheduleModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f]"
                >
                  Schedule Appointment
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Pet Modal */}
        {isEditModalOpen && selectedPet && (
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-4xl w-[95vw] h-[95vh] !bg-white !border-gray-200 !text-gray-900 p-0 flex flex-col rounded-lg overflow-hidden">
              <DialogHeader className="!bg-white border-b border-gray-200 p-4 pr-12 flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 !text-gray-900">
                  <span className="text-2xl">✏️</span>
                  Edit Pet - {selectedPet.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold !text-gray-900 mb-4">🐕 Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Pet Name</label>
                      <input 
                        type="text" 
                        value={editFormData.name} 
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Gender</label>
                      <select 
                        value={editFormData.gender} 
                        onChange={(e) => handleEditFormChange('gender', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={editFormData.weight} 
                        onChange={(e) => handleEditFormChange('weight', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" 
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Color</label>
                      <input 
                        type="text" 
                        value={editFormData.color} 
                        onChange={(e) => handleEditFormChange('color', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        value={editFormData.dob} 
                        onChange={(e) => handleEditFormChange('dob', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium !text-gray-700 mb-1">Medical History</label>
                      <textarea 
                        value={editFormData.medical_history} 
                        onChange={(e) => handleEditFormChange('medical_history', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md !bg-white !text-gray-900" 
                        rows={3}
                        placeholder="Enter medical history..."
                      />
                    </div>
                  </div>
                </div>

                {/* Allergies Management */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-red-800">⚠️ Allergies</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {editAllergies && editAllergies.length > 0 ? (
                      editAllergies.map((allergy) => (
                        <div key={allergy.id} className="flex justify-between items-center p-3 bg-white border border-red-200 rounded">
                          <div>
                            <div className="font-medium text-red-800">
                              {allergy.name}
                              {allergy.isNew && <span className="text-xs text-green-600 ml-2">(New)</span>}
                            </div>
                            {allergy.description && (
                              <div className="text-sm text-red-600">{allergy.description}</div>
                            )}
                          </div>
                          <button 
                            onClick={() => handleRemoveAllergy(allergy.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove allergy"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-red-600 italic">No allergies recorded</p>
                    )}
                  </div>

                  {/* Add New Allergy Form */}
                  <div className="border-t border-red-200 pt-4">
                    <div className="text-sm text-red-700 mb-2 font-medium">Add New Allergy</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Allergy name..." 
                        value={newAllergy.name}
                        onChange={(e) => setNewAllergy(prev => ({ ...prev, name: e.target.value }))}
                        className="p-2 border border-red-300 rounded-md !bg-white !text-gray-900"
                      />
                      <input 
                        type="text" 
                        placeholder="Description (optional)..." 
                        value={newAllergy.description}
                        onChange={(e) => setNewAllergy(prev => ({ ...prev, description: e.target.value }))}
                        className="p-2 border border-red-300 rounded-md !bg-white !text-gray-900"
                      />
                      <button 
                        onClick={handleAddAllergy}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vaccinations Management */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">💉 Vaccinations</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {editVaccinations && editVaccinations.length > 0 ? (
                      editVaccinations.map((vaccination) => (
                        <div key={vaccination.id} className="flex justify-between items-center p-3 bg-white border border-blue-200 rounded">
                          <div>
                            <div className="font-medium text-blue-800">
                              {vaccination.name}
                              {vaccination.isNew && <span className="text-xs text-green-600 ml-2">(New)</span>}
                            </div>
                            <div className="text-sm text-blue-600">
                              Duration: {vaccination.duration_months} months
                            </div>
                            {vaccination.pivot && (
                              <>
                                {vaccination.pivot.vaccination_date && (
                                  <div className="text-sm text-blue-600">
                                    Given: {vaccination.pivot.vaccination_date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(vaccination.pivot.vaccination_date).toLocaleDateString()}
                                  </div>
                                )}
                                {vaccination.pivot.next_due_date && (
                                  <div className="text-sm text-blue-600">
                                    Next Due: {new Date(vaccination.pivot.next_due_date).toLocaleDateString()}
                                  </div>
                                )}
                              </>
                            )}
                            {vaccination.description && (
                              <div className="text-sm text-blue-600">{vaccination.description}</div>
                            )}
                          </div>
                          <button 
                            onClick={() => handleRemoveVaccination(vaccination.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Remove vaccination"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-blue-600 italic">No vaccinations recorded</p>
                    )}
                  </div>

                  {/* Add New Vaccination Form */}
                  <div className="border-t border-blue-200 pt-4">
                    <div className="text-sm text-blue-700 mb-3 font-medium">Add New Vaccination Record</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Vaccination name..." 
                        value={newVaccination.name}
                        onChange={(e) => setNewVaccination(prev => ({ ...prev, name: e.target.value }))}
                        className="p-2 border border-blue-300 rounded-md !bg-white !text-gray-900"
                      />
                      <input 
                        type="number" 
                        placeholder="Duration (months)..." 
                        value={newVaccination.duration_months || ''}
                        onChange={(e) => setNewVaccination(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 0 }))}
                        className="p-2 border border-blue-300 rounded-md !bg-white !text-gray-900"
                        min="1"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <input 
                        type="date" 
                        max={new Date().toISOString().split('T')[0]}
                        value={newVaccination.vaccination_date}
                        onChange={(e) => setNewVaccination(prev => ({ ...prev, vaccination_date: e.target.value }))}
                        className="p-2 border border-blue-300 rounded-md !bg-white !text-gray-900"
                        title="Date vaccination was given"
                      />
                      <input 
                        type="text" 
                        placeholder="Description (optional)..." 
                        value={newVaccination.description}
                        onChange={(e) => setNewVaccination(prev => ({ ...prev, description: e.target.value }))}
                        className="p-2 border border-blue-300 rounded-md !bg-white !text-gray-900 col-span-2"
                      />
                      <button 
                        onClick={handleAddVaccination}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button 
                        type="button"
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        onClick={setTodayDate}
                      >
                        Set Today
                      </button>
                      <span className="text-xs text-blue-600 self-center">
                        💡 Select the actual date the vaccination was given (past dates allowed)
                      </span>
                    </div>
                    
                    {/* Appointment Scheduling Options */}
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <input 
                          type="checkbox" 
                          id="createAppointment"
                          checked={newVaccination.createAppointment}
                          onChange={(e) => setNewVaccination(prev => ({ ...prev, createAppointment: e.target.checked }))}
                          className="w-4 h-4 text-green-600 bg-white border-green-300 rounded"
                        />
                        <label htmlFor="createAppointment" className="text-sm font-medium text-green-800">
                          📅 Schedule next vaccination appointment automatically
                        </label>
                      </div>
                      {newVaccination.createAppointment && (
                        <div className="ml-7 flex items-center space-x-2">
                          <span className="text-xs text-green-700">Appointment time:</span>
                          <input 
                            type="time" 
                            value={newVaccination.appointmentTime}
                            onChange={(e) => setNewVaccination(prev => ({ ...prev, appointmentTime: e.target.value }))}
                            className="px-2 py-1 border border-green-300 rounded text-xs !bg-white !text-gray-900"
                          />
                          <span className="text-xs text-green-600">
                            (on next due date: {newVaccination.vaccination_date && newVaccination.duration_months ? 
                              new Date(calculateNextDueDate(newVaccination.vaccination_date, newVaccination.duration_months)).toLocaleDateString() : 
                              'Select date & duration first'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="!bg-white border-t border-gray-200 p-4 flex justify-end space-x-3 flex-shrink-0">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 !text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Pet Registration Modal */}
        {isModalOpen && (
          <PetRegistrationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default Pets; 