import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import ProductModal from "../../components/ProductModal";
import {
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
  faExclamationTriangle,
  faEdit,
  faTrash,
  faBoxes,
} from "@fortawesome/free-solid-svg-icons";
import { productsApi, Product, ProductFilters, CreateProductRequest, UpdateProductRequest } from "../../api/products";
import { TableSkeleton, MobileCardSkeleton, ErrorState, EmptyState } from "../../components/ui/loading";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock">("active");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Force default to "active" on component mount to show only active products
  useEffect(() => {
    setStatusFilter("active");
    console.log("🔧 Products tab opened - filter set to 'active'");
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProductFilters = {
        search: searchTerm || undefined,
        per_page: pageSize,
        page: currentPage,
        sort_by: 'name',
        sort_order: sortOrder,
        include_inactive: statusFilter === 'all' || statusFilter === 'inactive',
        low_stock: statusFilter === 'low_stock' ? true : undefined,
        low_stock_threshold: statusFilter === 'low_stock' ? 10 : undefined,
      };

      const response = await productsApi.getProducts(filters);
      setProducts(response.data);
      setTotalPages(response.meta.last_page);
      setTotalProducts(response.meta.total);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, pageSize, currentPage, sortOrder, statusFilter]);

  const handleCreateProduct = async (productData: CreateProductRequest) => {
    try {
      setIsModalLoading(true);
      await productsApi.createProduct(productData);
      await loadProducts();
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleUpdateProduct = async (productData: UpdateProductRequest) => {
    if (!selectedProduct) return;

    try {
      setIsModalLoading(true);
      await productsApi.updateProduct(selectedProduct.id, productData);
      await loadProducts();
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await productsApi.deleteProduct(product.id);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleOpenModal = (product?: Product) => {
    setSelectedProduct(product || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: CreateProductRequest | UpdateProductRequest) => {
    if (selectedProduct) {
      await handleUpdateProduct(productData as UpdateProductRequest);
    } else {
      await handleCreateProduct(productData as CreateProductRequest);
    }
  };

  const filteredProducts = products.filter(product => {
    if (statusFilter === 'active') return product.status;
    if (statusFilter === 'inactive') return !product.status;
    if (statusFilter === 'low_stock') return product.stock_quantity <= 10;
    return true;
  });

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { color: 'text-red-600', label: 'Out of Stock' };
    if (quantity <= 10) return { color: 'text-orange-600', label: 'Low Stock' };
    return { color: 'text-gray-900', label: 'In Stock' };
  };

  return (
    <Layout title="Products">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Product</span>
          </button>
        </div>

        {/* Mobile/Tablet Filter Controls */}
        <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Filter</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "low_stock")}
              >
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Show</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={15}>15 items</option>
                <option value={20}>20 items</option>
                <option value={25}>25 items</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSortOrder("asc");
                  setPageSize(10);
                  setSearchTerm("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600 mb-4 overflow-hidden">
          <button 
            onClick={toggleMenu}
            className="hover:text-[#007c7c] transition-all duration-300 p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            title={isMenuVisible ? "Hide Filters" : "Show Filters"}
          >
            <FontAwesomeIcon 
              icon={faBarsStaggered} 
              className={`text-lg transition-transform duration-300 ${
                isMenuVisible ? 'transform rotate-0' : 'transform rotate-180'
              }`} 
            />
          </button>

          <div className={`flex items-center space-x-4 transition-all duration-500 ease-in-out ${
            isMenuVisible 
              ? 'transform translate-x-0 opacity-100 max-w-full' 
              : 'transform -translate-x-full opacity-0 max-w-0'
          }`}>
            <div className="flex space-x-2 flex-shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "all" ? "bg-gray-800" : "bg-gray-400 hover:bg-gray-600"
                }`}
              >
                <span>All</span>
              </button>

              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "active" ? "bg-green-500" : "bg-green-300 hover:bg-green-400"
                }`}
              >
                <span>Active</span>{" "}
                <FontAwesomeIcon icon={faCheck} />
              </button>

              <button
                onClick={() => setStatusFilter("low_stock")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "low_stock" ? "bg-orange-500" : "bg-orange-300 hover:bg-orange-400"
                }`}
              >
                <span>Low Stock</span>{" "}
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </button>

              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                  statusFilter === "inactive" ? "bg-red-500" : "bg-red-300 hover:bg-red-400"
                }`}
              >
                <span>Inactive</span>{" "}
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Sort :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Show :</label>
              <select 
                className="bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Failed to load products"
            message={error}
            onRetry={loadProducts}
            retryText="Retry Loading"
          />
        )}

          {loading ? (
          <>
            <MobileCardSkeleton items={5} />
            <div className="hidden lg:block">
              <TableSkeleton rows={5} cols={6} />
            </div>
          </>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No products found"
            message="No products match your current search and filter criteria. Try adjusting your filters or create a new product."
            actionText="Create Product"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <>
              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {filteredProducts.length > 0 && (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);
                      return (
                        <div key={product.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="text-lg font-medium text-gray-900 flex items-center">
                                {product.name}
                                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="ml-2 text-orange-500 text-xs" />
                                )}
                                {product.stock_quantity <= 0 && (
                                  <FontAwesomeIcon icon={faBoxes} className="ml-2 text-red-500 text-xs" />
                                )}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                              )}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                              product.status 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex flex-wrap gap-2">
                              {product.sku && (
                                <span className="inline-flex px-2 py-1 text-xs font-mono font-semibold rounded-full bg-gray-100 text-gray-800">
                                  SKU: {product.sku}
                                </span>
                              )}
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                ${Number(product.price).toFixed(2)}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                stockStatus.color === 'text-red-600' ? 'bg-red-100 text-red-800' : 
                                stockStatus.color === 'text-orange-600' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                Stock: {product.stock_quantity}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-3 border-t">
                            <button 
                              onClick={() => handleOpenModal(product)}
                              className="px-3 py-1 text-xs bg-[#007c7c] text-white hover:bg-[#005f5f] rounded-full font-medium transition-colors"
                            >
                              <FontAwesomeIcon icon={faEdit} className="mr-1" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full font-medium transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock_quantity);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  {product.name}
                                  {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="ml-2 text-orange-500 text-xs" />
                                  )}
                                  {product.stock_quantity <= 0 && (
                                    <FontAwesomeIcon icon={faBoxes} className="ml-2 text-red-500 text-xs" />
                                  )}
                                </div>
                                {product.description && (
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {product.sku || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${Number(product.price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${stockStatus.color}`}>
                                {product.stock_quantity} units
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.status 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleOpenModal(product)}
                                className="text-[#007c7c] hover:text-[#005f5f] mr-3"
                                title="Edit product"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete product"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalProducts)}
                        </span>{' '}
                        of <span className="font-medium">{totalProducts}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          </div>
          )}

        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          onSave={handleSaveProduct}
          product={selectedProduct}
          isLoading={isModalLoading}
        />
      </div>
    </Layout>
  );
};

export default Products; 