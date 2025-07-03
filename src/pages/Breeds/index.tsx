import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faDna, 
  faCheck, 
  faXmark,
  faBarsStaggered
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../layouts/PageLayout';
import { breedsApi, Breed, CreateBreedRequest } from '../../api/breeds';
import { speciesApi, Species } from '../../api/species';
import { TableSkeleton, ErrorState, EmptyState } from '../../components/ui/loading';

const BreedsManagement = () => {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
  const [formData, setFormData] = useState<CreateBreedRequest>({ 
    name: '', 
    species_id: '', 
    status: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, speciesFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [breedsData, speciesData] = await Promise.all([
        breedsApi.getBreedsWithStatus(statusFilter, speciesFilter),
        speciesApi.getSpecies('all')  // Load all species for the dropdown so we can see species linked to existing breeds
      ]);
      setBreeds(breedsData);
      setSpecies(speciesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBreed(null);
    setFormData({ name: '', species_id: '', status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (breed: Breed) => {
    setEditingBreed(breed);
    setFormData({ 
      name: breed.name, 
      species_id: breed.species_id, 
      status: breed.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.species_id.trim()) return;

    try {
      setIsSubmitting(true);
      
      if (editingBreed) {
        await breedsApi.updateBreed(editingBreed.id, formData);
      } else {
        await breedsApi.createBreed(formData);
      }
      
      await loadData();
      setIsModalOpen(false);
      setFormData({ name: '', species_id: '', status: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save breed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (breed: Breed) => {
    const newStatus = !breed.status;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} "${breed.name}"?`)) return;

    try {
      await breedsApi.updateBreed(breed.id, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} breed`);
    }
  };

  const filteredBreeds = breeds.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout title="Breeds Management">
      {/* Header with subtitle and actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-600 mt-2">Manage animal breeds in your veterinary system</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Breed</span>
        </button>
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
              All
            </button>

            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                statusFilter === "active" ? "bg-green-500" : "bg-green-300 hover:bg-green-400"
              }`}
            >
              Active <FontAwesomeIcon icon={faCheck} />
            </button>

            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                statusFilter === "inactive" ? "bg-red-500" : "bg-red-300 hover:bg-red-400"
              }`}
            >
              Inactive <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label>Species:</label>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-sm px-3 py-1"
            >
              <option value="all">All Species</option>
              {species.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search breeds..."
              className="bg-white border border-gray-300 rounded-sm px-3 py-1 w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breed Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Species
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBreeds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      <EmptyState 
                        title="No Breeds Found"
                        message={searchTerm ? "No breeds found matching your search" : "No breeds found"} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredBreeds.map((breed) => (
                    <tr key={breed.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faDna} className="text-white text-sm" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {breed.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {breed.species?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          breed.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {breed.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(breed.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(breed)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(breed)}
                            className={`p-1 rounded ${
                              breed.status 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={breed.status ? 'Deactivate' : 'Activate'}
                          >
                            <FontAwesomeIcon 
                              icon={breed.status ? faTrash : faCheck} 
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingBreed ? 'Edit Breed' : 'Add New Breed'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species *
                </label>
                <select
                  value={formData.species_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, species_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                  required
                >
                  <option value="">Select Species</option>
                  {species.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Golden Retriever, Persian, Parakeet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                    className="rounded border-gray-300 text-[#007c7c] focus:ring-[#007c7c]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingBreed ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BreedsManagement; 