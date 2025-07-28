import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faUserMd, faUserTie, faUserCog, faEye, faEyeSlash, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { User, CreateUserRequest, UpdateUserRequest } from '../../api/users';
import './index.less';

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
    first_name: '',
    last_name: '',
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
        first_name: user.first_name || '',
        last_name: user.last_name || '',
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
        first_name: '',
        last_name: '',
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

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
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
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Failed to save staff member. Please try again.';
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
              <FontAwesomeIcon icon={user ? faEdit : faUserMd} className="mr-3 text-[#007c7c]" />
              {user ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Content with transparent glass styling */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.submit && (
                <div className="bg-red-50/50 backdrop-blur-sm p-4 rounded-xl border border-red-200/30">
                  <div className="text-red-700 text-sm">{errors.submit}</div>
                </div>
              )}

              {/* Basic Information Section */}
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FontAwesomeIcon icon={faUserMd} className="mr-3 text-[#007c7c]" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                        errors.first_name ? 'border-red-300' : ''
                      }`}
                      disabled={isLoading}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && <p className="text-red-500 text-sm mt-2">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                        errors.last_name ? 'border-red-300' : ''
                      }`}
                      disabled={isLoading}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && <p className="text-red-500 text-sm mt-2">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                    disabled={isLoading}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                </div>

                <div className="mt-6">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                    disabled={isLoading}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Role & Specialization Section */}
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FontAwesomeIcon icon={faUserCog} className="mr-3 text-[#007c7c]" />
                  Role & Specialization
                </h3>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                      disabled={isLoading}
                    >
                      <option value="vet">Veterinarian</option>
                      <option value="assistant">Assistant</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      {getRoleIcon(formData.role)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{getRoleDescription(formData.role)}</p>
                </div>

                {formData.role === 'vet' && (
                  <div className="mt-6">
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                      disabled={isLoading}
                      placeholder="e.g., Small Animals, Surgery, Dermatology"
                    />
                  </div>
                )}
              </div>

              {/* Password Section (for new users only) */}
              {!user && (
                <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faEye} className="mr-3 text-[#007c7c]" />
                    Password Settings
                  </h3>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password * <span className="text-xs text-gray-500">(Auto-generated)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 pr-12 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm ${
                          errors.password ? 'border-red-300' : ''
                        }`}
                        disabled={isLoading}
                        placeholder="Password will be auto-generated"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password}</p>}
                    
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-gray-500">
                        Note: Staff accounts are for reference only
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                        className="text-xs text-[#007c7c] hover:text-[#005f5f] font-medium"
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="mr-3 text-[#007c7c]" />
                  Account Status
                </h3>
                
                <div className="flex items-center p-4 bg-white/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="status"
                    name="status"
                    checked={formData.status}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#007c7c] focus:ring-[#007c7c] border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="status" className="ml-3 block text-sm text-gray-700">
                    Active (can be assigned to appointments)
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-white/20 bg-white/10">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                className="px-6 py-2 bg-[#007c7c] text-white rounded-xl hover:bg-[#005f5f] transition-colors duration-200 font-medium flex items-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="text-sm" />
                    <span>{user ? 'Update' : 'Add'} Staff Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal; 