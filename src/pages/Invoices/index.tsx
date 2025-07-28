import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import InvoiceModal from "../../components/InvoiceModal";
import InvoiceItemModal from "../../components/InvoiceItemModal";
import {
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
  faDownload,
  faClock,
  faEdit,
  faTrash,
  faDollarSign,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { invoicesApi, Invoice, InvoiceFilters } from "../../api/invoices";
import { invoiceItemsApi, InvoiceItem, CreateInvoiceItemRequest, UpdateInvoiceItemRequest } from "../../api/invoice-items";
import { clientsApi } from "../../api/clients";

import { servicesApi } from "../../api/services";
import { productsApi } from "../../api/products";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState } from "../../components/ui/loading";

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  // const [isModalLoading, setIsModalLoading] = useState(false);
  
  // Invoice Items Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  // const [isItemModalLoading, setIsItemModalLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Support data
  const [services, setServices] = useState<Array<{ id: number; name: string; price: number; description?: string; }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: number; description?: string; }>>([]);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: InvoiceFilters = {
        search: searchTerm || undefined,
        per_page: pageSize,
        page: currentPage,
        sort_by: 'invoice_date',
        sort_order: sortOrder,
        include_inactive: statusFilter === 'all',
        // Remove payment_status since we calculate it dynamically
        include: 'client,pet',
        include_deleted: showDeleted,
      };

      const response = await invoicesApi.getInvoices(filters);
      
      console.log('📥 Invoices API response:', response);
      
      // Handle paginated response format
      if (response && (response as any).data && Array.isArray((response as any).data)) {
        const invoicesData = (response as any).data;
        console.log('📊 Invoices data:', invoicesData);
        

        
        setInvoices(invoicesData);
        if ((response as any).meta) {
          setTotalInvoices((response as any).meta.total);
          setTotalPages((response as any).meta.last_page);
        } else {
          setTotalInvoices(invoicesData.length);
          setTotalPages(1);
        }
      } else {
        console.error('❌ Invalid invoices data format:', response);
        setError('Invalid data format received from server');
        setInvoices([]);
        setTotalInvoices(0);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportData = async () => {
    try {
      // Load clients for modal
      const clientsResponse = await clientsApi.getClients();
      const clientsData = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse as any).data;
      console.log('Clients data:', clientsData); // Debug log
      // setClients(clientsData.map((client: any) => ({ 
      //   id: client.id, 
      //   name: client.name
      // })));



      // Load services for invoice items
      const servicesResponse = await servicesApi.getServices({ status: 'active', per_page: 100 });
      setServices(servicesResponse.map(service => ({
        id: Number(service.id),
        name: service.name,
        price: Number(service.price),
        description: service.description
      })));

      // Load products for invoice items
      const productsResponse = await productsApi.getProducts({ per_page: 100 });
      setProducts((Array.isArray(productsResponse) ? productsResponse : []).map(product => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description
      })));
    } catch (err) {
      console.error('Error loading support data:', err);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchTerm, pageSize, currentPage, sortOrder, statusFilter, showDeleted]);

  useEffect(() => {
    loadSupportData();
  }, []);

  // const handleCreateInvoice = async (invoiceData: CreateInvoiceRequest) => {
  //   try {
  //     // setIsModalLoading(true);
  //     const newInvoice = await invoicesApi.createInvoice(invoiceData);
      
  //     // Navigate to the print preview page for the new invoice
  //     navigate(`/print-preview/${newInvoice.id}`);
      
  //     // It's good practice to still close the modal and refresh the list in the background
  //     await loadInvoices();
  //     setIsModalOpen(false);
  //     setSelectedInvoice(null);
  //   } catch (err) {
  //     console.error('Error creating invoice:', err);
  //     // Re-throw the error so the modal can display it
  //     throw err;
  //   } finally {
  //     // setIsModalLoading(false);
  //   }
  // };

  // const handleUpdateInvoice = async (invoiceData: UpdateInvoiceRequest) => {
  //   if (!selectedInvoice) return;

  //   try {
  //     // setIsModalLoading(true);
  //     await invoicesApi.updateInvoice(selectedInvoice.id.toString(), invoiceData);
  //     await loadInvoices();
  //     setIsModalOpen(false);
  //     setSelectedInvoice(null);
  //   } catch (err) {
  //     console.error('Error updating invoice:', err);
  //     throw err;
  //   } finally {
  //     // setIsModalLoading(false);
  //   }
  // };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoice.invoice_number}"?`)) {
      return;
    }

    try {
      await invoicesApi.deleteInvoice(invoice.id.toString());
      await loadInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    }
  };

  const handleRestoreInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to restore invoice "${invoice.invoice_number}"?`)) {
      return;
    }

    try {
      await invoicesApi.restoreInvoice(invoice.id.toString());
      await loadInvoices();
    } catch (err) {
      console.error('Error restoring invoice:', err);
      alert('Failed to restore invoice');
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await invoicesApi.markAsPaid(invoice.id.toString());
      await loadInvoices();
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      alert('Failed to update invoice status');
    }
  };

  const handleRecalculateTotals = async (invoice: Invoice) => {
    try {
      console.log(`🔄 Recalculating totals for invoice: ${invoice.id} (${invoice.invoice_number})`);
      
      // Import axios instance
      const { default: axiosInstance } = await import('../../api/axios');
      
      // First, debug the invoice to see what's happening
      console.log('🔍 Debugging invoice before recalculation...');
      const debugResponse = await axiosInstance.get(`/invoices/${invoice.id}/debug`);
      console.log('🔍 Debug data:', debugResponse.data);
      
      // Call the backend endpoint to recalculate totals
      const response = await axiosInstance.post(`/invoices/${invoice.id}/recalculate-totals`);
      
      console.log('✅ Invoice totals recalculated successfully:', response.data);
      
      // Debug again after recalculation
      console.log('🔍 Debugging invoice after recalculation...');
      const debugResponseAfter = await axiosInstance.get(`/invoices/${invoice.id}/debug`);
      console.log('🔍 Debug data after:', debugResponseAfter.data);
      
      // Force a complete refresh of the invoices list
      setCurrentPage(1); // Reset to first page
      await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay to ensure backend processing
      await loadInvoices(); // Refresh the list
      
      console.log('🔄 Invoices list refreshed after recalculation');
    } catch (err) {
      console.error('Error recalculating invoice totals:', err);
    }
  };

  // const handleRecalculateAllTotals = async () => {
  //   if (!confirm('This will recalculate totals for all invoices. Continue?')) {
  //     return;
  //   }

  //   try {
  //     const zeroTotalInvoices = filteredInvoices.filter(invoice => Number(invoice.total) === 0);
  //     console.log(`🔄 Recalculating totals for ${zeroTotalInvoices.length} invoices with $0.00 total`);
      
  //     for (const invoice of zeroTotalInvoices) {
  //       await handleRecalculateTotals(invoice);
  //     }
      
  //     alert(`✅ Recalculated totals for ${zeroTotalInvoices.length} invoices`);
  //   } catch (err) {
  //     console.error('Error recalculating all totals:', err);
  //     alert('❌ Failed to recalculate some invoice totals');
  //   }
  // };

  // const handleFixInvoiceIdFormat = async (invoice: Invoice) => {
  //   try {
  //     console.log(`🔧 Fixing invoice_id format for invoice: ${invoice.id} (${invoice.invoice_number})`);
      
  //     // Import axios instance
  //     const { default: axiosInstance } = await import('../../api/axios');
      
  //     // Call the backend endpoint to fix invoice_id format
  //     const response = await axiosInstance.post(`/invoices/${invoice.id}/fix-invoice-id-format`);
      
  //     console.log('✅ Invoice ID format fixed successfully:', response.data);
      
  //     // Force a complete refresh of the invoices list
  //     setCurrentPage(1); // Reset to first page
  //     await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay to ensure backend processing
  //     await loadInvoices(); // Refresh the list
      
  //     console.log('🔄 Invoices list refreshed after fixing invoice_id format');
  //   } catch (err) {
  //     console.error('Error fixing invoice_id format:', err);
  //   }
  // };

  const handlePrintInvoice = (invoice: Invoice) => {
    navigate(`/print-preview/${invoice.id}`);
  };

  const handleOpenModal = (invoice?: Invoice) => {
    setSelectedInvoice(invoice || null);
    setIsModalOpen(true);
  };

  // const handleSaveInvoice = async (invoiceData: CreateInvoiceRequest | UpdateInvoiceRequest) => {
  //   if (selectedInvoice) {
  //     await handleUpdateInvoice(invoiceData as UpdateInvoiceRequest);
  //   } else {
  //     await handleCreateInvoice(invoiceData as CreateInvoiceRequest);
  //   }
  // };

  // Invoice Items Management
  // const handleManageItems = async (invoice: Invoice) => {
  //   setSelectedInvoiceId(invoice.id.toString());
  //   setIsItemModalOpen(true);
  //   await loadInvoiceItems(invoice.id.toString());
  // };

  const loadInvoiceItems = async (invoiceId: string) => {
    try {
      const items = await invoiceItemsApi.getInvoiceItemsByInvoice(invoiceId);
      setInvoiceItems(items);
    } catch (err) {
      console.error('Error loading invoice items:', err);
      setInvoiceItems([]);
    }
  };

  const handleCreateInvoiceItem = async (itemData: CreateInvoiceItemRequest | UpdateInvoiceItemRequest) => {
    try {
      // setIsItemModalLoading(true);
      // For this implementation, we only support creating new items
      const createData = itemData as CreateInvoiceItemRequest;
      await invoiceItemsApi.createInvoiceItem(createData);
      if (selectedInvoiceId) {
        await loadInvoiceItems(selectedInvoiceId);
        await loadInvoices(); // Refresh invoices to update totals
      }
      alert('Item added to invoice successfully!');
    } catch (err) {
      console.error('Error creating invoice item:', err);
      throw err;
    } finally {
      // setIsItemModalLoading(false);
    }
  };

  const handleDeleteInvoiceItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the invoice?')) {
      return;
    }

    try {
      await invoiceItemsApi.deleteInvoiceItem(itemId);
      if (selectedInvoiceId) {
        await loadInvoiceItems(selectedInvoiceId);
        await loadInvoices(); // Refresh invoices to update totals
      }
      alert('Item removed from invoice successfully!');
    } catch (err) {
      console.error('Error deleting invoice item:', err);
      alert('Failed to remove item from invoice');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateInvoiceStatus = (invoice: Invoice): { status: string; color: string } => {
    // Check if invoice has items by looking at total
    const hasItems = Number(invoice.total) > 0 || Number(invoice.subtotal) > 0;
    
    if (!hasItems) {
      return { status: 'Empty', color: 'bg-gray-100 text-gray-800' };
    }
    
    const balanceDue = Number(invoice.total) - Number(invoice.deposit || 0);
    
    if (balanceDue <= 0) {
      return { status: 'Paid', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(invoice => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesInvoiceNumber = invoice.invoice_number?.toLowerCase().includes(searchLower);
      const matchesClientName = invoice.client?.name?.toLowerCase().includes(searchLower);
      const matchesPetName = invoice.pet?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesInvoiceNumber && !matchesClientName && !matchesPetName) {
        return false;
      }
    }

    // Apply status filter using new dynamic status
    const { status } = calculateInvoiceStatus(invoice);
    if (statusFilter === 'pending') return status === 'Pending';
    if (statusFilter === 'paid') return status === 'Paid';
    if (statusFilter === 'overdue') return status === 'Empty'; // Treat empty as overdue for filtering
    
    return true;
  });

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'paid':
  //       return 'bg-green-100 text-green-800';
  //     case 'pending':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'overdue':
  //       return 'bg-red-100 text-red-800';
  //     case 'cancelled':
  //       return 'bg-gray-100 text-gray-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  return (
    <Layout title="Invoices">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
              placeholder="Search by invoice number, client name, or pet name..."
          />
            <p className="text-xs text-gray-500 mt-1">
              💡 Search by invoice number (e.g., INV-00250724001), client name, or pet name
            </p>
          </div>
                      <div className="flex space-x-2">
              <button 
                onClick={() => handleOpenModal()}
              className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Filter Controls */}
        <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "paid" | "overdue")}
              >
                <option value="all">All Invoices</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Empty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
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
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSortOrder("desc");
                  setPageSize(15);
                  setSearchTerm("");
                  setShowDeleted(false);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
              >
                Reset Filters
                              </button>
              </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const testInvoice = filteredInvoices.find(inv => inv.invoice_number === 'INV-00250724001');
                  if (testInvoice) {
                    handleRecalculateTotals(testInvoice);
                  } else {
                    alert('Test invoice not found');
                  }
                }}
                className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md text-sm transition-colors"
              >
                Test Recalc INV-00250724001
              </button>
            </div>
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="rounded border-gray-300 text-[#007c7c] focus:ring-[#007c7c]"
                />
                <span className="text-sm text-gray-700">Show Deleted Invoices</span>
              </label>
            </div>
          </div>
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 mb-4 overflow-hidden">
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
                <span>All</span>
              </button>

              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "pending" ? "bg-yellow-500" : "bg-yellow-300 hover:bg-yellow-400"
                }`}
              >
                <span>Pending</span>{" "}
                <FontAwesomeIcon icon={faClock} />
              </button>

              <button
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "paid" ? "bg-green-500" : "bg-green-300 hover:bg-green-400"
                }`}
              >
                <span>Paid</span>{" "}
                <FontAwesomeIcon icon={faCheck} />
              </button>

              <button
                onClick={() => setStatusFilter("overdue")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "overdue" ? "bg-red-500" : "bg-red-300 hover:bg-red-400"
                }`}
              >
                <span>Empty</span>{" "}
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Sort :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Show :</label>
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

            <div className="space-x-2 flex-shrink-0">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="rounded border-gray-300 text-[#007c7c] focus:ring-[#007c7c]"
                />
                <span className="text-sm">Show Deleted</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Failed to load invoices"
            message={error}
            onRetry={loadInvoices}
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
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No invoices found"
            message="No invoices match your current search and filter criteria. Try searching by invoice number, client name, or pet name, or adjust your filters."
          />
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            {/* Mobile Card Layout */}
            <div className="md:hidden p-4">
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className={`bg-gray-50 rounded-lg p-4 border ${!invoice.status ? 'opacity-60 bg-red-50 border-red-200' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="text-lg font-medium text-gray-900 flex items-center">
                          {invoice.invoice_number}
                          {!invoice.status && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              DELETED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.client?.name} {invoice.pet && `• ${invoice.pet.name}`}
                        </div>
                      </div>
                      {(() => {
                        const { status, color } = calculateInvoiceStatus(invoice);
                        return (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                            {status.toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <div className="font-medium">{formatDate(invoice.invoice_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <div className="font-medium">
                          <span>${Number(invoice.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-500">Deposit:</span>
                        <div className="font-medium">
                          <span>${Number(invoice.deposit || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Balance Due:</span>
                        <div className="font-medium">
                          <span>${(Number(invoice.total) - Number(invoice.deposit || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleOpenModal(invoice)}
                          className="text-[#007c7c] hover:text-[#005f5f] p-2"
                          title="Edit invoice"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          onClick={() => handlePrintInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-2"
                          title="Print invoice"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        {(() => {
                          const { status } = calculateInvoiceStatus(invoice);
                          return status === 'Pending';
                        })() && (
                          <button 
                            onClick={() => handleMarkAsPaid(invoice)}
                            className="text-green-600 hover:text-green-900 p-2"
                            title="Mark as paid"
                          >
                            <FontAwesomeIcon icon={faDollarSign} />
                          </button>
                        )}
                        {invoice.status ? (
                        <button 
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Delete invoice"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        ) : (
                          <button 
                            onClick={() => handleRestoreInvoice(invoice)}
                            className="text-green-600 hover:text-green-900 p-2"
                            title="Restore invoice"
                          >
                            <FontAwesomeIcon icon={faRotateLeft} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deposit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className={`hover:bg-gray-50 ${!invoice.status ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {invoice.invoice_number}
                          {!invoice.status && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              DELETED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.client?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.pet?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(invoice.invoice_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <span>${Number(invoice.total).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <span>${Number(invoice.deposit || 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <span>${(Number(invoice.total) - Number(invoice.deposit || 0)).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const { status, color } = calculateInvoiceStatus(invoice);
                          return (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                              {status.toUpperCase()}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleOpenModal(invoice)}
                            className="text-[#007c7c] hover:text-[#005f5f]"
                            title="Edit invoice"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handlePrintInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Print invoice"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                          {(() => {
                            const { status } = calculateInvoiceStatus(invoice);
                            return status === 'Pending';
                          })() && (
                            <button 
                              onClick={() => handleMarkAsPaid(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as paid"
                            >
                              <FontAwesomeIcon icon={faDollarSign} />
                            </button>
                          )}
                          {invoice.status ? (
                          <button 
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete invoice"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                          ) : (
                            <button 
                              onClick={() => handleRestoreInvoice(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore invoice"
                            >
                              <FontAwesomeIcon icon={faRotateLeft} />
                            </button>
                          )}
                        </div>
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
                        {Math.min(currentPage * pageSize, totalInvoices)}
                      </span>{' '}
                      of <span className="font-medium">{totalInvoices}</span> results
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
          </div>
        )}

        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            loadInvoices();
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />

        {selectedInvoiceId && (
          <InvoiceItemModal
            isOpen={isItemModalOpen}
            onClose={() => {
              setIsItemModalOpen(false);
              setSelectedInvoiceId(null);
              setInvoiceItems([]);
            }}
            onSave={handleCreateInvoiceItem}
            invoiceId={selectedInvoiceId}
            isLoading={false} // setIsItemModalLoading(false);
            services={services}
            products={products}
          />
        )}

        {/* Invoice Items List Modal */}
        {selectedInvoiceId && isItemModalOpen && invoiceItems.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Invoice Items
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Reset to add new item mode
                      setInvoiceItems([]);
                    }}
                    className="bg-[#007c7c] text-white px-3 py-1 rounded-md text-sm hover:bg-[#005f5f]"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    Add Item
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.item_type === 'service' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.item_type}
                          </span>
                          <span className="font-medium text-gray-900">{item.item_name}</span>
                        </div>
                        {item.item_description && (
                          <p className="text-sm text-gray-600 mb-2">{item.item_description}</p>
                        )}
                        <div className="text-sm text-gray-700">
                          <span>Qty: {item.quantity}</span>
                          <span className="mx-2">•</span>
                          <span>Unit: ${Number(item.unit_price).toFixed(2)}</span>
                          {Number(item.discount_percent) > 0 && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Discount: {item.discount_percent}%</span>
                            </>
                          )}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Total: ${Number(item.net_price).toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInvoiceItem(item.id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                        title="Remove item"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Invoices; 