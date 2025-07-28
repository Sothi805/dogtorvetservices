import React, { useEffect, useState, useCallback } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash, faCheck, faDollarSign } from "@fortawesome/free-solid-svg-icons"
import { clientsApi, Client } from "../../api/clients"
import { invoicesApi } from "../../api/invoices"
import { CustomerForm } from "../CustomerForm"
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState } from "../ui/loading"

interface CustomerTableProps {
  statusFilter: "all" | "active" | "inactive"
  sortBy: "name" | "created_at" | "id" | "status"
  sortOrder: "asc" | "desc"
  pageSize: number
  searchTerm?: string
  onCreateCustomerRef?: (callback: () => void) => void
}

interface CustomerWithSpent extends Client {
  totalSpent?: number
  pendingAmount?: number
}

const CustomerTable: React.FC<CustomerTableProps> = ({ 
  statusFilter, 
  sortBy,
  sortOrder, 
  pageSize, 
  searchTerm = "", 
  onCreateCustomerRef 
}) => {
  const [customers, setCustomers] = useState<CustomerWithSpent[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithSpent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Client | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🔄 Fetching customers...")
      const customersData = await clientsApi.getClients()
      console.log("✅ Customers fetched:", customersData)
      
      // Fetch invoice data for each customer to calculate spending
      const customersWithSpent = await Promise.all(
        customersData.map(async (customer) => {
          try {
            // Get invoices for this customer using the correct API structure
            const invoicesResponse = await invoicesApi.getInvoices({
              client_id: customer.id,
              per_page: 100
            })
            
            const invoices = invoicesResponse.data || []
            
            // Calculate total spent (paid invoices)
            const totalSpent = invoices
              .filter(invoice => invoice.payment_status === 'paid')
              .reduce((sum, invoice) => sum + Number(invoice.total), 0)
            
            // Calculate pending amount (pending invoices)
            const pendingAmount = invoices
              .filter(invoice => invoice.payment_status === 'pending')
              .reduce((sum, invoice) => sum + Number(invoice.total), 0)
            
            return {
              ...customer,
              totalSpent,
              pendingAmount
            }
          } catch (error) {
            console.error(`Error fetching invoices for customer ${customer.id}:`, error)
            return {
              ...customer,
              totalSpent: 0,
              pendingAmount: 0
            }
          }
        })
      )
      
      setCustomers(customersWithSpent)
    } catch (err: any) {
      console.error("Failed to fetch customers", err)
      setError("Failed to load customers. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleCreate = useCallback(() => {
    console.log("🔘 CustomerTable - handleCreate called");
    setEditingCustomer(null)
    setIsFormOpen(true)
  }, [])

  useEffect(() => {
    console.log("🔧 CustomerTable - onCreateCustomerRef callback setup");
    if (onCreateCustomerRef) {
      onCreateCustomerRef(handleCreate)
      console.log("✅ CustomerTable - handleCreate callback set");
    }
  }, [onCreateCustomerRef, handleCreate])

  useEffect(() => {
    let filtered = customers

    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter(customer => customer.status === isActive)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone_number && customer.phone_number.toLowerCase().includes(searchLower)) ||
        customer.gender.toLowerCase().includes(searchLower) ||
        (customer.other_contact_info && customer.other_contact_info.toLowerCase().includes(searchLower))
      )
    }

    // Apply sorting based on selected field
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "status":
          // For status sorting: false (inactive) should come first in base comparison
          // Then we flip with sortOrder to get the desired result
          comparison = (a.status === b.status) ? 0 : a.status ? 1 : -1;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    })

    setFilteredCustomers(filtered)
    setCurrentPage(1)
  }, [customers, statusFilter, sortBy, sortOrder, searchTerm, pageSize])

  const handleStatusToggle = async (customer: CustomerWithSpent) => {
    try {
      await clientsApi.updateClient(customer.id, {
        status: !customer.status
      })
      await fetchCustomers()
    } catch (error) {
      console.error("Failed to update status", error)
      alert("Failed to update status")
    }
  }

  const handleDelete = async (customer: CustomerWithSpent) => {
    if (!confirm(`Are you sure you want to deactivate "${customer.name}"?`)) {
      return
    }

    try {
      // Soft delete: set status to inactive instead of actual deletion
      await clientsApi.updateClient(customer.id, {
        status: false
      })
      await fetchCustomers()
    } catch (error) {
      console.error("Failed to deactivate customer", error)
      alert("Failed to deactivate customer")
    }
  }

  const handleEdit = (customer: CustomerWithSpent) => {
    setEditingCustomer(customer)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingCustomer(null)
  }

  const handleFormSuccess = () => {
    fetchCustomers()
    setIsFormOpen(false)
    setEditingCustomer(null)
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  console.log("🔍 CustomerTable render - customers:", customers.length, "filtered:", filteredCustomers.length, "current:", currentCustomers.length);
  console.log("🔍 CustomerTable render - loading:", loading, "error:", error);

  if (loading) {
    console.log("📱 Rendering loading state");
    return (
      <>
        <MobileCardSkeleton items={5} />
        <div className="hidden lg:block">
          <TableSkeleton rows={5} cols={10} />
        </div>
      </>
    )
  }

  if (error) {
    console.log("❌ Rendering error state:", error);
    return (
      <ErrorState
        title="Failed to load customers"
        message={error}
        onRetry={fetchCustomers}
        retryText="Try Again"
      />
    )
  }

  console.log("✅ Rendering customer table with", currentCustomers.length, "customers");

  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {currentCustomers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers found"
            message="No customers match your current search and filter criteria. Try adjusting your filters or create a new customer."
            actionText="Create Customer"
            onAction={handleCreate}
          />
        ) : (
          currentCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="text-2xl mr-3 flex-shrink-0">👤</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{customer.gender}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                  customer.status 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customer.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium truncate">{customer.phone_number || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Contact Info</p>
                  <p className="text-sm font-medium truncate">{customer.other_contact_info || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-sm font-medium text-green-600">
                    <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                    {customer.totalSpent?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-sm font-medium text-orange-600">
                    <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                    {customer.pendingAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500">Registered</p>
                <p className="text-sm text-gray-700">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                  Edit
                </button>
                {customer.status ? (
                <button
                  onClick={() => handleDelete(customer)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors flex-shrink-0"
                    title="Set Inactive"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                ) : (
                  <button
                    onClick={() => handleStatusToggle(customer)}
                    className="bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors flex-shrink-0"
                    title="Set Active"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">👥</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No customers found</h3>
                      <p className="text-gray-600 text-center mb-4">No customers match your current search and filter criteria.</p>
                      <button 
                        onClick={handleCreate}
                        className="bg-[#007c7c] text-white px-4 py-2 rounded-lg hover:bg-[#005f5f] transition-colors"
                      >
                        Create Customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCustomers.map((customer, _index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[100px] overflow-hidden text-ellipsis">
                      {customer.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap max-w-[150px] overflow-hidden">
                      <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {customer.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.phone_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis">
                      {customer.other_contact_info || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                        {customer.totalSpent?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-orange-600">
                        <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                        {customer.pendingAmount?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-[#007c7c] hover:text-[#005f5f] mr-3"
                        title="Edit customer"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      {customer.status ? (
                      <button
                        onClick={() => handleDelete(customer)}
                        className="text-red-600 hover:text-red-900"
                          title="Set Inactive"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(customer)}
                          className="text-green-600 hover:text-green-900"
                          title="Set Active"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-md shadow-sm border border-gray-200 mt-4 px-3 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Results Info */}
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-700">{startIndex + 1}</span>-<span className="font-medium text-gray-700">{Math.min(endIndex, filteredCustomers.length)}</span> of <span className="font-medium text-gray-700">{filteredCustomers.length}</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border transition-all ${
                  currentPage === 1
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const showPages = 3; // Show max 3 page numbers for compact design
                  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  // Adjust start if we're near the end
                  if (endPage - startPage < showPages - 1) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }

                  // First page + ellipsis
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-all"
            >
                        1
            </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="inline-flex items-center justify-center w-6 h-6 text-xs text-gray-400">
                          ...
                        </span>
                      );
                    }
                  }

                  // Page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
            <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded border transition-all ${
                          i === currentPage
                            ? 'bg-[#007c7c] text-white border-[#007c7c]'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
            >
                        {i}
            </button>
                    );
                  }

                  // Last page + ellipsis
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="inline-flex items-center justify-center w-6 h-6 text-xs text-gray-400">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-all"
                >
                        {totalPages}
                </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              {/* Mobile Page Info */}
              <div className="sm:hidden text-xs text-gray-500 font-medium px-2">
                {currentPage}/{totalPages}
              </div>

              {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
                >
                  Next
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                </button>
            </div>
          </div>
        </div>
      )}

      <CustomerForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        customer={editingCustomer}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}

export default CustomerTable
