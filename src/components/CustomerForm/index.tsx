import React, { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { clientsApi, Client } from "../../api/clients"

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {customer?.id ? "Edit Customer" : "Create New Customer"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm md:text-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="responsive-select w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="other_contact_info" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Other Contact Info <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="other_contact_info"
              value={formData.other_contact_info}
              onChange={(e) => handleInputChange("other_contact_info", e.target.value)}
              placeholder="Enter email or other contact info (optional)"
              className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status ? "active" : "inactive"}
              onChange={(e) => handleInputChange("status", e.target.value === "active")}
              className="responsive-select w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007c7c] focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 md:space-x-3 pt-3 md:pt-4 border-t mt-4 md:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#007c7c] hover:bg-[#006060] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : customer?.id ? "Update Customer" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 