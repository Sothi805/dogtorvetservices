import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CreateInvoiceItemRequest, UpdateInvoiceItemRequest } from '../../api/invoice-items';

interface InvoiceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: CreateInvoiceItemRequest | UpdateInvoiceItemRequest) => Promise<void>;
  invoiceId: string;
  isLoading: boolean;
  services: Array<{ id: number; name: string; price: number; description?: string; }>;
  products: Array<{ id: number; name: string; price: number; description?: string; }>;
}

const InvoiceItemModal: React.FC<InvoiceItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoiceId,
  isLoading,
  services,
  products
}) => {
  const [formData, setFormData] = useState<CreateInvoiceItemRequest>({
    invoice_id: invoiceId,
    item_type: 'service',
    service_id: undefined,
    product_id: undefined,
    item_name: '',
    item_description: '',
    unit_price: 0,
    quantity: 1,
    discount_percent: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        invoice_id: invoiceId,
        item_type: 'service',
        service_id: undefined,
        product_id: undefined,
        item_name: '',
        item_description: '',
        unit_price: 0,
        quantity: 1,
        discount_percent: 0,
      });
      setErrors({});
    }
  }, [isOpen, invoiceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      };

      // Handle item type change
      if (name === 'item_type') {
        newData.service_id = undefined;
        newData.product_id = undefined;
        newData.item_name = '';
        newData.item_description = '';
        newData.unit_price = 0;
      }

      // Handle service/product selection
      if (name === 'service_id' && value) {
        const service = services.find(s => s.id === Number(value));
        if (service) {
          newData.item_name = service.name;
          newData.item_description = service.description || '';
          newData.unit_price = service.price;
        }
      }

      if (name === 'product_id' && value) {
        const product = products.find(p => p.id === Number(value));
        if (product) {
          newData.item_name = product.name;
          newData.item_description = product.description || '';
          newData.unit_price = product.price;
        }
      }

      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }

    if (formData.unit_price <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.discount_percent < 0 || formData.discount_percent > 100) {
      newErrors.discount_percent = 'Discount must be between 0 and 100';
    }

    if (formData.item_type === 'service' && !formData.service_id) {
      newErrors.service_id = 'Please select a service';
    }

    if (formData.item_type === 'product' && !formData.product_id) {
      newErrors.product_id = 'Please select a product';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving invoice item:', error);
      setErrors({ submit: 'Failed to save invoice item. Please try again.' });
    }
  };

  if (!isOpen) return null;

  const currentItems = formData.item_type === 'service' ? services : products;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Invoice Item
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
            <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 mb-1">
              Item Type *
            </label>
            <select
              id="item_type"
              name="item_type"
              value={formData.item_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading}
            >
              <option value="service">Service</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div>
            <label htmlFor={formData.item_type === 'service' ? 'service_id' : 'product_id'} className="block text-sm font-medium text-gray-700 mb-1">
              Select {formData.item_type === 'service' ? 'Service' : 'Product'} *
            </label>
            <select
              id={formData.item_type === 'service' ? 'service_id' : 'product_id'}
              name={formData.item_type === 'service' ? 'service_id' : 'product_id'}
              value={formData.item_type === 'service' ? formData.service_id || '' : formData.product_id || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.service_id || errors.product_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select {formData.item_type}</option>
              {currentItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - ${Number(item.price).toFixed(2)}
                </option>
              ))}
            </select>
            {(errors.service_id || errors.product_id) && (
              <p className="text-red-500 text-sm mt-1">{errors.service_id || errors.product_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="item_name" className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.item_name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              placeholder="Item name"
            />
            {errors.item_name && <p className="text-red-500 text-sm mt-1">{errors.item_name}</p>}
          </div>

          <div>
            <label htmlFor="item_description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="item_description"
              name="item_description"
              value={formData.item_description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.unit_price ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="0.00"
              />
              {errors.unit_price && <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="1"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
          </div>

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
              step="0.1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.discount_percent ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              placeholder="0"
            />
            {errors.discount_percent && <p className="text-red-500 text-sm mt-1">{errors.discount_percent}</p>}
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
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceItemModal; 