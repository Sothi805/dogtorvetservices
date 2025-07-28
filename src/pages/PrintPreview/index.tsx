import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
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
import { servicesApi } from '../../api/services';
import { productsApi } from '../../api/products';
import InvoiceItemModal from '../../components/InvoiceItemModal';
import logoNoBg from '../../assets/logo-no-bg.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
//import invoiceSvgUrl from '../../assets/invoice.svg';

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
  const [deposit, setDeposit] = useState<number>(0);

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // Support data for modal
  const [services, setServices] = useState<ModalSupportData[]>([]);
  const [products, setProducts] = useState<ModalSupportData[]>([]);

  const loadInvoiceData = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false);
      setError("No invoice ID provided. Please select an invoice from the invoice list to view its print preview.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading invoice data for ID:', invoiceId);
      
      // Always include client and pet in the invoice response
      console.log('🔄 Fetching invoice details and items...');
      const [invoiceDetails, invoiceItems] = await Promise.all([
        invoicesApi.getInvoice(invoiceId, 'client,pet'),
        invoiceItemsApi.getInvoiceItemsByInvoice(invoiceId, 'service,product')
      ]);

      console.log('📄 Invoice details:', invoiceDetails);
      console.log('📦 Invoice items:', invoiceItems);
      console.log('📦 Invoice items count:', invoiceItems.length);
      console.log('📦 Invoice items type:', typeof invoiceItems);
      console.log('📦 Invoice items is array:', Array.isArray(invoiceItems));

      // Calculate totals from items
      const subtotal = invoiceItems.reduce((sum, item) => {
        const unitPrice = Number(item.service?.price || item.product?.price || 0);
        const quantity = Number(item.quantity || 0);
        const discountPercent = Number(item.discount_percent || 0);
        const itemTotal = unitPrice * quantity * (1 - discountPercent / 100);
        return sum + itemTotal;
      }, 0);
      const discountAmount = subtotal * (Number(invoiceDetails.discount_percent || 0) / 100);
      const total = subtotal - discountAmount;

      // Update invoice with calculated totals
      const updatedInvoice = {
        ...invoiceDetails,
        subtotal,
        total,
        discount_amount: discountAmount,
        deposit: Number(invoiceDetails.deposit || 0)
      };

      console.log('💰 Calculated totals:', { subtotal, discountAmount, total });

      setInvoice(updatedInvoice);
      setItems(invoiceItems);
      setDeposit(Number(invoiceDetails.deposit || 0));

    } catch (err) {
      console.error('❌ Error loading invoice data:', err);
      setError('Failed to load invoice details. The invoice might not exist or there was a server error.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  const loadSupportData = async () => {
    try {
      const [servicesResponse, productsResponse] = await Promise.all([
        servicesApi.getServices({ status: 'active', per_page: 500 }),
        productsApi.getProducts({ per_page: 500 })
      ]);
      
      // Handle services response
      const servicesData = servicesResponse;
      setServices(servicesData.map((s: any) => ({ 
        id: s.id, 
        name: s.name, 
        price: Number(s.price), 
        description: s.description 
      })));
      
      // Handle products response
      const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse as any).data || [];
      setProducts(productsData.map((p: any) => ({ 
        id: p.id, 
        name: p.name, 
        price: Number(p.price), 
        description: p.description 
      })));
    } catch (err) {
      console.error("Failed to load support data for modal:", err);
    }
  };

  useEffect(() => {
    loadInvoiceData();
    loadSupportData();
  }, [loadInvoiceData]);

  useEffect(() => {
    // Debug logs for invoice and items
    console.log('🧾 Invoice object:', invoice);
    console.log('🧾 Invoice items:', items);
  }, [invoice, items]);


  
  const handleSaveItem = async (itemData: CreateInvoiceItemRequest | UpdateInvoiceItemRequest): Promise<void> => {
    if (!invoiceId) return;
    
    try {
      setIsModalLoading(true);
      console.log('🔄 Starting to save invoice item...');
      console.log('📦 Item data to save:', itemData);
      console.log('🆔 Invoice ID:', invoiceId);
      
      if ('id' in itemData && itemData.id) {
        // Update existing item
        console.log('🔄 Updating existing item with ID:', itemData.id);
        await invoiceItemsApi.updateInvoiceItem(itemData.id.toString(), itemData);
        console.log('✅ Invoice item updated successfully');
      } else {
        // Create new item
        console.log('🔄 Creating new item...');
        const createData: CreateInvoiceItemRequest = {
          invoice_id: invoiceId,
          item_type: itemData.item_type!,
          item_name: itemData.item_name!,
          unit_price: itemData.unit_price!,
          quantity: itemData.quantity!,
          service_id: itemData.service_id ? String(itemData.service_id) : undefined,
          product_id: itemData.product_id ? String(itemData.product_id) : undefined,
          item_description: itemData.item_description,
          discount_percent: itemData.discount_percent || 0,
          net_price: itemData.unit_price! * itemData.quantity! * (1 - (itemData.discount_percent || 0) / 100),
        };
        console.log('📦 Create data prepared:', createData);
        const newItem = await invoiceItemsApi.createInvoiceItem(createData);
        console.log('✅ Invoice item created successfully:', newItem);
      }
      
      console.log('🔄 Refreshing invoice data...');
      // Refresh the invoice data to get updated calculations and service/product info
      await loadInvoiceData();
      console.log('✅ Invoice data refreshed successfully');
      
      // Close the modal
      setIsItemModalOpen(false);
      console.log('✅ Modal closed');
      
    } catch (err) {
      console.error('❌ Failed to save invoice item:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!invoiceId) return;
    
    // Find the item to show in confirmation
    const itemToDelete = items.find(item => item.id === itemId);
    const itemName = itemToDelete?.item_name || itemToDelete?.service?.name || itemToDelete?.product?.name || 'this item';
    
    if (!confirm(`Are you sure you want to delete "${itemName}" from this invoice?`)) {
      return;
    }
    
    try {
      await invoiceItemsApi.deleteInvoiceItem(itemId);
      console.log('✅ Invoice item deleted successfully');
      
      // Refresh the invoice data to get updated calculations
      await loadInvoiceData();
      
    } catch (err) {
      console.error('❌ Failed to delete invoice item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleEditQuantity = async (item: InvoiceItem) => {
    const newQuantity = prompt(`Enter new quantity for "${item.item_name}":`, item.quantity.toString());
    if (newQuantity === null || newQuantity === '') return;
    
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity (greater than 0)');
      return;
    }
    
    try {
      await invoiceItemsApi.updateInvoiceItem(item.id, {
        quantity: quantity
      });
      console.log('✅ Item quantity updated successfully');
      await loadInvoiceData();
    } catch (err) {
      console.error('❌ Failed to update item quantity:', err);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleEditDiscount = async (item: InvoiceItem) => {
    const newDiscount = prompt(`Enter new discount percentage for "${item.item_name}" (0-100):`, (item.discount_percent || 0).toString());
    if (newDiscount === null || newDiscount === '') return;
    
    const discount = parseFloat(newDiscount);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      alert('Please enter a valid discount percentage (0-100)');
      return;
    }
    
    try {
      await invoiceItemsApi.updateInvoiceItem(item.id, {
        discount_percent: discount
      });
      console.log('✅ Item discount updated successfully');
      await loadInvoiceData();
    } catch (err) {
      console.error('❌ Failed to update item discount:', err);
      alert('Failed to update discount. Please try again.');
    }
  };

  const handleDepositChange = async (newDeposit: number) => {
    if (!invoiceId) return;
    
    try {
      setDeposit(newDeposit);
      
      // Update the invoice in the database
      await invoicesApi.updateInvoice(invoiceId, { deposit: newDeposit });
      console.log('✅ Deposit updated successfully');
      
      // Update the local invoice state
      if (invoice) {
        setInvoice({
          ...invoice,
          deposit: newDeposit
        });
      }
      
    } catch (err) {
      console.error('❌ Failed to update deposit:', err);
      alert('Failed to update deposit. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('🔄 Starting PDF generation...');
      
      // Try html2canvas first
      try {
        // Get the print area element
        const printArea = document.querySelector('.print-area') as HTMLElement;
        if (!printArea) {
          console.error('❌ Print area not found');
          alert('Could not find invoice content to export');
          return;
        }

        // Use html2canvas to capture the print area
        const canvas = await html2canvas(printArea, {
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: printArea.offsetWidth,
          height: printArea.offsetHeight,
        });

        console.log('✅ Canvas generated, converting to PDF...');

        // Create PDF with A5 dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a5',
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions to fit A5
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        console.log('✅ PDF generated, saving...');
        pdf.save(`invoice-${invoice?.invoice_number || 'export'}.pdf`);
        
        console.log('✅ PDF saved successfully');
      } catch (html2canvasError) {
        console.warn('⚠️ html2canvas failed, falling back to print method:', html2canvasError);
        
        // Fallback: Use browser print to PDF
        const printArea = document.querySelector('.print-area') as HTMLElement;
        if (printArea) {
          // Create a new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            // Get all stylesheets from the current document
            const stylesheets = Array.from(document.styleSheets);
            let stylesText = '';
            
            stylesheets.forEach(sheet => {
              try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                rules.forEach(rule => {
                  stylesText += rule.cssText + '\n';
                });
              } catch (e) {
                console.warn('Could not access stylesheet:', e);
              }
            });
            
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Invoice - ${invoice?.invoice_number || 'Export'}</title>
                  <style>
                    ${stylesText}
                    
                    /* Override for print window */
                    body { 
                      margin: 0; 
                      padding: 0; 
                      background: white;
                    }
                    .print-area { 
                      width: 148mm; 
                      height: 210mm; 
                      margin: 0 auto;
                      background: white;
                      box-shadow: none;
                      transform: none !important;
                      scale: none !important;
                      padding: 4mm 4mm 6mm 4mm !important;
                    }
                    .print-area * {
                      transform: none !important;
                      scale: none !important;
                    }
                    /* Hide interactive elements in print window */
                    button, .no-print, .print\\:hidden {
                      display: none !important;
                    }
                    @media print {
                      body { margin: 0; }
                      .print-area { 
                        box-shadow: none;
                        transform: none !important;
                        scale: none !important;
                        padding: 4mm 4mm 6mm 4mm !important;
                      }
                      .print-area * {
                        transform: none !important;
                        scale: none !important;
                      }
                      /* Hide interactive elements */
                      button, .no-print, .print\\:hidden {
                        display: none !important;
                      }
                      /* Force colors to be preserved */
                      .border-blue-600 {
                        border-color: #2563eb !important;
                      }
                      .text-blue-600 {
                        color: #2563eb !important;
                      }
                      .text-teal-600 {
                        color: #0d9488 !important;
                      }
                      .text-red-500 {
                        color: #ef4444 !important;
                      }
                    }
                  </style>
                </head>
                <body>
                  ${printArea.outerHTML}
                </body>
              </html>
            `);
            printWindow.document.close();
            
            // Wait for content to load, then print
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 500); // Give time for styles to load
            };
          } else {
            alert('Please allow popups to download PDF');
          }
        } else {
          alert('Could not find invoice content to export');
        }
      }
    } catch (err) {
      console.error('❌ Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
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
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/invoices')}
              className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Invoices List
            </button>
            {!invoiceId && (
              <p className="text-sm text-gray-500 mt-2">
                Tip: Select an invoice from the list and click "Print Preview" to view it
              </p>
            )}
          </div>
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
          .print-area {
            transform: scale(0.85);
            transform-origin: top center;
            margin: 0 auto 2rem auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            background: #fff;
            border-radius: 12px;
            display: block;
          }
          @media print {
            .print-area {
              transform: scale(1) !important;
              box-shadow: none !important;
              margin: 0 !important;
              border-radius: 0 !important;
            }
            body, html {
              background: none !important;
            }
            /* Hide all interactive elements in print */
            button, .no-print, .print\\:hidden {
              display: none !important;
            }
            /* Preserve colors in print */
            .print-area {
              color: inherit !important;
            }
            .print-area * {
              color: inherit !important;
            }
            /* Force specific colors to be preserved */
            .text-blue-600, .text-teal-600, .text-red-500,
            .border-blue-600, .bg-blue-100, .bg-blue-50 {
              color: inherit !important;
              border-color: inherit !important;
              background-color: inherit !important;
            }
            /* Ensure blue borders stay blue */
            .border-blue-600 {
              border-color: #2563eb !important;
            }
            /* Ensure blue text stays blue */
            .text-blue-600 {
              color: #2563eb !important;
            }
            /* Ensure teal text stays teal */
            .text-teal-600 {
              color: #0d9488 !important;
            }
            /* Ensure red text stays red */
            .text-red-500 {
              color: #ef4444 !important;
            }
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
            
            {/* Items Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-700">Items Summary</span>
                <span className="text-sm text-blue-600 font-bold">{items.length} items</span>
              </div>
              <div className="text-xs text-blue-600">
                <div>Subtotal: {formatCurrency(invoice?.subtotal || 0)}</div>
                <div>Total: {formatCurrency(invoice?.total || 0)}</div>
              </div>
            </div>
            
            {/* Deposit Input */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deposit}
                  onChange={(e) => handleDepositChange(Number(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the deposit amount received
              </p>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base font-semibold"
            >
              <FontAwesomeIcon icon={faFileInvoice} />
              <span>Download as PDF</span>
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
        <div className="flex-1 flex items-start justify-center min-h-screen bg-gray-50">
          {invoice ? (
            <div className="print-area" style={{ width: '148mm', height: '210mm', minHeight: '210mm', position: 'relative', padding: '4mm 4mm 6mm 4mm', boxSizing: 'border-box', background: '#fff' }}>
              {/* A5 Invoice Content */}
              <div className="relative h-full w-full flex flex-col" style={{ padding: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
                {/* Header Section */}
                <div className="flex flex-row items-center justify-between mb-3">
                  {/* Left: Logo and clinic name */}
                  <div className="flex flex-row items-center space-x-4">
                    <img src={logoNoBg} alt="Dogtor VET Logo" className="w-16 h-16 object-contain" />
                    <div>
                      <div className="text-lg font-bold khmer-font">
                        <span className="text-black">ពេទ្យសត្វ </span>
                        <span className="text-teal-600">ឌ</span>
                        <span className="text-black">កទ័រ </span>
                      </div>
                      <div className=" text-md caveat-font font-bold"><span className='inline-block rotate-90 text-teal-600 mr-1'>:D</span>ogtor VET services</div>
                    </div>
                  </div>
                  {/* Right: Phone numbers */}
                  <div className="text-right ml-4">
                    <div className="text-red-500 font-bold text-sm leading-relaxed caveat-font">016 92 62 32</div>
                    <div className="text-red-500 font-bold text-sm leading-relaxed caveat-font">061 92 62 32</div>
                  </div>
                </div>
                <div className="mb-3 flex justify-between items-center">
                  {/* Invoice Number */}
                  <div className="inline-block px-3 py-2">
                    <span className="text-red-500 font-bold caveat-font">No: </span>
                    <span className="font-bold text-teal-600 caveat-font">{invoice.invoice_number}</span>
                  </div>
                  {/* Receipt title in the middle */}
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold khmer-font text-blue-600">វិកយបត្រ</div>
                    <div className="text-lg text-blue-600 italic roboto-font font-medium">Receipt</div>
                  </div>
                  {/* Date only */}
                  <div className="text-right">
                    <div className="khmer-font text-sm text-red-500">កាលបរិច្ឆេទ / <span className="caveat-font font-bold text-red-500">Date:</span> <span className="caveat-font font-bold text-teal-600"> {formatDate(invoice.invoice_date)}</span></div>
                  </div>
                </div>
                {/* Client Info */}
                <div className="mb-3 p-4 bg-blue-50 rounded-lg">
                  <div className="flex flex-row justify-between text-sm items-center">
                    <div className="flex flex-row items-center gap-1">
                      <span className="font-semibold text-blue-600 khmer-font">អតិថិជន /</span>
                      <span className="font-semibold text-blue-600 caveat-font">Client:</span>
                      <span className="font-bold text-teal-600 caveat-font ml-1">{invoice.client?.name || invoice.client_name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-row items-center gap-1 justify-center w-1/2">
                      <span className="font-semibold text-blue-600 khmer-font">ឈ្មោះសត្វ /</span>
                      <span className="font-semibold text-blue-600 caveat-font">Pet Name:</span>
                      <span className="font-bold text-teal-600 caveat-font ml-1">{invoice.pet?.name || invoice.pet_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                {/* Items Table */}
                <div style={{ height: '115mm', overflow: 'hidden' }}>
                  <table className="w-full border-collapse border-t-2 border-r-2 border-blue-600" style={{ tableLayout: 'fixed', height: '100%' }}>
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-10">
                          <div className="text-red-500 font-bold khmer-font">ល.រ</div>
                          <div className="text-teal-600 font-semibold caveat-font">N°</div>
                        </th>
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-32"><div className="text-red-500 font-bold khmer-font">សេវាកម្ម/ផលិតផល</div><div className=" font-semibold caveat-font text-teal-600">Items</div></th>
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-10"><div className="text-red-500 font-bold khmer-font">ចំនួន</div><div className=" font-semibold caveat-font text-teal-600">Qty</div></th>
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-16"><div className="text-red-500 font-bold khmer-font">តម្លៃឯកតា</div><div className=" font-semibold caveat-font text-teal-600">Unit Price</div></th>
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-12"><div className="text-red-500 font-bold khmer-font">បញ្ចុះតម្លៃ</div><div className=" font-semibold caveat-font text-teal-600">Discount</div></th>
                        <th className="border-2 border-blue-600 px-3 py-0.5 text-xs text-center w-16"><div className="text-red-500 font-bold khmer-font">តម្លៃសរុប</div><div className=" font-semibold caveat-font text-teal-600">Total</div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }).map((_, i) => {
                        const item = items[i];
                        console.log(`🔍 Row ${i + 1} item:`, item);
                        return (
                          <tr key={item ? item.id : `empty-${i}`}> 
                            <td className="border-2 border-blue-600 px-1 py-1 text-center text-xs font-bold caveat-font align-top text-blue-600" style={{ height: '8mm' }}>{i + 1}</td>
                            <td className="border-t-2 border-r-2 border-b-2 border-blue-600 px-1 py-1 text-xs align-top" style={{ height: '8mm' }}>
                              {item ? (
                                <div className="font-medium roboto-font flex justify-between items-start">
                                  <span>{item.item_name || item.service?.name || item.product?.name || <span className='text-teal-600'>No name</span>}</span>
                                  <button 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-500 hover:text-red-700 no-print ml-2 opacity-75 hover:opacity-100 print:hidden bg-red-50 hover:bg-red-100 px-1 py-0.5 rounded"
                                    title="Delete Item"
                                  >
                                    <FontAwesomeIcon icon={faTrash} size="xs" />
                                  </button>
                                </div>
                              ) : null}
                              {item && (item.item_description || item.service?.description || item.product?.description) && (
                                <div className="text-xs text-gray-600 mt-1 caveat-font">{item.item_description || item.service?.description || item.product?.description}</div>
                              )}
                            </td>
                            <td className="border-t-2 border-r-2 border-b-2 border-blue-600 px-1 py-1 text-xs font-medium roboto-font align-center text-right" style={{ height: '8mm' }}>
                              {item ? (
                                <div className="flex items-center justify-end space-x-1">
                                  <span>{item.quantity}</span>
                                  <button 
                                    onClick={() => handleEditQuantity(item)}
                                    className="text-blue-600 hover:text-blue-900 no-print opacity-75 hover:opacity-100 print:hidden bg-blue-50 hover:bg-blue-100 px-1 py-0.5 rounded text-xs"
                                    title="Edit quantity"
                                  >
                                    <FontAwesomeIcon icon={faEdit} size="xs" />
                                  </button>
                                </div>
                              ) : ''}
                            </td>
                            <td className="border-t-2 border-r-2 border-b-2 border-blue-600 px-1 py-1 text-xs font-medium roboto-font align-center text-right" style={{ height: '8mm' }}>{item ? formatCurrency(item.unit_price || item.service?.price || item.product?.price) : ''}</td>
                            <td className="border-t-2 border-r-2 border-b-2 border-blue-600 px-1 py-1 text-xs font-medium roboto-font align-center text-right" style={{ height: '8mm' }}>
                              {item ? (
                                <div className="flex items-center justify-end space-x-1">
                                  <span>{item.discount_percent || 0}%</span>
                                  <button 
                                    onClick={() => handleEditDiscount(item)}
                                    className="text-green-600 hover:text-green-900 no-print opacity-75 hover:opacity-100 print:hidden bg-green-50 hover:bg-green-100 px-1 py-0.5 rounded text-xs"
                                    title="Edit discount"
                                  >
                                    <FontAwesomeIcon icon={faEdit} size="xs" />
                                  </button>
                                </div>
                              ) : ''}
                            </td>
                            <td className="border-t-2 border-r-2 border-b-2 border-blue-600 px-1 py-1 text-xs font-bold roboto-font align-center text-right" style={{ height: '8mm' }}>{item ? formatCurrency(Number(item.service?.price || item.product?.price || 0) * Number(item.quantity || 0) * (1 - Number(item.discount_percent || 0) / 100)) : ''}</td>
                          </tr>
                        );
                      })}
                      {/* Sub-total, Discount, Grand Total, Deposit, Balance Due rows - stacked */}
                      <tr>
                        <td className="px-1 py-0.5 text-blue-600 font-medium khmer-font align-center whitespace-nowrap text-xs text-right" colSpan={5} style={{ height: '8mm' }}>សរុបបណ្តោះអាសន្ត / Sub-total</td>
                        <td className="border-2 border-blue-600 px-1 py-0.5 text-right font-bold roboto-font align-center text-xs" style={{ height: '8mm' }}>{formatCurrency(invoice.subtotal || 0)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 text-blue-600 font-medium khmer-font align-center whitespace-nowrap text-xs text-right" colSpan={5} style={{ height: '8mm' }}>បញ្ចុះតម្លៃ / Discount</td>
                        <td className="border-r-2 border-b-2 border-l-2 border-blue-600 px-1 py-0.5 text-right font-bold roboto-font align-center text-xs" style={{ height: '8mm' }}>{invoice.discount_percent || 0}%</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 text-blue-600 font-medium khmer-font align-center whitespace-nowrap text-xs text-right" colSpan={5} style={{ height: '8mm' }}>សរុប / Grand total</td>
                        <td className="border-r-2 border-b-2 border-l-2 border-blue-600 px-1 py-0.5 text-right font-bold roboto-font align-center text-xs" style={{ height: '8mm' }}>{formatCurrency(invoice.total)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 text-blue-600 font-medium khmer-font align-center whitespace-nowrap text-xs text-right" colSpan={5} style={{ height: '8mm' }}>ប្រាក់កក់ / Deposit</td>
                        <td className="border-r-2 border-b-2 border-l-2 border-blue-600 px-1 py-0.5 text-right font-bold roboto-font align-center text-xs" style={{ height: '8mm' }}>{formatCurrency(deposit)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 text-blue-600 font-medium khmer-font align-center whitespace-nowrap text-xs text-right" colSpan={5} style={{ height: '8mm' }}>នៅខ្វះ / Balance Due</td>
                        <td className="border-r-2 border-b-2 border-l-2 border-blue-600 px-1 py-0.5 text-right font-bold roboto-font align-center text-xs" style={{ height: '8mm' }}>{formatCurrency((invoice.total || 0) - deposit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Footer and Thank you message */}
                <div className="absolute bottom-0 left-0 right-0 text-center pt-2 pb-2 border-t border-gray-200 bg-white">
                  <div className="text-sm text-gray-700 khmer-font">
                    សូមអរគុណសម្រាប់ការជឿជាក់សេវាកម្មរបស់យើង ជួបគ្នាពេលក្រោយ! 😊
                  </div>
                  <div className="text-sm text-gray-700 mt-1 caveat-font">
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