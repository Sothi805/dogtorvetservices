import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { 
  Users, 
  Heart, 
  Calendar, 
  FileText, 
  Stethoscope, 
  Package,
  Shield,
  Syringe,
  PawPrint,
  UserCheck,
  ClipboardList,
  ArrowRight,
  Database,
  Network
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fields: string[];
}

interface Relationship {
  from: string;
  to: string;
  type: 'one-to-many' | 'many-to-many' | 'one-to-one';
  description: string;
}

const EntityRelationships: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    document.title = "Entity Relationships - :Dogtor VET Services";
  }, []);

  const entities: Entity[] = [
    {
      id: 'users',
      name: 'Users',
      icon: <UserCheck className="h-6 w-6" />,
      color: 'bg-green-500',
      description: 'Staff members, veterinarians, and administrators',
      fields: ['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'clients',
      name: 'Clients',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: 'Pet owners and their contact information',
      fields: ['id', 'name', 'gender', 'phone_number', 'other_contact_info', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'pets',
      name: 'Pets',
      icon: <Heart className="h-6 w-6" />,
      color: 'bg-pink-500',
      description: 'Pet profiles, medical history, and records',
      fields: ['id', 'name', 'gender', 'dob', 'species_id', 'breed_id', 'weight', 'color', 'medical_history', 'client_id', 'status']
    },
    {
      id: 'species',
      name: 'Species',
      icon: <PawPrint className="h-6 w-6" />,
      color: 'bg-cyan-500',
      description: 'Animal species classification (Dog, Cat, etc.)',
      fields: ['id', 'name', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'breeds',
      name: 'Breeds',
      icon: <ClipboardList className="h-6 w-6" />,
      color: 'bg-lime-500',
      description: 'Pet breed information by species',
      fields: ['id', 'name', 'species_id', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'allergies',
      name: 'Allergies',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-red-500',
      description: 'Track pet allergies and sensitivities',
      fields: ['id', 'name', 'description', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'vaccinations',
      name: 'Vaccinations',
      icon: <Syringe className="h-6 w-6" />,
      color: 'bg-purple-500',
      description: 'Vaccination records and schedules',
      fields: ['id', 'name', 'description', 'duration_months', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'appointments',
      name: 'Appointments',
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-orange-500',
      description: 'Schedule and manage veterinary appointments',
      fields: ['id', 'client_id', 'pet_id', 'service_id', 'user_id', 'appointment_date', 'duration_minutes', 'appointment_status', 'notes', 'status']
    },
    {
      id: 'services',
      name: 'Services',
      icon: <Stethoscope className="h-6 w-6" />,
      color: 'bg-teal-500',
      description: 'Veterinary services and procedures',
      fields: ['id', 'name', 'description', 'price', 'duration_minutes', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'products',
      name: 'Products',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-indigo-500',
      description: 'Medications, supplies, and retail products',
      fields: ['id', 'name', 'description', 'price', 'stock_quantity', 'sku', 'status', 'created_at', 'updated_at']
    },
    {
      id: 'invoices',
      name: 'Invoices',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-yellow-500',
      description: 'Billing and payment management',
      fields: ['id', 'invoice_number', 'client_id', 'pet_id', 'invoice_date', 'due_date', 'subtotal', 'discount_percent', 'total', 'payment_status', 'notes', 'status']
    },
    {
      id: 'invoice_items',
      name: 'Invoice Items',
      icon: <ClipboardList className="h-6 w-6" />,
      color: 'bg-gray-500',
      description: 'Individual items on invoices (services/products)',
      fields: ['id', 'invoice_id', 'item_type', 'service_id', 'product_id', 'item_name', 'item_description', 'unit_price', 'quantity', 'discount_percent', 'net_price']
    }
  ];

  const relationships: Relationship[] = [
    { from: 'clients', to: 'pets', type: 'one-to-many', description: 'A client can have multiple pets' },
    { from: 'clients', to: 'invoices', type: 'one-to-many', description: 'A client can have multiple invoices' },
    { from: 'clients', to: 'appointments', type: 'one-to-many', description: 'A client can have multiple appointments' },
    { from: 'pets', to: 'appointments', type: 'one-to-many', description: 'A pet can have multiple appointments' },
    { from: 'pets', to: 'invoices', type: 'one-to-many', description: 'A pet can be associated with multiple invoices' },
    { from: 'species', to: 'breeds', type: 'one-to-many', description: 'A species can have multiple breeds' },
    { from: 'breeds', to: 'pets', type: 'one-to-many', description: 'A breed can be assigned to multiple pets' },
    { from: 'species', to: 'pets', type: 'one-to-many', description: 'A species can be assigned to multiple pets' },
    { from: 'pets', to: 'allergies', type: 'many-to-many', description: 'A pet can have multiple allergies, and an allergy can affect multiple pets' },
    { from: 'pets', to: 'vaccinations', type: 'many-to-many', description: 'A pet can receive multiple vaccinations, and a vaccination can be given to multiple pets' },
    { from: 'users', to: 'appointments', type: 'one-to-many', description: 'A user (vet) can be assigned to multiple appointments' },
    { from: 'services', to: 'appointments', type: 'one-to-many', description: 'A service can be used in multiple appointments' },
    { from: 'services', to: 'invoice_items', type: 'one-to-many', description: 'A service can appear in multiple invoice items' },
    { from: 'products', to: 'invoice_items', type: 'one-to-many', description: 'A product can appear in multiple invoice items' },
    { from: 'invoices', to: 'invoice_items', type: 'one-to-many', description: 'An invoice can have multiple invoice items' }
  ];

  const getEntityById = (id: string) => entities.find(e => e.id === id);

  const getRelationshipsForEntity = (entityId: string) => {
    return relationships.filter(r => r.from === entityId || r.to === entityId);
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'one-to-many':
        return '1:N';
      case 'many-to-many':
        return 'N:N';
      case 'one-to-one':
        return '1:1';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Entity Relationships</h1>
          </div>
          <p className="text-gray-600">
            Visualize the data structure and relationships in the DogTorVet system
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={showDetails ? "default" : "outline"}
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2 bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              >
                <Network className="h-4 w-4" />
                <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              </Button>
              {selectedEntity && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedEntity(null)}
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Click on an entity to highlight its relationships
            </div>
          </div>
        </div>

        {/* Entity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {entities.map((entity) => {
            const isSelected = selectedEntity === entity.id;
            const hasRelationship = selectedEntity && 
              getRelationshipsForEntity(selectedEntity).some(r => 
                r.from === entity.id || r.to === entity.id
              );
            
            return (
              <div
                key={entity.id}
                className={`
                  bg-white p-4 rounded-lg shadow cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                  ${selectedEntity && !isSelected && !hasRelationship ? 'opacity-50' : ''}
                  ${hasRelationship && !isSelected ? 'ring-1 ring-gray-300' : ''}
                  hover:shadow-lg hover:scale-105
                `}
                onClick={() => setSelectedEntity(isSelected ? null : entity.id)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${entity.color} text-white`}>
                    {entity.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800">{entity.name}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">{entity.description}</p>
                
                {showDetails && (
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Fields:</h4>
                    <div className="flex flex-wrap gap-1">
                      {entity.fields.slice(0, 5).map((field) => (
                        <span key={field} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {field}
                        </span>
                      ))}
                      {entity.fields.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{entity.fields.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Relationships Display */}
        {selectedEntity && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Relationships for {getEntityById(selectedEntity)?.name}
            </h2>
            <div className="space-y-4">
              {getRelationshipsForEntity(selectedEntity).map((relationship, index) => {
                const fromEntity = getEntityById(relationship.from);
                const toEntity = getEntityById(relationship.to);
                
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${fromEntity?.color} text-white`}>
                      {fromEntity?.icon}
                    </div>
                    <span className="font-medium">{fromEntity?.name}</span>
                    
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {getRelationshipIcon(relationship.type)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div className={`p-2 rounded-lg ${toEntity?.color} text-white`}>
                      {toEntity?.icon}
                    </div>
                    <span className="font-medium">{toEntity?.name}</span>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{relationship.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Relationship Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">1:N</span>
              <span>One-to-Many: One record relates to multiple records</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">N:N</span>
              <span>Many-to-Many: Multiple records relate to multiple records</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">1:1</span>
              <span>One-to-One: One record relates to exactly one record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityRelationships; 