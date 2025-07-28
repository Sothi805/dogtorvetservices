import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../api/products';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  product?: Product | null;
  isLoading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    sku: '',
    status: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: Number(product.price),
        stock_quantity: product.stock_quantity,
        sku: product.sku || '',
        status: product.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        sku: '',
        status: true,
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Always send all fields for update
    const payload = { ...formData };
    // Convert empty SKU to undefined/null for backend compatibility
    if (!payload.sku || payload.sku.trim() === "") {
      payload.sku = undefined;
    }

    try {
      await onSave(payload);
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Failed to save product. Please try again.';
      if (error.response?.data?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        if (typeof validationErrors === 'object') {
          errorMessage = Object.entries(validationErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(validationErrors);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
      </div>
      {/* Modal container */}
      <div className="relative w-full max-w-md max-h-[90vh]">
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              aria-label="Close"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
            </button>
          </div>
          {/* Form */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-8">
              {errors.submit && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faXmark} className="h-4 w-4 text-red-200" />
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-100 font-medium">
                        {errors.submit}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border ${errors.name ? 'border-red-400' : 'border-white/40'} rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm`}
                  autoComplete="off"
                  disabled={isLoading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-800 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Enter SKU (optional)"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-800 mb-2">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border ${errors.price ? 'border-red-400' : 'border-white/40'} rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm`}
                    disabled={isLoading}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-800 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock_quantity"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border ${errors.stock_quantity ? 'border-red-400' : 'border-white/40'} rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm`}
                    disabled={isLoading}
                  />
                  {errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{errors.stock_quantity}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-800 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter product description (optional)"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-800 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status ? "active" : "inactive"}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === "active" }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
                  disabled={isLoading}
                >
                  <option value="active" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Active</option>
                  <option value="inactive" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Inactive</option>
                </select>
              </div>
              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/40 hover:bg-white/60 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    product ? "Update Product" : "Create Product"
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

export default ProductModal; 