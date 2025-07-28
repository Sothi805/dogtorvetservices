import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faPaw, faShieldAlt, faSyringe, faCalendarAlt, faUser, faWeightHanging, 
  faPalette, faVenusMars, faBirthdayCake, faCheckCircle, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { Pet, petsApi } from '../../api/pets';
import './index.less';

interface PetProfileModalProps {
  isOpen: boolean;
  petId: string | null;
  onClose: () => void;
}

const PetProfileModal: React.FC<PetProfileModalProps> = ({
  isOpen,
  petId,
  onClose
}) => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && petId) {
      loadPetDetails();
    }
  }, [isOpen, petId]);

  const loadPetDetails = async () => {
    if (!petId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const petData = await petsApi.getPet(petId, 'client,species,breed,allergies,vaccinations');
      console.log('🐾 Pet data loaded:', petData);
      console.log('🐾 Allergies:', petData.allergies);
      console.log('🐾 Vaccinations:', petData.vaccinations);
      setPet(petData);
    } catch (err: any) {
      console.error('❌ Failed to load pet details:', err);
      setError(err.response?.data?.message || 'Failed to load pet details');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              Pet Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-[#007c7c] hover:bg-[#005f5f] transition ease-in-out duration-150 cursor-not-allowed">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading pet details...
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-4 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-100 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              ) : pet ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <span className="text-3xl mr-3">{getSpeciesIcon(pet.species?.name)}</span>
                      <span>Basic Information</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Name:</span>
                        <span className="text-gray-900 font-semibold">{pet.name}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faUser} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Owner:</span>
                        <span className="text-gray-900 font-semibold">{pet.client?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <span className="text-2xl mr-3">{getSpeciesIcon(pet.species?.name)}</span>
                        <span className="font-medium text-gray-700 mr-2">Species:</span>
                        <span className="text-gray-900 font-semibold">{pet.species?.name}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <span className="text-2xl mr-3">🐕</span>
                        <span className="font-medium text-gray-700 mr-2">Breed:</span>
                        <span className="text-gray-900 font-semibold">{pet.breed?.name || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faVenusMars} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Gender:</span>
                        <span className="text-gray-900 font-semibold capitalize flex items-center">
                          <span className="mr-2">{getGenderIcon(pet.gender)}</span>
                          {pet.gender}
                        </span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faBirthdayCake} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Age:</span>
                        <span className="text-gray-900 font-semibold">{calculateAge(pet.dob)}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faWeightHanging} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Weight:</span>
                        <span className="text-gray-900 font-semibold">{pet.weight} kg</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faPalette} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Color:</span>
                        <span className="text-gray-900 font-semibold">{pet.color || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white/20 rounded-xl">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-3 text-[#007c7c] w-4" />
                        <span className="font-medium text-gray-700 mr-2">Status:</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          pet.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pet.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medical History */}
                  <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <FontAwesomeIcon icon={faShieldAlt} className="mr-3 text-[#007c7c]" />
                      Medical History
                    </h3>
                    <div className="bg-white/20 p-4 rounded-xl">
                      <p className="text-gray-700 leading-relaxed">
                        {pet.medical_history || 'No medical history recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <FontAwesomeIcon icon={faShieldAlt} className="mr-3 text-red-500" />
                      Allergies
                    </h3>
                    {pet.allergies && pet.allergies.length > 0 ? (
                      <div className="space-y-3">
                        {pet.allergies.map((allergy: any, index: number) => (
                          <div key={allergy.id || index} className="bg-white/20 p-4 rounded-xl border border-red-200/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 text-lg">{allergy.name}</div>
                                {allergy.description && (
                                  <div className="text-sm text-gray-600 mt-1">{allergy.description}</div>
                                )}
                              </div>
                              <div className="text-red-500">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/20 p-4 rounded-xl text-center">
                        <div className="text-gray-500 text-sm">No known allergies</div>
                      </div>
                    )}
                  </div>

                  {/* Vaccinations */}
                  <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <FontAwesomeIcon icon={faSyringe} className="mr-3 text-blue-500" />
                      Vaccinations
                    </h3>
                    {(() => { console.log('🐾 Rendering vaccinations:', pet.vaccinations); return null; })()}
                    {pet.vaccinations && pet.vaccinations.length > 0 ? (
                      <div className="space-y-3">
                        {pet.vaccinations.map((vaccination: any, index: number) => (
                          <div key={vaccination.id || index} className="bg-white/20 p-4 rounded-xl border border-blue-200/30">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-gray-900 text-lg">{vaccination.name}</div>
                                <div className="text-blue-500">
                                  <FontAwesomeIcon icon={faSyringe} />
                                </div>
                              </div>
                              {vaccination.description && (
                                <div className="text-sm text-gray-600">{vaccination.description}</div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600 space-y-1 sm:space-y-0">
                                {vaccination.vaccination_date && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                                    <span>Given: {formatDate(vaccination.vaccination_date)}</span>
                                  </div>
                                )}
                                {vaccination.next_due_date && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-500" />
                                    <span>Next due: {formatDate(vaccination.next_due_date)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/20 p-4 rounded-xl text-center">
                        <div className="text-gray-500 text-sm">No vaccination records</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">Pet not found</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-white/20 bg-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfileModal; 