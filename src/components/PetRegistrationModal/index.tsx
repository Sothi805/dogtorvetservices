import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  //faTimes, 
  faPaw, faShieldAlt, faSyringe, faXmark, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { CreatePetRequest, petsApi } from '../../api/pets';
import { speciesApi, Species } from '../../api/species';
import { breedsApi, Breed } from '../../api/breeds';
import { clientsApi, Client } from '../../api/clients';
import { allergiesApi, Allergy } from '../../api/allergies';
import { vaccinationsApi, Vaccination } from '../../api/vaccinations';
import './index.less';

interface PetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PetRegistrationModal: React.FC<PetRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreatePetRequest>({
    name: '',
    gender: 'male',
    dob: '',
    species_id: '',
    breed_id: null,
    weight: 0,
    color: '',
    medical_history: '',
    client_id: '',
    sterilized: false,
    status: true
  });

  // Data states
  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  
  // Selection states
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedVaccinations, setSelectedVaccinations] = useState<Array<{
    vaccination_id: string;
    vaccination_date: string;
    next_due_date: string;
    isToday: boolean;
  }>>([]);

  // Search and pagination states
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [vaccinationSearchTerm, setVaccinationSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [allergyPage, setAllergyPage] = useState(1);
  const [vaccinationPage, setVaccinationPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'allergies' | 'vaccinations'>('basic');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.species_id && formData.species_id !== '') {
      loadBreeds(formData.species_id);
    } else {
      setBreeds([]);
      setFormData(prev => ({ ...prev, breed_id: null }));
    }
  }, [formData.species_id]);

  const loadInitialData = async () => {
    try {
      setError(null);
      console.log('🔄 Loading initial data for pet registration...');
      
      // Load species
      let speciesData = [];
      try {
        speciesData = await speciesApi.getSpecies('all');
        setSpecies(speciesData);
        console.log('✅ Species loaded:', speciesData.length);
      } catch (err: any) {
        console.error('❌ Failed to load species:', err);
        throw new Error(`Failed to load species: ${err.response?.data?.detail || err.message}`);
      }

      // Load clients (first page only)
      let clientsData = [];
      try {
        console.log('🔄 Loading clients...');
        const clientsResponse = await clientsApi.getClients();
        clientsData = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse as any)?.data || [];
        setClients(clientsData);
        console.log('✅ Clients loaded:', clientsData.length, 'clients');
      } catch (err: any) {
        console.error('❌ Failed to load clients:', err);
        throw new Error(`Failed to load clients: ${err.response?.data?.detail || err.message}`);
      }

      // Load allergies (first page only)
      let allergiesData = [];
      try {
        allergiesData = await allergiesApi.getAllergies();
        setAllergies(allergiesData);
        console.log('✅ Allergies loaded:', allergiesData.length);
      } catch (err: any) {
        console.error('❌ Failed to load allergies:', err);
        console.warn('⚠️ Continuing without allergies data');
      }

      // Load vaccinations (first page only)
      let vaccinationsData = [];
      try {
        vaccinationsData = await vaccinationsApi.getVaccinations();
        setVaccinations(vaccinationsData);
        console.log('✅ Vaccinations loaded:', vaccinationsData.length);
      } catch (err: any) {
        console.error('❌ Failed to load vaccinations:', err);
        console.warn('⚠️ Continuing without vaccinations data');
      }

      console.log('✅ All initial data loaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load initial data';
      setError(errorMessage);
      console.error('❌ loadInitialData error:', err);
    }
  };

  const loadBreeds = async (speciesId: string) => {
    try {
      const breedsData = await breedsApi.getBreedsBySpecies(speciesId);
      setBreeds(breedsData);
    } catch (err) {
      console.error('Failed to load breeds:', err);
      setBreeds([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : (name === 'breed_id' && value === '' ? null : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called');
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting pet registration with data:', formData);
      console.log('🔄 Form validation starting...');
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Pet name is required');
      }
      console.log('✅ Pet name validated');
      
      if (!formData.client_id) {
        throw new Error('Owner selection is required');
      }
      console.log('✅ Owner selection validated');
      
      if (!formData.species_id) {
        throw new Error('Species selection is required');
      }
      console.log('✅ Species selection validated');
      
      if (!formData.dob) {
        throw new Error('Date of birth is required');
      }
      console.log('✅ Date of birth validated');
      
      if (!formData.weight || formData.weight <= 0) {
        throw new Error('Valid weight is required');
      }
      console.log('✅ Weight validated');
      
      console.log('✅ All validations passed, calling API...');

      // Create the pet first
      const newPet = await petsApi.createPet(formData);
      console.log('✅ Pet created successfully:', newPet);
      
      // Add allergies if selected
      if (selectedAllergies.length > 0) {
        console.log('🔄 Adding allergies:', selectedAllergies);
        await Promise.all(
          selectedAllergies.map(allergyId => 
            petsApi.addAllergy(newPet.id, allergyId)
          )
        );
        console.log('✅ Allergies added successfully');
      }

      // Add vaccinations if selected
      if (selectedVaccinations.length > 0) {
        console.log('🔄 Adding vaccinations:', selectedVaccinations);
        await Promise.all(
          selectedVaccinations.map(vaccination => 
            petsApi.addVaccination(newPet.id, vaccination)
          )
        );
        console.log('✅ Vaccinations added successfully');
      }

      console.log('🎉 Pet registration completed successfully');
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('❌ Pet registration failed:', err);
      let errorMessage = 'Failed to register pet';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.log('❌ setError called with:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      dob: '',
      species_id: '',
      breed_id: null,
      weight: 0,
      color: '',
      medical_history: '',
      client_id: '',
      sterilized: false,
      status: true
    });
    setSelectedAllergies([]);
    setSelectedVaccinations([]);
    setError(null);
    setActiveTab('basic');
    setClientSearchTerm('');
    setAllergySearchTerm('');
    setVaccinationSearchTerm('');
    setClientPage(1);
    setAllergyPage(1);
    setVaccinationPage(1);
  };

  const handleAllergyToggle = (allergyId: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergyId) 
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    );
  };

  const handleVaccinationAdd = (vaccinationId: string, customDate?: string) => {
    const vaccination = vaccinations.find(v => v.id.toString() === vaccinationId);
    if (!vaccination) return;

    const vaccinationDate = customDate || new Date().toISOString().split('T')[0];
    const nextDueDate = calculateNextDueDate(vaccinationDate, vaccination.duration_months);

    const vaccinationEntry = {
      vaccination_id: vaccinationId,
      vaccination_date: vaccinationDate,
      next_due_date: nextDueDate,
      isToday: !customDate
    };

    setSelectedVaccinations(prev => [...prev, vaccinationEntry]);
  };

  const handleVaccinationRemove = (vaccinationId: string) => {
    setSelectedVaccinations(prev => 
      prev.filter(v => v.vaccination_id !== vaccinationId)
    );
  };

  const calculateNextDueDate = (vaccinationDate: string, durationMonths: number): string => {
    const date = new Date(vaccinationDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split('T')[0];
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter and paginate functions
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.other_contact_info?.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredAllergies = allergies.filter(allergy => 
    allergy.name.toLowerCase().includes(allergySearchTerm.toLowerCase()) ||
    allergy.description?.toLowerCase().includes(allergySearchTerm.toLowerCase())
  );

  const filteredVaccinations = vaccinations.filter(vaccination => 
    vaccination.name.toLowerCase().includes(vaccinationSearchTerm.toLowerCase()) ||
    vaccination.description?.toLowerCase().includes(vaccinationSearchTerm.toLowerCase())
  );

  const paginatedClients = filteredClients.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
  const paginatedAllergies = filteredAllergies.slice((allergyPage - 1) * itemsPerPage, allergyPage * itemsPerPage);
  const paginatedVaccinations = filteredVaccinations.slice((vaccinationPage - 1) * itemsPerPage, vaccinationPage * itemsPerPage);

  const totalClientPages = Math.ceil(filteredClients.length / itemsPerPage);
  const totalAllergyPages = Math.ceil(filteredAllergies.length / itemsPerPage);
  const totalVaccinationPages = Math.ceil(filteredVaccinations.length / itemsPerPage);

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
      <div className="relative w-full max-w-5xl max-h-[90vh]">
        {/* Transparent glass effect with drop shadow */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#007c7c]" />
              Register New Pet
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/20 bg-white/10">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic' 
                  ? 'text-[#007c7c] border-b-2 border-[#007c7c] bg-white/20' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('allergies')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'allergies' 
                  ? 'text-[#007c7c] border-b-2 border-[#007c7c] bg-white/20' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
              }`}
            >
              Allergies ({selectedAllergies.length})
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'vaccinations' 
                  ? 'text-[#007c7c] border-b-2 border-[#007c7c] bg-white/20' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/10'
              }`}
            >
              Vaccinations ({selectedVaccinations.length})
            </button>
          </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
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

              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Pet Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        placeholder="Enter pet name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Owner <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <div className="relative">
                          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            placeholder="Search owners..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                          {paginatedClients.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              {clientSearchTerm ? 'No owners found' : 'No owners available'}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Species <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="species_id"
                        value={formData.species_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      >
                        <option value="">Select Species</option>
                        {species.map(spec => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Breed <span className="text-gray-500">(optional)</span>
                      </label>
                      <select
                        name="breed_id"
                        value={formData.breed_id || ''}
                        onChange={handleInputChange}
                        disabled={breeds.length === 0}
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm disabled:opacity-50"
                      >
                        <option value="">Select Breed</option>
                        {breeds.map(breed => (
                          <option key={breed.id} value={breed.id}>
                            {breed.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 text-sm bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-colors">
                        <input
                          type="checkbox"
                          name="sterilized"
                          checked={formData.sterilized}
                          onChange={(e) => setFormData(prev => ({ ...prev, sterilized: e.target.checked }))}
                          className="rounded border-white/40 text-[#007c7c] focus:ring-[#007c7c] bg-white/30"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Sterilized/Neutered</div>
                          <div className="text-xs text-gray-600 mt-1">Pet has been sterilized or neutered</div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Weight (kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight || ''}
                        onChange={handleInputChange}
                        required
                        step="0.1"
                        min="0.1"
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Color <span className="text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        placeholder="Pet color/markings"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Medical History <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      placeholder="Any relevant medical history, allergies, or notes..."
                    />
                  </div>
                </div>
              )}

              {/* Allergies Tab */}
              {activeTab === 'allergies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-red-500" />
                      <label className="block text-sm font-medium text-gray-800">
                        Allergies <span className="text-gray-500">(optional)</span>
                      </label>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedAllergies.length} selected
                    </div>
                  </div>
                  
                  <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search allergies..."
                      value={allergySearchTerm}
                      onChange={(e) => setAllergySearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                    {paginatedAllergies.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        {allergySearchTerm ? 'No allergies found' : 'No allergies available'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paginatedAllergies.map(allergy => (
                          <label key={allergy.id} className="flex items-center space-x-3 text-sm bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedAllergies.includes(allergy.id.toString())}
                              onChange={() => handleAllergyToggle(allergy.id.toString())}
                              className="rounded border-white/40 text-[#007c7c] focus:ring-[#007c7c] bg-white/30"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{allergy.name}</div>
                              {allergy.description && (
                                <div className="text-xs text-gray-600 mt-1">{allergy.description}</div>
                              )}
                            </div>
                          </label>
                        ))}
                        
                        {totalAllergyPages > 1 && (
                          <div className="flex justify-between items-center pt-3 border-t border-white/20">
                            <button
                              type="button"
                              onClick={() => setAllergyPage(prev => Math.max(1, prev - 1))}
                              disabled={allergyPage === 1}
                              className="px-3 py-1 text-xs bg-white/20 rounded-lg disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <span className="text-xs text-gray-600">
                              Page {allergyPage} of {totalAllergyPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAllergyPage(prev => Math.min(totalAllergyPages, prev + 1))}
                              disabled={allergyPage === totalAllergyPages}
                              className="px-3 py-1 text-xs bg-white/20 rounded-lg disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vaccinations Tab */}
              {activeTab === 'vaccinations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSyringe} className="mr-2 text-blue-500" />
                      <label className="block text-sm font-medium text-gray-800">
                        Initial Vaccinations <span className="text-gray-500">(optional)</span>
                      </label>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedVaccinations.length} selected
                    </div>
                  </div>
                  
                  <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search vaccinations..."
                      value={vaccinationSearchTerm}
                      onChange={(e) => setVaccinationSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                    {paginatedVaccinations.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        {vaccinationSearchTerm ? 'No vaccinations found' : 'No vaccinations available'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paginatedVaccinations.map(vaccination => {
                          const isSelected = selectedVaccinations.some(v => v.vaccination_id === vaccination.id.toString());
                          return (
                            <div key={vaccination.id} className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{vaccination.name}</div>
                                  <div className="text-xs text-gray-600">
                                    Duration: {vaccination.duration_months} months
                                  </div>
                                  {vaccination.description && (
                                    <div className="text-xs text-gray-500 mt-1">{vaccination.description}</div>
                                  )}
                                </div>
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleVaccinationRemove(vaccination.id.toString())}
                                    className="text-red-600 hover:text-red-800 px-2 py-1 text-xs bg-red-50 rounded-lg"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              
                              {!isSelected && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleVaccinationAdd(vaccination.id.toString())}
                                    className="px-3 py-1 bg-[#007c7c] text-white rounded-lg text-xs hover:bg-[#005f5f] transition-colors"
                                  >
                                    Add (Today)
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600">or</span>
                                    <input
                                      type="date"
                                      className="px-2 py-1 border border-white/40 rounded-lg text-xs bg-white/30 backdrop-blur-sm"
                                      max={new Date().toISOString().split('T')[0]}
                                      placeholder="Past date"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleVaccinationAdd(vaccination.id.toString(), e.target.value);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {totalVaccinationPages > 1 && (
                          <div className="flex justify-between items-center pt-3 border-t border-white/20">
                            <button
                              type="button"
                              onClick={() => setVaccinationPage(prev => Math.max(1, prev - 1))}
                              disabled={vaccinationPage === 1}
                              className="px-3 py-1 text-xs bg-white/20 rounded-lg disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <span className="text-xs text-gray-600">
                              Page {vaccinationPage} of {totalVaccinationPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setVaccinationPage(prev => Math.min(totalVaccinationPages, prev + 1))}
                              disabled={vaccinationPage === totalVaccinationPages}
                              className="px-3 py-1 text-xs bg-white/20 rounded-lg disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedVaccinations.length > 0 && (
                    <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-200/30 rounded-xl p-3">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Selected Vaccinations ({selectedVaccinations.length})
                      </div>
                      <div className="space-y-1">
                        {selectedVaccinations.map((selected, index) => {
                          const vaccination = vaccinations.find(v => v.id.toString() === selected.vaccination_id);
                          const dateDisplay = selected.isToday ? 'Today' : new Date(selected.vaccination_date).toLocaleDateString();
                          return (
                            <div key={index} className="text-xs text-blue-700 flex justify-between">
                              <span>• {vaccination?.name}</span>
                              <span className="font-medium">{dateDisplay}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer with subtle glass effect */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center pt-6 border-t border-white/20 mt-6 gap-4">
                {/* Tab buttons - mobile responsive */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'basic' 
                        ? 'bg-[#007c7c] text-white' 
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                  >
                    Basic Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('allergies')}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'allergies' 
                        ? 'bg-[#007c7c] text-white' 
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                  >
                    Allergies ({selectedAllergies.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vaccinations')}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'vaccinations' 
                        ? 'bg-[#007c7c] text-white' 
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                  >
                    Vaccinations ({selectedVaccinations.length})
                  </button>
                </div>
                
                {/* Action buttons - mobile responsive */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white/40 hover:bg-white/60 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={() => console.log('Register Pet button clicked')}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaw} />
                        <span>Register Pet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetRegistrationModal; 