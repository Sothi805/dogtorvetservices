import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaw, faShieldAlt, faSyringe, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { Pet, petsApi } from '../../api/pets';

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
      setPet(petData);
    } catch (err: any) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#007c7c]" />
            Pet Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading pet details...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600">{error}</div>
            </div>
          ) : pet ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">{getSpeciesIcon(pet.species?.name)}</span>
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">{pet.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Owner:</span>
                    <span className="text-gray-900">{pet.client?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Species:</span>
                    <span className="text-gray-900">{pet.species?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Breed:</span>
                    <span className="text-gray-900">{pet.breed?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="text-gray-900 capitalize flex items-center">
                      <span className="mr-1">{getGenderIcon(pet.gender)}</span>
                      {pet.gender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Age:</span>
                    <span className="text-gray-900">{calculateAge(pet.dob)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Weight:</span>
                    <span className="text-gray-900">{pet.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Color:</span>
                    <span className="text-gray-900">{pet.color || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      pet.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pet.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical History</h3>
                <div className="text-gray-700">
                  {pet.medical_history || 'No medical history recorded.'}
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-red-500" />
                  Allergies
                </h3>
                {pet.allergies && pet.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {pet.allergies.map(allergy => (
                      <div key={allergy.id} className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">{allergy.name}</div>
                        {allergy.description && (
                          <div className="text-sm text-gray-600 mt-1">{allergy.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No known allergies</div>
                )}
              </div>

              {/* Vaccinations */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faSyringe} className="mr-2 text-blue-500" />
                  Vaccinations
                </h3>
                {pet.vaccinations && pet.vaccinations.length > 0 ? (
                  <div className="space-y-2">
                    {pet.vaccinations.map(vaccination => (
                      <div key={vaccination.id} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{vaccination.name}</div>
                            {vaccination.description && (
                              <div className="text-sm text-gray-600">{vaccination.description}</div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            {vaccination.pivot.vaccination_date && (
                              <div className="text-gray-600">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                                Given: {vaccination.pivot.vaccination_date}
                              </div>
                            )}
                            {vaccination.pivot.next_due_date && (
                              <div className="text-gray-600">
                                Next due: {vaccination.pivot.next_due_date}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No vaccination records</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">Pet not found</div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetProfileModal; 