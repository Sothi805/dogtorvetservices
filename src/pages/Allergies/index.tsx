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
import Search from '../../components/Search';
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
      console.log('🔍 Loading allergies with status filter:', statusFilter);
      
      const data = await allergiesApi.getAllergies(statusFilter);
      console.log('📊 Allergies data received:', data);
      
      if (Array.isArray(data)) {
        setAllergies(data);
      } else {
        console.error('❌ Invalid data format:', data);
        setError('Invalid data format received from server');
        setAllergies([]);
      }
    } catch (err: any) {
      console.error('❌ Failed to load allergies:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load allergies';
      setError(errorMessage);
      setAllergies([]); // Ensure allergies is always an array
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
      console.error('❌ Error saving allergy:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to save allergy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (allergy: Allergy) => {
    try {
      await allergiesApi.updateAllergy(allergy.id, { 
        name: allergy.name, 
        description: allergy.description || '',
        status: !allergy.status 
      });
      await loadAllergies();
    } catch (err: any) {
      console.error('❌ Error toggling status:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to update status');
    }
  };



  const filteredAllergies = allergies.filter(allergy =>
    allergy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Allergies">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
            <Search 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search allergies..."
            />
          </div>
          <button 
            onClick={handleCreate}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200 whitespace-nowrap relative z-10 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Allergy</span>
          </button>
        </div>

        {/* Mobile/Tablet Filter Controls */}
        <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="responsive-select w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("active");
                  setSearchTerm("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600 mb-4">
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

          <div className={`flex items-center space-x-4 transition-all duration-500 ease-in-out overflow-hidden ${
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
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={loadAllergies} />
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {filteredAllergies.length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No allergies found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "No allergies found matching your search" : "No allergies found"}
                  </p>
                  <button
                    onClick={handleCreate}
                    className="bg-[#007c7c] text-white px-4 py-2 rounded-lg hover:bg-[#005f5f] transition-colors"
                  >
                    Create Allergy
                  </button>
                </div>
              ) : (
                filteredAllergies.map((allergy) => (
                  <div key={allergy.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <FontAwesomeIcon icon={faShieldAlt} className="text-white text-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{allergy.name}</h3>
                          <p className="text-sm text-gray-500">{allergy.description || 'No description'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                        allergy.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {allergy.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm text-gray-700">{new Date(allergy.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(allergy)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(allergy)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                          allergy.status 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={allergy.status ? 'Deactivate allergy' : 'Activate allergy'}
                      >
                        <FontAwesomeIcon icon={allergy.status ? faXmark : faCheck} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block bg-white rounded-lg shadow">
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
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-sm" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {allergy.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {allergy.description || 'No description'}
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
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => handleEdit(allergy)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 transition-colors"
                                title="Edit allergy"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(allergy)}
                                className={`p-1 rounded transition-colors ${
                                  allergy.status 
                                    ? 'text-red-600 hover:text-red-900 hover:bg-red-100' 
                                    : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                                }`}
                                title={allergy.status ? 'Deactivate allergy' : 'Activate allergy'}
                              >
                                <FontAwesomeIcon icon={allergy.status ? faXmark : faCheck} />
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
          </>
        )}

        {/* Liquid Glass Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Apple-like liquid glass background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            
            {/* Minimal floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
              <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
            </div>
            
            {/* Modal container with Apple-like transparent glass effect */}
            <div className="relative w-full max-w-md max-h-[90vh]">
              {/* Transparent glass effect with drop shadow */}
              <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
                {/* Header with subtle glass effect */}
                <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-[#007c7c]" />
                    {editingAllergy ? 'Edit Allergy' : 'Create New Allergy'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
                  </button>
                </div>

                {/* Content with transparent glass styling */}
                <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Allergy Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        placeholder="Enter allergy name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                        placeholder="Enter description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="status"
                        checked={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                        className="h-4 w-4 text-[#007c7c] focus:ring-[#007c7c] border-gray-300 rounded"
                      />
                      <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
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
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllergiesManagement; 