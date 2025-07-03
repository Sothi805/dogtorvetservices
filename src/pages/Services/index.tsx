import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import ServiceModal from "../../components/ServiceModal";
import {
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { servicesApi, Service, ServiceFilters, CreateServiceRequest, UpdateServiceRequest } from "../../api/services";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState } from "../../components/ui/loading";

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    setStatusFilter("active");
    console.log("🔧 Services tab opened - filter set to 'active'");
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ServiceFilters = {
        search: searchTerm || undefined,
        per_page: pageSize,
        page: currentPage,
        sort_by: 'name',
        sort_order: sortOrder,
        include_inactive: statusFilter === 'all' || statusFilter === 'inactive',
        service_type: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
      };

      const response = await servicesApi.getServices(filters);
      setServices(response.data);
      setTotalPages(response.meta.last_page);
      setTotalServices(response.meta.total);
    } catch (err) {
      setError('Failed to load services');
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [searchTerm, pageSize, currentPage, sortOrder, statusFilter, serviceTypeFilter]);

  const handleCreateService = async (serviceData: CreateServiceRequest) => {
    try {
      setIsModalLoading(true);
      await servicesApi.createService(serviceData);
      await loadServices();
      setIsModalOpen(false);
      setSelectedService(null);
    } catch (err) {
      console.error('Error creating service:', err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleUpdateService = async (serviceData: UpdateServiceRequest) => {
    if (!selectedService) return;

    try {
      setIsModalLoading(true);
      await servicesApi.updateService(selectedService.id, serviceData);
      await loadServices();
      setIsModalOpen(false);
      setSelectedService(null);
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      await servicesApi.deleteService(service.id);
      await loadServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    }
  };

  const handleOpenModal = (service?: Service) => {
    setSelectedService(service || null);
    setIsModalOpen(true);
  };

  const handleSaveService = async (serviceData: CreateServiceRequest | UpdateServiceRequest) => {
    if (selectedService) {
      await handleUpdateService(serviceData as UpdateServiceRequest);
    } else {
      await handleCreateService(serviceData as CreateServiceRequest);
    }
  };

  const filteredServices = services.filter(service => {
    if (statusFilter === 'active') return service.status;
    if (statusFilter === 'inactive') return !service.status;
    return true;
  });

  const getServiceTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getServiceTypeColor = (type: string) => {
    const colors = {
      consultation: 'bg-blue-100 text-blue-800',
      vaccination: 'bg-green-100 text-green-800',
      surgery: 'bg-red-100 text-red-800',
      grooming: 'bg-purple-100 text-purple-800',
      emergency: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <Layout title="Services">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search services..."
          />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Service</span>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="consultation">Consultation</option>
                <option value="vaccination">Vaccination</option>
                <option value="surgery">Surgery</option>
                <option value="grooming">Grooming</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
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

            <div className="space-x-2 flex-shrink-0">
              <label>Type:</label>
                <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="consultation">Consultation</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="surgery">Surgery</option>
                  <option value="grooming">Grooming</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Sort:</label>
                <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
                </select>
              </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Show:</label>
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

        {error && (
          <ErrorState
            title="Failed to load services"
            message={error}
            onRetry={loadServices}
            retryText="Retry Loading"
          />
        )}

          {loading ? (
          <>
            <MobileCardSkeleton items={5} />
            <div className="hidden lg:block">
              <TableSkeleton rows={5} cols={6} />
            </div>
          </>
        ) : filteredServices.length === 0 ? (
          <EmptyState
            icon="🏥"
            title="No services found"
            message="No services match your current search and filter criteria. Try adjusting your filters or create a new service."
            actionText="Create Service"
            onAction={() => handleOpenModal()}
          />
          ) : (
            <>
              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">🏥</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{service.service_type}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        service.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-lg font-semibold text-[#007c7c]">${service.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium">{service.duration_minutes} minutes</p>
                      </div>
                    </div>

                    {service.description && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm text-gray-700">{service.description}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(service)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service)}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                              {service.description && (
                                <div className="text-sm text-gray-500">{service.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(service.service_type)}`}>
                              {getServiceTypeLabel(service.service_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${Number(service.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.duration_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.status 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleOpenModal(service)}
                              className="text-[#007c7c] hover:text-[#005f5f] mr-3"
                              title="Edit service"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              onClick={() => handleDeleteService(service)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete service"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalServices)}
                        </span>{' '}
                        of <span className="font-medium">{totalServices}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
            </>
          )}

        <ServiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
          onSave={handleSaveService}
          service={selectedService}
          isLoading={isModalLoading}
        />
      </div>
    </Layout>
  );
};

export default Services; 