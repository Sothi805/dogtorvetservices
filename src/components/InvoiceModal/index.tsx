import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest } from '../../api/invoices';
import * as yup from 'yup';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  invoice?: Invoice | null;
  isLoading: boolean;
  clients: Array<{ id: string; name: string; }>;
  pets: Array<{ id: string; name: string; client_id: string; }>;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoice,
  isLoading,
  clients,
  pets
}) => {
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    client_id: '',
    pet_id: undefined,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_percent: 0,
    payment_status: 'pending',
    notes: '',
    status: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClientPets, setSelectedClientPets] = useState<Array<{ id: string; name: string; }>>([]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id,
        pet_id: invoice.pet_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || '',
        discount_percent: Number(invoice.discount_percent),
        payment_status: invoice.payment_status,
        notes: invoice.notes || '',
        status: invoice.status,
      });
    } else {
      setFormData({
        client_id: '',
        pet_id: undefined,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        discount_percent: 0,
        payment_status: 'pending',
        notes: '',
        status: true,
      });
    }
    setErrors({});
  }, [invoice, isOpen]);

  useEffect(() => {
    if (formData.client_id && formData.client_id !== '') {
      const clientPets = pets.filter(pet => pet.client_id === formData.client_id);
      setSelectedClientPets(clientPets);
      
      // Reset pet selection if current pet doesn't belong to selected client
      if (formData.pet_id && !clientPets.find(pet => pet.id === formData.pet_id)) {
        setFormData(prev => ({ ...prev, pet_id: undefined }));
      }
    } else {
      setSelectedClientPets([]);
    }
  }, [formData.client_id, pets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? Number(value) :
               name === 'client_id' || name === 'pet_id' ? (value ? value : undefined) :
               value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Create validation schema
    const schema = yup.object().shape({
      client_id: yup.string().required('Client is required'),
      pet_id: yup.string().nullable(),
      invoice_date: yup.date().required('Invoice date is required').typeError('Invalid date format'),
      due_date: yup.date()
        .nullable()
        .when('invoice_date', (invoice_date, schema) => {
          return invoice_date ? schema.min(invoice_date, 'Due date cannot be before invoice date') : schema;
        }),
      discount_percent: yup.number()
        .min(0, 'Discount must be between 0 and 100')
        .max(100, 'Discount must be between 0 and 100')
        .nullable(),
      payment_status: yup.string().oneOf(['pending', 'paid', 'overdue', 'cancelled']).required(),
      notes: yup.string().nullable(),
      status: yup.boolean()
    });

    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((error) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      return;
    }

    try {
      // Clean the form data before sending
      const dataToSend: any = {
        client_id: formData.client_id,
        invoice_date: formData.invoice_date,
        payment_status: formData.payment_status || 'pending'
      };

      // Only include optional fields if they have meaningful values
      if (formData.pet_id && formData.pet_id !== '') {
        dataToSend.pet_id = formData.pet_id;
      }
      
      if (formData.due_date && formData.due_date !== '') {
        dataToSend.due_date = formData.due_date;
      }
      
      if (formData.discount_percent !== undefined && formData.discount_percent !== null && formData.discount_percent !== 0) {
        dataToSend.discount_percent = formData.discount_percent;
      }
      
      if (formData.notes && formData.notes.trim() !== '') {
        dataToSend.notes = formData.notes.trim();
      }

      console.log('Sending invoice data:', dataToSend); // Debug log
      await onSave(dataToSend);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setErrors({ submit: 'Failed to save invoice. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>}
          </div>

          <div>
            <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-1">
              Pet (Optional)
            </label>
            <select
              id="pet_id"
              name="pet_id"
              value={formData.pet_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading || selectedClientPets.length === 0}
            >
              <option value="">Select a pet (optional)</option>
              {selectedClientPets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
            {formData.client_id !== '' && selectedClientPets.length === 0 && (
              <p className="text-gray-500 text-sm mt-1">No pets found for this client</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                id="invoice_date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.invoice_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.invoice_date && <p className="text-red-500 text-sm mt-1">{errors.invoice_date}</p>}
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.due_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="discount_percent" className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                id="discount_percent"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.discount_percent ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="0.00"
              />
              {errors.discount_percent && <p className="text-red-500 text-sm mt-1">{errors.discount_percent}</p>}
            </div>

            <div>
              <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                disabled={isLoading}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading}
              placeholder="Enter invoice notes (optional)"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleChange}
              className="h-4 w-4 text-[#007c7c] focus:ring-[#007c7c] border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  <span>{invoice ? 'Update' : 'Create'} Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal; 