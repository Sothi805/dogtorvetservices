import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '../../api/services';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: CreateServiceRequest | UpdateServiceRequest) => Promise<void>;
  service?: Service | null;
  isLoading: boolean;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  service,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    service_type: 'consultation',
    status: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        price: typeof service.price === 'string' ? Number(service.price) : service.price,
        duration: service.duration,
        service_type: service.service_type,
        status: service.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        service_type: 'consultation',
        status: true,
      });
    }
    setErrors({});
  }, [service, isOpen]);

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
      newErrors.name = 'Service name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
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
    } catch (error: any) {
      console.error('Error saving service:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Failed to save service. Please try again.';
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
      {/* Apple-like liquid glass background with main color mixed with darker shades */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#007c7c]/30 via-[#005f5f]/20 to-[#004d4d]/25 backdrop-blur-2xl transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Minimal floating elements - just 2 subtle ones */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="floating-element-reverse absolute bottom-20 right-10 w-8 h-8 bg-white/8 rounded-full"></div>
      </div>
      {/* Modal container with Apple-like transparent glass effect */}
      <div className="relative w-full max-w-md max-h-[90vh]">
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900">
              {service ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
            </button>
          </div>
          {/* Form with transparent glass styling */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-8">
              {errors.submit && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
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
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${errors.name ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter service name"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="service_type" className="block text-sm font-medium text-gray-800 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="service_type"
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
                  disabled={isLoading}
                  required
                >
                  <option value="consultation">Consultation</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="surgery">Surgery</option>
                  <option value="grooming">Grooming</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
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
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${errors.price ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    placeholder="0.00"
                    required
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-800 mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${errors.duration ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    placeholder="30"
                    required
                  />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
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
                  className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  disabled={isLoading}
                  placeholder="Enter service description (optional)"
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
              {/* Footer with subtle glass effect */}
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
                  className="px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg flex items-center space-x-2"
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
                    <>
                      <FontAwesomeIcon icon={faSave} className="text-xs md:text-sm" />
                      <span>{service ? 'Update Service' : 'Create Service'}</span>
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

export default ServiceModal; 