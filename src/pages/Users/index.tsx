import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import UserModal from "../../components/UserModal";
import {
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
  faUserMd,
  faUserTie,
  faUserCog,
  faEdit,
  faTrash,
  faEye,
  faCalendarAlt,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { usersApi, User, UserFilters, CreateUserRequest, UpdateUserRequest } from "../../api/users";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState, InlineSpinner } from "../../components/ui/loading";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "vet" | "assistant">("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Force default to "active" on component mount to show only active users
  useEffect(() => {
    setStatusFilter("active");
    console.log("🔧 Users tab opened - filter set to 'active'");
  }, []);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only send supported parameters to avoid 422 errors
      const filters: UserFilters = {
        per_page: pageSize,
        page: currentPage
      };
      
      // Only add search if it has a value
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const response = await usersApi.getUsers(filters);
      setUsers(response.data);
      setTotalPages(response.meta.last_page);
      setTotalUsers(response.meta.total);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load staff members: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error loading users:', err);
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

  const loadUsersWithAppointments = async () => {
    try {
      setLoadingAppointments(true);
      
      // Only send supported parameters to avoid 422 errors
      const filters: UserFilters = {
        page: 1,
        per_page: 100  // Backend max limit is 100
      };
      
      // Only add search if it has a value
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const usersWithCounts = await usersApi.getUsersWithAppointmentCounts(filters);
      
      // Apply pagination client-side since we need all users for appointment counts
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = usersWithCounts.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotalPages(Math.ceil(usersWithCounts.length / pageSize));
      setTotalUsers(usersWithCounts.length);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load staff members with appointment data: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error loading users with appointments:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    // Load basic user data first, then enhance with appointment counts
    loadUsers();
  }, [searchTerm, pageSize, currentPage, sortOrder, statusFilter, roleFilter]);

  useEffect(() => {
    // Load appointment counts separately to avoid blocking main data
    const timer = setTimeout(() => {
      loadUsersWithAppointments();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, sortOrder, statusFilter, roleFilter, currentPage, pageSize]);

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      setIsModalLoading(true);
      await usersApi.createUser(userData);
      await loadUsers();
      await loadUsersWithAppointments();
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to create user: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error creating user:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleUpdateUser = async (userData: UpdateUserRequest) => {
    if (!selectedUser) return;

    try {
      setIsModalLoading(true);
      await usersApi.updateUser(selectedUser.id, userData);
      await loadUsers();
      await loadUsersWithAppointments();
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to update user: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error updating user:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"? This will remove them from the system but won't affect historical records.`)) {
      return;
    }

    try {
      await usersApi.deleteUser(user.id);
      await loadUsers();
      await loadUsersWithAppointments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to delete user: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error deleting user:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
      alert('Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.updateUser(user.id, { status: !user.status });
      await loadUsers();
      await loadUsersWithAppointments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to update user status: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
      console.error('Error updating user status:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers
      });
      alert('Failed to update status');
    }
  };

  const handleOpenModal = (user?: User) => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: CreateUserRequest | UpdateUserRequest) => {
    if (selectedUser) {
      await handleUpdateUser(userData as UpdateUserRequest);
    } else {
      await handleCreateUser(userData as CreateUserRequest);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FontAwesomeIcon icon={faUserCog} className="text-purple-500" />;
      case 'vet':
        return <FontAwesomeIcon icon={faUserMd} className="text-blue-500" />;
      case 'assistant':
        return <FontAwesomeIcon icon={faUserTie} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'vet':
        return 'bg-blue-100 text-blue-800';
      case 'assistant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredUsers = users.filter(user => {
    if (statusFilter === 'active') return user.status;
    if (statusFilter === 'inactive') return !user.status;
    return true;
  });

  return (
    <Layout title="Staff">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex-1 sm:max-w-md">
            <Search 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search staff members..."
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Mobile/Tablet Filter Controls */}
        <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "vet" | "assistant")}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="vet">Veterinarian</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>
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
                setRoleFilter("all");
                setStatusFilter("all");
                setSortOrder("asc");
                setPageSize(10);
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
            className="hover:text-[#007c7c] transition-all duration-300 p-2 rounded-md hover:bg-gray-100 flex items-center justify-between text-sm text-gray-600"
            title={isMenuVisible ? "Hide Filters" : "Show Filters"}
          >
            <span>Filters & Sorting</span>
            <FontAwesomeIcon 
              icon={faBarsStaggered} 
              className={`text-lg transition-transform duration-300 ${
                isMenuVisible ? 'transform rotate-0' : 'transform rotate-180'
              }`} 
            />
          </button>

          <div className={`transition-all duration-500 ease-in-out ${
            isMenuVisible 
              ? 'transform translate-y-0 opacity-100 max-h-96' 
              : 'transform -translate-y-4 opacity-0 max-h-0'
          } overflow-hidden`}>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-md">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
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

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Role:</label>
                <select 
                  className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200 text-xs"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "vet" | "assistant")}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="vet">Veterinarian</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>

              {/* Sort Control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Sort:</label>
                <select 
                  className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200 text-xs"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                >
                  <option value="asc">A-Z</option>
                  <option value="desc">Z-A</option>
                </select>
              </div>

              {/* Page Size Control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Show:</label>
                <select 
                  className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200 text-xs"
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
        </div>

        {error && (
          <ErrorState
            title="Failed to load staff members"
            message={error}
            onRetry={loadUsers}
            retryText="Retry Loading"
          />
        )}

        {loading ? (
          <>
            <MobileCardSkeleton items={5} />
            <div className="hidden md:block">
              <TableSkeleton rows={5} cols={6} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden p-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No staff members found</div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-medium text-gray-900">{user.name}</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {user.role === 'vet' ? 'Veterinarian' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                              user.status 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {user.status ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="text-sm text-gray-500 flex items-center space-x-3">
                            <span className="flex items-center">
                              <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center">
                                <FontAwesomeIcon icon={faPhone} className="w-3 h-3 mr-1" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                          {user.specialization && (
                            <div className="text-xs text-gray-400">
                              Specialization: {user.specialization}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-[#007c7c] font-semibold">
                              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                              Today: {user.today_appointments_count !== undefined ? user.today_appointments_count : '-'} appointments
                            </div>
                            <div className="text-xs text-gray-400">
                              Since: {user.updated_at ? formatDate(user.updated_at) : '-'}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-3 border-t">
                          <button 
                            onClick={() => handleOpenModal(user)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full font-medium transition-colors"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full font-medium transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today's Appointments
                        {loadingAppointments && (
                          <div className="inline-block ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No staff members found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {getRoleIcon(user.role)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500 flex items-center space-x-3">
                                  <span className="flex items-center">
                                    <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1" />
                                    {user.email}
                                  </span>
                                  {user.phone && (
                                    <span className="flex items-center">
                                      <FontAwesomeIcon icon={faPhone} className="w-3 h-3 mr-1" />
                                      {user.phone}
                                    </span>
                                  )}
                                </div>
                                {user.specialization && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Specialization: {user.specialization}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {user.role === 'vet' ? 'Veterinarian' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                user.status 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {user.status ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-semibold text-[#007c7c]">
                                {user.today_appointments_count !== undefined ? user.today_appointments_count : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.updated_at ? formatDate(user.updated_at) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleOpenModal(user)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Edit staff member"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete staff member"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-200 rounded-lg mt-4">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700 text-center sm:text-left">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalUsers)}
                </span>{' '}
                of <span className="font-medium">{totalUsers}</span> results
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
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
        )}

        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
          user={selectedUser}
          isLoading={isModalLoading}
        />
      </div>
    </Layout>
  );
};

export default Users; 