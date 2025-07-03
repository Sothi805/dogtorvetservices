import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faShieldAlt, 
  faCheck, 
  faXmark,
  faBarsStaggered
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../layouts/PageLayout';
import { allergiesApi, Allergy, CreateAllergyRequest } from '../../api/allergies';
import { TableSkeleton, ErrorState, EmptyState } from '../../components/ui/loading';

const AllergiesManagement = () => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [formData, setFormData] = useState<CreateAllergyRequest>({ 
    name: '', 
    description: '',
    status: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    loadAllergies();
  }, [statusFilter]);

  const loadAllergies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await allergiesApi.getAllergies(statusFilter);
      setAllergies(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load allergies');
      console.error('Failed to load allergies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAllergy(null);
    setFormData({ name: '', description: '', status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (allergy: Allergy) => {
    setEditingAllergy(allergy);
    setFormData({ 
      name: allergy.name, 
      description: allergy.description || '',
      status: allergy.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      
      if (editingAllergy) {
        await allergiesApi.updateAllergy(editingAllergy.id, formData);
      } else {
        await allergiesApi.createAllergy(formData);
      }
      
      await loadAllergies();
      setIsModalOpen(false);
      setFormData({ name: '', description: '', status: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save allergy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (allergy: Allergy) => {
    const action = allergy.status ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${allergy.name}"?`)) return;

    try {
      await allergiesApi.toggleAllergyStatus(allergy.id);
      await loadAllergies();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} allergy`);
    }
  };

  // Filter by search term only (status filtering is done on backend)
  const filteredAllergies = allergies.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <Layout title="Allergies Management">
      {/* Header with subtitle and actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-600 mt-2">Manage allergies that can affect pets</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Allergy</span>
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
              placeholder="Search allergies..."
              className="bg-white border border-gray-300 rounded-sm px-3 py-1 w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAllergies} />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allergy Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {filteredAllergies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      <EmptyState 
                        title="No Allergies Found"
                        message={searchTerm ? "No allergies found matching your search" : "No allergies found"} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredAllergies.map((allergy) => (
                    <tr key={allergy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faShieldAlt} className="text-white text-sm" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {allergy.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {allergy.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          allergy.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {allergy.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(allergy.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(allergy)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(allergy)}
                            className={`p-1 rounded transition-colors ${
                              allergy.status 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={allergy.status ? 'Deactivate' : 'Activate'}
                          >
                            <FontAwesomeIcon icon={allergy.status ? faTrash : faCheck} />
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
                {editingAllergy ? 'Edit Allergy' : 'Add New Allergy'}
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
                  Allergy Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pollen, Chicken, Dairy"
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
                  placeholder="Optional description of the allergy..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
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
                  {isSubmitting ? 'Saving...' : (editingAllergy ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllergiesManagement; 