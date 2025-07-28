import React, { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark, faSearch, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { clientsApi, Client } from "../../api/clients"
import "./index.less"

interface CustomerFormProps {
  isOpen: boolean
  onClose: () => void
  customer?: Client | null
  onSuccess: () => void
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    gender: undefined,
    phone_number: "",
    other_contact_info: "",
    status: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        gender: customer.gender || undefined,
        phone_number: customer.phone_number || "",
        other_contact_info: customer.other_contact_info || "",
        status: customer.status ?? true,
      })
    } else {
      setFormData({
        name: "",
        gender: undefined,
        phone_number: "",
        other_contact_info: "",
        status: true,
      })
    }
    setError(null)
  }, [customer, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Prepare data - remove other_contact_info if it's empty and convert gender to lowercase
    const submitData = {
      ...formData,
      gender: formData.gender?.toLowerCase() as 'male' | 'female' | 'other',
      other_contact_info: formData.other_contact_info?.trim() || undefined
    }

    try {
      if (customer?.id) {
        // Update existing customer
        await clientsApi.updateClient(customer.id, submitData)
      } else {
        // Create new customer
        await clientsApi.createClient(submitData as Omit<Client, 'id' | 'created_at' | 'updated_at'>)
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving customer:", error)
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors
        if (typeof validationErrors === 'object') {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join(', ')
          setError(errorMessages || "Validation failed")
        } else {
          setError(JSON.stringify(validationErrors) || "Validation failed")
        }
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else if (error.message) {
        setError(error.message)
      } else {
        setError("Failed to save customer. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Client, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

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
        {/* Transparent glass effect with drop shadow for visibility */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40">
          {/* Header with subtle glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10">
            <h2 className="text-xl font-semibold text-gray-900">
              {customer?.id ? "Edit Customer" : "Create New Customer"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg text-gray-700" />
            </button>
          </div>

          {/* Form with transparent glass styling */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-8">
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-red-100 font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-800 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
                  required
                >
                  <option value="" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Select gender</option>
                  <option value="male" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Male</option>
                  <option value="female" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Female</option>
                  <option value="other" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-800 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="other_contact_info" className="block text-sm font-medium text-gray-800 mb-2">
                  Email/Other Contact <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  id="other_contact_info"
                  value={formData.other_contact_info}
                  onChange={(e) => handleInputChange("other_contact_info", e.target.value)}
                  placeholder="Enter email or other contact info (optional)"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-800 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status ? "active" : "inactive"}
                  onChange={(e) => handleInputChange("status", e.target.value === "active")}
                  className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007c7c]/50 focus:border-[#007c7c]/50 transition-all text-sm appearance-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
                >
                  <option value="active" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Active</option>
                  <option value="inactive" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1f2937' }}>Inactive</option>
                </select>
              </div>

              {/* Footer with subtle glass effect */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/40 hover:bg-white/60 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#007c7c] hover:bg-[#005f5f] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    customer?.id ? "Update Customer" : "Create Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 