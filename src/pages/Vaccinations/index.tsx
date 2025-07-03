import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSyringe, 
  faCheck, 
  faXmark,
  faBarsStaggered,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../layouts/PageLayout';
import { vaccinationsApi, Vaccination, CreateVaccinationRequest } from '../../api/vaccinations';
import { TableSkeleton, ErrorState, EmptyState } from '../../components/ui/loading';

const VaccinationsManagement = () => {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  const [formData, setFormData] = useState<CreateVaccinationRequest>({ 
    name: '', 
    description: '',
    duration_months: 12,
    status: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    loadVaccinations();
  }, [statusFilter]);

  const loadVaccinations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vaccinationsApi.getVaccinations(statusFilter);
      setVaccinations(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vaccinations');
      console.error('Failed to load vaccinations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVaccination(null);
    setFormData({ name: '', description: '', duration_months: 12, status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setFormData({ 
      name: vaccination.name, 
      description: vaccination.description || '',
      duration_months: vaccination.duration_months,
      status: vaccination.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.duration_months) return;

    try {
      setIsSubmitting(true);
      
      if (editingVaccination) {
        await vaccinationsApi.updateVaccination(editingVaccination.id, formData);
      } else {
        await vaccinationsApi.createVaccination(formData);
      }
      
      await loadVaccinations();
      setIsModalOpen(false);
      setFormData({ name: '', description: '', duration_months: 12, status: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save vaccination');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (vaccination: Vaccination) => {
    const action = vaccination.status ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${vaccination.name}"?`)) return;

    try {
      await vaccinationsApi.toggleVaccinationStatus(vaccination.id);
      await loadVaccinations();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} vaccination`);
    }
  };

  // Filter by search term only (status filtering is done on backend)
  const filteredVaccinations = vaccinations.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <Layout title="Vaccinations Management">
      {/* Header with subtitle and actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-600 mt-2">Manage vaccinations available for pets</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Vaccination</span>
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
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vaccinations..."
              className="bg-white border border-gray-300 rounded-sm px-3 py-1 w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadVaccinations} />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vaccination Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {filteredVaccinations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      <EmptyState 
                        title="No Vaccinations Found"
                        message={searchTerm ? "No vaccinations found matching your search" : "No vaccinations found"} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredVaccinations.map((vaccination) => (
                    <tr key={vaccination.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faSyringe} className="text-white text-sm" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {vaccination.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {vaccination.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FontAwesomeIcon icon={faClock} className="mr-1 text-gray-400" />
                          {vaccination.duration_months} months
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          vaccination.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vaccination.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vaccination.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(vaccination)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(vaccination)}
                            className={`p-1 rounded transition-colors ${
                              vaccination.status 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={vaccination.status ? 'Deactivate' : 'Activate'}
                          >
                            <FontAwesomeIcon icon={vaccination.status ? faTrash : faCheck} />
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
                {editingVaccination ? 'Edit Vaccination' : 'Add New Vaccination'}
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
                  Vaccination Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Rabies, DHPP, Bordetella"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the vaccination..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months) *
                </label>
                <input
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 12 }))}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">How long this vaccination is effective</p>
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
                  {isSubmitting ? 'Saving...' : (editingVaccination ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VaccinationsManagement; 