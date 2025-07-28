import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faUser, faPaw, faCalendarAlt, faXmark, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { invoicesApi, Invoice, CreateInvoiceRequest } from '../../api/invoices';
import { clientsApi, Client } from '../../api/clients';
import { petsApi, Pet } from '../../api/pets';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  onSuccess: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    client_id: '',
    pet_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount_percent: 0,
    notes: ''
  });

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  // Search and pagination states
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [petSearchTerm, setPetSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [petPage, setPetPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Helper function to format date for HTML input
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If it's a full ISO string, extract the date part
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      // If it's a different format, try to parse it
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Fallback to current date
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (invoice) {
        setIsEditMode(true);
        console.log('📅 Invoice date from backend:', invoice.invoice_date);
        console.log('📅 Due date from backend:', invoice.due_date);
        
        setFormData({
          client_id: invoice.client_id || '',
          pet_id: invoice.pet_id || '',
          invoice_date: formatDateForInput(invoice.invoice_date),
          due_date: formatDateForInput(invoice.due_date),
          discount_percent: Number(invoice.discount_percent) || 0,
          notes: invoice.notes || ''
        });
      } else {
        setIsEditMode(false);
        setFormData({
          client_id: '',
          pet_id: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          discount_percent: 0,
          notes: ''
        });
      }
    }
  }, [isOpen, invoice]);

  useEffect(() => {
    if (formData.client_id) {
      loadPetsForClient(formData.client_id);
    } else {
      setPets([]);
      setFormData(prev => ({ ...prev, pet_id: '' }));
    }
  }, [formData.client_id]);

  const loadInitialData = async () => {
    try {
      setError(null);
      console.log('🔄 Loading initial data for invoice modal...');
      
      // Load clients
      const clientsData = await clientsApi.getClients();
      console.log('📊 Clients data:', clientsData);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      
    } catch (err: any) {
      console.error('❌ Failed to load initial data:', err);
      setError('Failed to load initial data');
    }
  };

  const loadPetsForClient = async (clientId: string) => {
    try {
      console.log('🔄 Loading pets for client:', clientId);
      const petsData = await petsApi.getPets({ client_id: clientId });
      console.log('📊 Pets data:', petsData);
      // Handle paginated response - extract the data array
      setPets(petsData.data || []);
    } catch (err: any) {
      console.error('❌ Failed to load pets:', err);
      setPets([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'discount_percent' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting invoice data:', formData);
      
      if (isEditMode && invoice) {
        await invoicesApi.updateInvoice(invoice.id, formData);
        console.log('✅ Invoice updated successfully');
      } else {
        await invoicesApi.createInvoice(formData);
        console.log('✅ Invoice created successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('❌ Failed to save invoice:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save invoice';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      pet_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount_percent: 0,
      notes: ''
    });
    setClientSearchTerm('');
    setPetSearchTerm('');
    setClientPage(1);
    setPetPage(1);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter and paginate data
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.other_contact_info?.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(petSearchTerm.toLowerCase()) ||
    pet.species?.name.toLowerCase().includes(petSearchTerm.toLowerCase())
  );

  const paginatedClients = filteredClients.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
  const paginatedPets = filteredPets.slice((petPage - 1) * itemsPerPage, petPage * itemsPerPage);

  const totalClientPages = Math.ceil(filteredClients.length / itemsPerPage);
  const totalPetPages = Math.ceil(filteredPets.length / itemsPerPage);

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
      <div className="relative w-full max-w-4xl max-h-[90vh]">
        {/* Transparent glass effect with drop shadow */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2 text-[#007c7c]" />
              {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
          </button>
        </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-100 font-medium">{error}</p>
                    </div>
                  </div>
            </div>
          )}

              <div className="grid grid-cols-2 gap-6">
                {/* Client Selection */}
          <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-[#007c7c]" />
                    Client <span className="text-red-500">*</span>
            </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      {paginatedClients.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {clientSearchTerm ? 'No clients found' : 'No clients available'}
                        </div>
                      ) : (
                        <>
                          {paginatedClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, client_id: client.id }))}
                              className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                formData.client_id === client.id ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{client.name}</div>
                              {client.other_contact_info && <div className="text-xs text-gray-600">{client.other_contact_info}</div>}
                            </button>
                          ))}
                          {totalClientPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                                disabled={clientPage === 1}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronLeft} />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {clientPage} of {totalClientPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setClientPage(prev => Math.min(totalClientPages, prev + 1))}
                                disabled={clientPage === totalClientPages}
                                className="px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
          </div>

                {/* Pet Selection */}
          <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#007c7c]" />
                    Pet <span className="text-gray-500">(optional)</span>
            </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder={formData.client_id ? "Search pets..." : "Select a client first"}
                        value={petSearchTerm}
                        onChange={(e) => setPetSearchTerm(e.target.value)}
                        disabled={!formData.client_id}
                        className="w-full pl-10 pr-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm disabled:opacity-50"
                      />
                    </div>
                    {formData.client_id && (
                      <div className="max-h-40 overflow-y-auto bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                        {paginatedPets.length === 0 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            {petSearchTerm ? 'No pets found' : 'No pets available'}
                          </div>
                        ) : (
                          <>
                            {paginatedPets.map(pet => (
                              <button
                                key={pet.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, pet_id: pet.id }))}
                                className={`w-full p-3 text-left hover:bg-white/30 transition-colors ${
                                  formData.pet_id === pet.id ? 'bg-[#007c7c]/20 text-[#007c7c]' : 'text-gray-900'
                                }`}
                              >
                                <div className="font-medium">{pet.name}</div>
                                {pet.species && <div className="text-xs text-gray-600">{pet.species.name}</div>}
                              </button>
                            ))}
                            {totalPetPages > 1 && (
                              <div className="flex justify-between items-center p-3 border-t border-white/20">
                                <button
                                  type="button"
                                  onClick={() => setPetPage(prev => Math.max(1, prev - 1))}
                                  disabled={petPage === 1}
                                  className="px-2 py-1 text-xs disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <span className="text-xs text-gray-600">
                                  Page {petPage} of {totalPetPages}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPetPage(prev => Math.min(totalPetPages, prev + 1))}
                                  disabled={petPage === totalPetPages}
                                  className="px-2 py-1 text-xs disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
          </div>

                {/* Invoice Date */}
            <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#007c7c]" />
                    Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  />
            </div>

                {/* Due Date */}
            <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#007c7c]" />
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  />
          </div>



                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount_percent"
                    value={formData.discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  />
            </div>
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Notes <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
                  onChange={handleInputChange}
              rows={3}
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  placeholder="Enter any additional notes..."
            />
          </div>

              {/* Footer with subtle glass effect */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20 mt-6">
            <button
              type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/40 hover:bg-white/60 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                  disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                      <FontAwesomeIcon icon={faFileInvoiceDollar} />
                      <span>{isEditMode ? 'Update Invoice' : 'Create Invoice'}</span>
                </>
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 