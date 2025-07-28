import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileInvoiceDollar, faXmark, faShoppingCart, faDollarSign, faHashtag, faPercent } from '@fortawesome/free-solid-svg-icons';
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
    net_price: 0,
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
        net_price: 0,
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
          newData.net_price = service.price * newData.quantity * (1 - (newData.discount_percent || 0) / 100);
        }
      }

      if (name === 'product_id' && value) {
        const product = products.find(p => p.id === Number(value));
        if (product) {
          newData.item_name = product.name;
          newData.item_description = product.description || '';
          newData.unit_price = product.price;
          newData.net_price = product.price * newData.quantity * (1 - (newData.discount_percent || 0) / 100);
        }
      }

      // Update net_price when unit_price, quantity, or discount_percent changes
      if (name === 'unit_price' || name === 'quantity' || name === 'discount_percent') {
        const unitPrice = name === 'unit_price' ? Number(value) : newData.unit_price;
        const quantity = name === 'quantity' ? Number(value) : newData.quantity;
        const discountPercent = name === 'discount_percent' ? Number(value) : (newData.discount_percent || 0);
        newData.net_price = unitPrice * quantity * (1 - discountPercent / 100);
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

    // Item name and unit price are auto-populated, so we don't validate them manually
    // They will be set automatically when a service/product is selected

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.discount_percent !== undefined && (formData.discount_percent < 0 || formData.discount_percent > 100)) {
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
      <div className="relative w-full max-w-2xl max-h-[90vh]">
        {/* Transparent glass effect with drop shadow */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-[#007c7c]" />
              Add Invoice Item
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.submit && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-100 font-medium">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Item Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2 text-[#007c7c]" />
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    disabled={isLoading}
                  >
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                  </select>
                </div>

                {/* Service/Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-[#007c7c]" />
                    Select {formData.item_type === 'service' ? 'Service' : 'Product'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name={formData.item_type === 'service' ? 'service_id' : 'product_id'}
                    value={formData.item_type === 'service' ? formData.service_id || '' : formData.product_id || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                      errors.service_id || errors.product_id ? 'border-red-300/50' : 'border-white/40'
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

                {/* Item Name - Auto-populated and read-only */}
                {formData.item_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2 text-[#007c7c]" />
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      className="w-full px-4 py-3 bg-gray-100/50 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                      disabled={true}
                      placeholder="Auto-populated from selection"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populated from selected {formData.item_type}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2 text-[#007c7c]" />
                    Description
                  </label>
                  <textarea
                    name="item_description"
                    value={formData.item_description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    disabled={isLoading}
                    placeholder="Optional description"
                  />
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Unit Price - Auto-populated and read-only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-[#007c7c]" />
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      className="w-full px-4 py-3 bg-gray-100/50 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                      disabled={true}
                      placeholder="Auto-populated from selection"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populated from selected {formData.item_type}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      <FontAwesomeIcon icon={faHashtag} className="mr-2 text-[#007c7c]" />
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                        errors.quantity ? 'border-red-300/50' : 'border-white/40'
                      }`}
                      disabled={isLoading}
                      placeholder="1"
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    <FontAwesomeIcon icon={faPercent} className="mr-2 text-[#007c7c]" />
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount_percent"
                    value={formData.discount_percent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                      errors.discount_percent ? 'border-red-300/50' : 'border-white/40'
                    }`}
                    disabled={isLoading}
                    placeholder="0"
                  />
                  {errors.discount_percent && <p className="text-red-500 text-sm mt-1">{errors.discount_percent}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/40 transition-all duration-200 font-medium"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemModal;