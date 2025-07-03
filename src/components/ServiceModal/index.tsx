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
    duration_minutes: 30,
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
        duration_minutes: service.duration_minutes,
        service_type: service.service_type,
        status: service.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 30,
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

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be greater than 0';
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
      console.error('Error saving service:', error);
      setErrors({ submit: 'Failed to save service. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm md:text-base" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
              {errors.submit}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-2 md:px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              placeholder="Enter service name"
            />
            {errors.name && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="service_type" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <select
              id="service_type"
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading}
            >
              <option value="consultation">Consultation</option>
              <option value="vaccination">Vaccination</option>
              <option value="surgery">Surgery</option>
              <option value="grooming">Grooming</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label htmlFor="price" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-2 md:px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="duration_minutes" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
                className={`w-full px-2 md:px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                  errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="30"
              />
              {errors.duration_minutes && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.duration_minutes}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
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
              className="h-3 w-3 md:h-4 md:w-4 text-[#007c7c] focus:ring-[#007c7c] border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="status" className="ml-2 block text-xs md:text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-2 md:space-x-3 pt-3 md:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 md:px-4 py-2 text-xs md:text-sm bg-[#007c7c] text-white rounded-md hover:bg-[#005f5f] transition-colors flex items-center space-x-1 md:space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="text-xs md:text-sm" />
                  <span>{service ? 'Update' : 'Create'} Service</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal; 