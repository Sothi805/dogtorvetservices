import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaw, faShieldAlt, faSyringe } from '@fortawesome/free-solid-svg-icons';
import { CreatePetRequest, petsApi } from '../../api/pets';
import { speciesApi, Species } from '../../api/species';
import { breedsApi, Breed } from '../../api/breeds';
import { clientsApi, Client } from '../../api/clients';
import { allergiesApi, Allergy } from '../../api/allergies';
import { vaccinationsApi, Vaccination } from '../../api/vaccinations';

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
    breed_id: '',
    weight: 0,
    color: '',
    medical_history: '',
    client_id: '',
    status: true
  });

  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedVaccinations, setSelectedVaccinations] = useState<Array<{
    vaccination_id: string;
    vaccination_date: string;
    next_due_date: string;
    isToday: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setFormData(prev => ({ ...prev, breed_id: '' }));
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
        console.error('Species error details:', err.response?.data);
        throw new Error(`Failed to load species: ${err.response?.data?.detail || err.message}`);
      }

      // Load clients
      let clientsData = [];
      try {
        console.log('🔄 Loading clients with per_page: 100...');
        const clientsResponse = await clientsApi.getClients({ per_page: 100 });
        clientsData = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.data;
      setClients(clientsData);
        console.log('✅ Clients loaded:', clientsData.length, 'clients');
      } catch (err: any) {
        console.error('❌ Failed to load clients:', err);
        console.error('Clients error details:', err.response?.data);
        throw new Error(`Failed to load clients: ${err.response?.data?.detail || err.message}`);
      }

      // Load allergies
      let allergiesData = [];
      try {
        allergiesData = await allergiesApi.getAllergies();
      setAllergies(allergiesData);
        console.log('✅ Allergies loaded:', allergiesData.length);
      } catch (err: any) {
        console.error('❌ Failed to load allergies:', err);
        console.error('Allergies error details:', err.response?.data);
        // Don't throw error for allergies - they're optional
        console.warn('⚠️ Continuing without allergies data');
      }

      // Load vaccinations
      let vaccinationsData = [];
      try {
        vaccinationsData = await vaccinationsApi.getVaccinations();
      setVaccinations(vaccinationsData);
        console.log('✅ Vaccinations loaded:', vaccinationsData.length);
      } catch (err: any) {
        console.error('❌ Failed to load vaccinations:', err);
        console.error('Vaccinations error details:', err.response?.data);
        // Don't throw error for vaccinations - they're optional
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
      console.log('🔄 Loading breeds for species:', speciesId);
      const breedsData = await breedsApi.getBreedsBySpecies(speciesId);
      setBreeds(breedsData);
      console.log('✅ Breeds loaded:', breedsData.length);
    } catch (err) {
      console.error('Failed to load breeds:', err);
      setBreeds([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting pet registration with data:', formData);
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Pet name is required');
      }
      if (!formData.client_id) {
        throw new Error('Owner selection is required');
      }
      if (!formData.species_id) {
        throw new Error('Species selection is required');
      }
      if (!formData.dob) {
        throw new Error('Date of birth is required');
      }
      if (!formData.weight || formData.weight <= 0) {
        throw new Error('Valid weight is required');
      }

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
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to register pet';
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
      name: '',
      gender: 'male',
      dob: '',
      species_id: '',
      breed_id: '',
      weight: 0,
      color: '',
      medical_history: '',
      client_id: '',
      status: true
    });
    setSelectedAllergies([]);
    setSelectedVaccinations([]);
    setError(null);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#007c7c] text-sm md:text-base" />
            Register New Pet
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm md:text-base" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          {error && (
            <div className="mb-4 p-3 md:p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 md:h-5 md:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-3">
                  <h3 className="text-xs md:text-sm font-medium text-red-800">Failed to register pet</h3>
                  <div className="mt-1 md:mt-2 text-xs md:text-sm text-red-700">
              {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
                placeholder="Enter pet name"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Owner *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                required
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              >
                <option value="">Select Owner</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Species *
              </label>
                <select
                  name="species_id"
                  value={formData.species_id}
                  onChange={handleInputChange}
                  required
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
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
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
                <select
                  name="breed_id"
                  value={formData.breed_id}
                  onChange={handleInputChange}
                  disabled={breeds.length === 0}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent disabled:bg-gray-100"
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
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight || ''}
                onChange={handleInputChange}
                required
                step="0.1"
                min="0.1"
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
                placeholder="Pet color/markings"
              />
            </div>
          </div>

          <div className="mt-3 md:mt-4">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Medical History
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              placeholder="Any relevant medical history, allergies, or notes..."
            />
          </div>

          {/* Allergies Section */}
          <div className="mt-4 md:mt-6">
            <div className="flex items-center mb-2 md:mb-3">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-red-500 text-xs md:text-sm" />
                Allergies
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 md:p-3">
              {allergies.length === 0 ? (
                <div className="col-span-2 text-gray-500 text-xs md:text-sm text-center py-2">
                  No allergies available
                </div>
              ) : (
                allergies.map(allergy => (
                  <label key={allergy.id} className="flex items-center space-x-2 text-xs md:text-sm">
                    <input
                      type="checkbox"
                      checked={selectedAllergies.includes(allergy.id.toString())}
                      onChange={() => handleAllergyToggle(allergy.id.toString())}
                      className="rounded border-gray-300 text-[#007c7c] focus:ring-[#007c7c]"
                    />
                    <span className="flex-1" title={allergy.description}>
                      {allergy.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Vaccinations Section */}
          <div className="mt-4 md:mt-6">
            <div className="flex items-center mb-2 md:mb-3">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faSyringe} className="mr-2 text-blue-500 text-xs md:text-sm" />
                Initial Vaccinations
              </label>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 md:p-3">
              {vaccinations.length === 0 ? (
                <div className="text-gray-500 text-xs md:text-sm text-center py-2">
                  No vaccinations available
                </div>
              ) : (
                vaccinations.map(vaccination => {
                  const isSelected = selectedVaccinations.some(v => v.vaccination_id === vaccination.id.toString());
                  return (
                    <div key={vaccination.id} className="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-xs md:text-sm" title={vaccination.description}>
                          {vaccination.name} ({vaccination.duration_months} months)
                        </span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => handleVaccinationRemove(vaccination.id.toString())}
                            className="text-red-600 hover:text-red-800 px-2 py-1 text-xs"
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
                            className="px-2 md:px-3 py-1 bg-[#007c7c] text-white rounded text-xs hover:bg-[#005f5f]"
                          >
                            Add (Today)
                          </button>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">or</span>
                            <input
                              type="date"
                              className="px-1 md:px-2 py-1 border border-gray-300 rounded text-xs"
                              max={new Date().toISOString().split('T')[0]}
                              placeholder="Past date"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleVaccinationAdd(vaccination.id.toString(), e.target.value);
                                  e.target.value = ''; // Reset the input
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {selectedVaccinations.length > 0 && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3">
                <div className="text-xs md:text-sm font-medium text-blue-800 mb-2">
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

          <div className="flex justify-end space-x-2 md:space-x-3 mt-4 md:mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 md:px-4 py-2 text-xs md:text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registering...' : 'Register Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetRegistrationModal; 