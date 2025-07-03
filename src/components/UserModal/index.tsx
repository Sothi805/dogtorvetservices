import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faUserMd, faUserTie, faUserCog, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { User, CreateUserRequest, UpdateUserRequest } from '../../api/users';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  user?: User | null;
  isLoading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'vet',
    phone: '',
    specialization: '',
    status: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't populate password when editing
        role: user.role,
        phone: user.phone || '',
        specialization: user.specialization || '',
        status: user.status,
      });
    } else {
      // Generate a random password for new users
      const randomPassword = generatePassword();
      setFormData({
        name: '',
        email: '',
        password: randomPassword,
        role: 'vet',
        phone: '',
        specialization: '',
        status: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required for new users';
    }

    if (!user && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
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
      // For editing, remove password if it's empty
      const submitData = user && !formData.password.trim() 
        ? { ...formData, password: undefined } as UpdateUserRequest
        : formData;
      
      await onSave(submitData);
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: 'Failed to save staff member. Please try again.' });
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full system access and management';
      case 'vet':
        return 'Veterinarian - can be assigned to appointments';
      case 'assistant':
        return 'Assistant - support staff for appointments';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {user ? 'Edit Staff Member' : 'Add New Staff Member'}
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
              Full Name *
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
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-2 md:px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
              disabled={isLoading}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] appearance-none"
                disabled={isLoading}
              >
                <option value="vet">Veterinarian</option>
                <option value="assistant">Assistant</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="absolute inset-y-0 right-2 md:right-3 flex items-center pointer-events-none">
                {getRoleIcon(formData.role)}
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">{getRoleDescription(formData.role)}</p>
          </div>

          {formData.role === 'vet' && (
            <div>
              <label htmlFor="specialization" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c]"
                disabled={isLoading}
                placeholder="e.g., Small Animals, Surgery, Dermatology"
              />
            </div>
          )}

          {!user && (
            <div>
              <label htmlFor="password" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Password * {!user && <span className="text-xs text-gray-500">(Auto-generated)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-2 md:px-3 py-2 pr-8 md:pr-10 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                  placeholder="Password will be auto-generated"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 md:right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs md:text-sm" />
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.password}</p>}
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Note: Staff accounts are for reference only
                </p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                  className="text-xs text-[#007c7c] hover:text-[#005f5f]"
                >
                  Generate New
                </button>
              </div>
            </div>
          )}

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
              Active (can be assigned to appointments)
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
                  <span>{user ? 'Update' : 'Add'} Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal; 