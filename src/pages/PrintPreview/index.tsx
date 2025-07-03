import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPrint, 
  faEdit, 
  faPlus,
  faTrash,
  faFileInvoice,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../layouts/PageLayout';
import { invoicesApi, Invoice } from '../../api/invoices';
import { invoiceItemsApi, InvoiceItem, CreateInvoiceItemRequest, UpdateInvoiceItemRequest } from '../../api/invoice-items';
import { servicesApi, Service } from '../../api/services';
import { productsApi, Product } from '../../api/products';
import InvoiceItemModal from '../../components/InvoiceItemModal';
import logoNoBg from '../../assets/logo-no-bg.png';

// Define a type for the support data that the modal expects
type ModalSupportData = {
  id: number;
  name: string;
  price: number;
  description?: string;
};

const PrintPreview = () => {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // Support data for modal
  const [services, setServices] = useState<ModalSupportData[]>([]);
  const [products, setProducts] = useState<ModalSupportData[]>([]);

  const loadInvoiceData = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false);
      setError("No invoice ID provided.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [invoiceDetails, invoiceItems] = await Promise.all([
        invoicesApi.getInvoice(invoiceId),
        invoiceItemsApi.getInvoiceItemsByInvoice(invoiceId)
      ]);

      setInvoice(invoiceDetails);
      setItems(invoiceItems);

    } catch (err) {
      console.error('Error loading invoice data:', err);
      setError('Failed to load invoice details. It might not exist or there was a server error.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  const loadSupportData = async () => {
    try {
      const [servicesResponse, productsResponse] = await Promise.all([
        servicesApi.getServices({ per_page: 500 }),
        productsApi.getProducts({ per_page: 500 })
      ]);
      setServices(servicesResponse.data.map(s => ({ ...s, price: Number(s.price) })));
      setProducts(productsResponse.data.map(p => ({ ...p, price: Number(p.price) })));
    } catch (err) {
      console.error("Failed to load support data for modal:", err);
    }
  };

  useEffect(() => {
    loadInvoiceData();
    loadSupportData();
  }, [loadInvoiceData]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleSaveItem = async (itemData: CreateInvoiceItemRequest | UpdateInvoiceItemRequest) => {
    if (!invoiceId) return;
    
    if ('id' in itemData || !itemData.item_type || !itemData.item_name || itemData.unit_price === undefined || itemData.quantity === undefined) {
      console.warn("Update not implemented or invalid data for creation.");
      return;
    }

    try {
      setIsModalLoading(true);
      const createData: CreateInvoiceItemRequest = {
        invoice_id: invoiceId,
        item_type: itemData.item_type,
        item_name: itemData.item_name,
        unit_price: itemData.unit_price,
        quantity: itemData.quantity,
        service_id: itemData.service_id,
        product_id: itemData.product_id,
        item_description: itemData.item_description,
        discount_percent: itemData.discount_percent,
      };
      await invoiceItemsApi.createInvoiceItem(createData);
      await loadInvoiceData(); 
      setIsItemModalOpen(false);
    } catch (err) {
      console.error("Failed to add item:", err);
      alert("Error: Could not add the item to the invoice.");
    } finally {
      setIsModalLoading(false);
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the invoice?')) {
      return;
    }

    try {
      await invoiceItemsApi.deleteInvoiceItem(itemId);
      await loadInvoiceData();
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Error: Could not remove the item.");
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };
  
  if (loading) {
    return (
      <Layout title="Loading Invoice...">
        <div className="text-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-6xl mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-600">Loading Invoice Details...</h3>
        </div>
      </Layout>
    );
  }
  
  if (error) {
     return (
      <Layout title="Error">
        <div className="text-center py-16 bg-red-50 rounded-lg">
          <FontAwesomeIcon icon={faFileInvoice} className="text-red-300 text-6xl mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Could not load Invoice</h3>
          <p className="text-red-600">{error}</p>
           <button
            onClick={() => navigate('/invoices')}
            className="mt-6 bg-[#007c7c] hover:bg-[#005f5f] text-white px-5 py-2.5 rounded-lg text-sm"
          >
            Back to Invoices List
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Invoice #${invoice?.invoice_number || ''}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @font-face {
            font-family: 'Caveat';
            src: url('/src/assets/fonts/Caveat-Regular.ttf') format('truetype');
          }
          @font-face {
            font-family: 'KhmerOS';
            src: url('/src/assets/fonts/Kh Ang TaPenh.ttf') format('truetype');
          }
          @media print {
            @page { size: A5; margin: 8mm; }
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
            .no-print { display: none !important; }
          }
          .caveat-font { font-family: 'Caveat', cursive; }
          .khmer-font { font-family: 'KhmerOS', sans-serif; }
        `
      }} />
      
      <div className="flex gap-6 h-full">
        {/* Left Sidebar - Actions */}
        <div className="w-1/3 max-w-sm bg-white rounded-lg shadow-lg p-6 no-print self-start">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Actions</h2>
            <p className="text-sm text-gray-500">Manage this invoice and its items.</p>
          </div>
          
          <div className="space-y-3">
             <button
              onClick={() => setIsItemModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base font-semibold"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Product/Service</span>
            </button>
            <button
              onClick={handlePrint}
              className="w-full bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
            >
              <FontAwesomeIcon icon={faPrint} />
              <span>Print Invoice</span>
            </button>
             <button
              onClick={() => navigate(`/invoices`)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Back to Invoice List</span>
            </button>
          </div>
        </div>

        {/* Right Side - Invoice Preview */}
        <div className="flex-1 bg-gray-50 rounded-lg p-8 flex items-center justify-center">
          {invoice ? (
            <div className="print-area bg-white shadow-2xl" style={{ width: '148mm', minHeight: '210mm' }}>
              {/* A5 Invoice Content */}
              <div className="relative border-2 border-gray-800 h-full" style={{ padding: '10mm' }}>
                
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  {/* Left side */}
                  <div className="flex items-center space-x-4">
                    <img src={logoNoBg} alt="Dogtor VET Logo" className="w-16 h-16 object-contain" />
                    <div>
                      <div className="text-lg font-bold khmer-font">
                        <span className="text-black">គេហៈវេជ្ជ </span>
                        <span className="text-teal-600">ខកេវ</span>
                      </div>
                      <div className="text-teal-600 text-sm italic caveat-font font-medium">Dogtor VET services</div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right">
                    <div className="text-red-500 font-bold text-sm mb-2 leading-relaxed caveat-font">
                      <div>016 92 62 32</div>
                      <div>061 92 62 32</div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="khmer-font">កាលបរិច្ឆេទ / <span className="caveat-font">Date: {formatDate(invoice.invoice_date)}</span></div>
                      <div className="khmer-font">ឈ្មោះចូន្ជី / <span className="caveat-font">Pet Name: {invoice.pet?.name || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Receipt Header */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold khmer-font"><span className="text-blue-600">វិកយបត្រ</span></div>
                  <div className="text-lg text-blue-600 italic caveat-font font-medium">Receipt</div>
                </div>

                <div className="mb-6 flex justify-between items-center">
                  {/* Invoice Number */}
                  <div className="inline-block border-2 border-red-500 px-3 py-2 rounded">
                    <span className="text-red-500 font-bold caveat-font">No: </span>
                    <span className="font-bold text-gray-800 caveat-font">{invoice.invoice_number}</span>
                  </div>
                  {/* Payment Status */}
                  <div className={`px-3 py-1.5 text-sm font-bold rounded-full ${
                      invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.payment_status?.toUpperCase()}
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-blue-600 khmer-font">អតិថិជន / </span>
                      <span className="font-semibold text-blue-600 caveat-font">Client:</span>
                      <div className="font-medium text-gray-800 caveat-font">{invoice.client?.name}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 khmer-font">សត្វ / </span>
                      <span className="font-semibold text-blue-600 caveat-font">Pet:</span>
                      <div className="font-medium text-gray-800 caveat-font">{invoice.pet?.name || 'General'}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <table className="w-full border-collapse border-2 border-blue-600">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border-2 border-blue-600 px-3 py-2 text-sm text-center w-12"><div className="text-red-500 font-bold khmer-font">លរ:</div><div className="text-black font-semibold caveat-font">N°</div></th>
                        <th className="border-2 border-blue-600 px-3 py-2 text-sm text-center"><div className="text-red-500 font-bold khmer-font">សេវាកម្ម/ផលិតផល</div><div className="text-black font-semibold caveat-font">Items</div></th>
                        <th className="border-2 border-blue-600 px-3 py-2 text-sm text-center w-20"><div className="text-red-500 font-bold khmer-font">ចំនួន</div><div className="text-black font-semibold caveat-font">Qty</div></th>
                        <th className="border-2 border-blue-600 px-3 py-2 text-sm text-center w-24"><div className="text-red-500 font-bold khmer-font">តម្លៃឯកតា</div><div className="text-black font-semibold caveat-font">Unit Price</div></th>
                        <th className="border-2 border-blue-600 px-3 py-2 text-sm text-center w-24"><div className="text-red-500 font-bold khmer-font">តម្លៃសរុប</div><div className="text-black font-semibold caveat-font">Total</div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="border-2 border-blue-600 px-2 py-2 text-center text-sm font-medium caveat-font align-top">{index + 1}</td>
                          <td className="border-2 border-blue-600 px-2 py-2 text-sm align-top">
                            <div className="font-medium caveat-font flex justify-between items-start">
                              <span>{item.item_name}</span>
                               <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-500 hover:text-red-700 no-print ml-2 opacity-50 hover:opacity-100"
                                title="Delete Item"
                              >
                                <FontAwesomeIcon icon={faTrash} size="xs" />
                              </button>
                            </div>
                            {item.item_description && (
                              <div className="text-xs text-gray-600 mt-1 caveat-font">{item.item_description}</div>
                            )}
                          </td>
                          <td className="border-2 border-blue-600 px-2 py-2 text-center text-sm font-medium caveat-font align-top">{item.quantity}</td>
                          <td className="border-2 border-blue-600 px-2 py-2 text-center text-sm font-medium caveat-font align-top">{formatCurrency(item.unit_price)}</td>
                          <td className="border-2 border-blue-600 px-2 py-2 text-center text-sm font-bold caveat-font align-top">{formatCurrency(item.net_price)}</td>
                        </tr>
                      ))}
                      
                      {/* Fill remaining rows */}
                      {Array.from({ length: Math.max(0, 8 - items.length) }, (_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="border-2 border-blue-600 px-2 py-3 text-center text-sm caveat-font">{items.length + i + 1}</td>
                          <td className="border-2 border-blue-600 px-2 py-3"></td>
                          <td className="border-2 border-blue-600 px-2 py-3"></td>
                          <td className="border-2 border-blue-600 px-2 py-3"></td>
                          <td className="border-2 border-blue-600 px-2 py-3"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-1/2"></td>
                        <td className="border-2 border-blue-600 px-4 py-2 bg-blue-50"><span className="text-blue-600 font-bold khmer-font">សរុប / </span><span className="text-blue-600 font-bold caveat-font">Grand total</span></td>
                        <td className="border-2 border-blue-600 px-4 py-2 text-center font-bold w-32 caveat-font">{formatCurrency(invoice.total)}</td>
                      </tr>
                      {/* Other total rows can be added here if needed, e.g., deposit, balance */}
                    </tbody>
                  </table>
                </div>

                {/* Footer and Thank you message */}
                 <div className="absolute bottom-4 left-4 right-4 text-center mt-8 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700 khmer-font">
                    សូមអរគុណសម្រាប់ការជឿជាក់សេវាកម្មរបស់យើង ជួបគ្នាពេលក្រោយ! 😊
                  </div>
                  <div className="text-sm text-gray-700 italic mt-1 caveat-font">
                    Thanks for your trust in our services, see you next time! 😊
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-16">
              <FontAwesomeIcon icon={faFileInvoice} className="text-gray-300 text-6xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Invoice Not Found</h3>
              <p className="text-gray-500">The requested invoice could not be found.</p>
            </div>
          )}
        </div>
      </div>
      
      {invoiceId && (
        <InvoiceItemModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          invoiceId={invoiceId}
          isLoading={isModalLoading}
          services={services}
          products={products}
        />
      )}
    </Layout>
  );
};

export default PrintPreview; 