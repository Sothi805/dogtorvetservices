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

  faEdit,
  faBoxes,
} from "@fortawesome/free-solid-svg-icons";
import { productsApi, Product, ProductFilters, CreateProductRequest, UpdateProductRequest } from "../../api/products";
import { TableSkeleton, ErrorState, EmptyState } from "../../components/ui/loading";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  // const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  // const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);

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
        per_page: 15, // Default page size
        page: 1, // Default current page
        sort_by: 'name',
        sort_order: 'desc', // Default sort order
        include_inactive: statusFilter === 'all' || statusFilter === 'inactive',
      };

      const response = await productsApi.getProducts(filters);
      setProducts(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, 15, 1, 'desc', statusFilter]); // Updated dependencies

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

  const handleToggleStatus = async (product: Product) => {
    try {
      await productsApi.updateProduct(product.id, { status: !product.status });
      loadProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: CreateProductRequest | UpdateProductRequest) => {
    if (selectedProduct) {
      await handleUpdateProduct(productData as UpdateProductRequest);
    } else {
      await handleCreateProduct(productData as CreateProductRequest);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.status) ||
      (statusFilter === 'inactive' && !product.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Products">
      {/* Header with Search and Create Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex-1">
          <p className="text-gray-600 mt-2">Manage products and inventory in your veterinary system</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Search
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
          <button
            onClick={handleCreate}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Filter Controls */}
      <div className="lg:hidden bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="responsive-select w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => {
                setStatusFilter("active");
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
              All
            </button>

            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                statusFilter === "active" ? "bg-green-500" : "bg-green-300 hover:bg-green-400"
              }`}
            >
              Active <FontAwesomeIcon icon={faCheck} />
            </button>

            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-full text-white text-xs transition-all duration-200 ${
                statusFilter === "inactive" ? "bg-red-500" : "bg-red-300 hover:bg-red-400"
              }`}
            >
              Inactive <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "No products found matching your search" : "No products found"}
                </p>
                <button
                  onClick={handleCreate}
                  className="bg-[#007c7c] text-white px-4 py-2 rounded-lg hover:bg-[#005f5f] transition-colors"
                >
                  Create Product
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity);
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <FontAwesomeIcon icon={faBoxes} className="text-white text-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">${Number(product.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                        product.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="text-sm font-medium">{product.stock_quantity} units</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                          product.status 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={product.status ? 'Deactivate product' : 'Activate product'}
                      >
                        <FontAwesomeIcon icon={product.status ? faXmark : faCheck} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        <EmptyState 
                          title="No Products Found"
                          message={searchTerm ? "No products found matching your search" : "No products found"} 
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <FontAwesomeIcon icon={faBoxes} className="text-white text-sm" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${Number(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.stock_quantity} units</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 transition-colors"
                                title="Edit product"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(product)}
                                className={`p-1 rounded transition-colors ${
                                  product.status 
                                    ? 'text-red-600 hover:text-red-900 hover:bg-red-100' 
                                    : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                                }`}
                                title={product.status ? 'Deactivate product' : 'Activate product'}
                              >
                                <FontAwesomeIcon icon={product.status ? faXmark : faCheck} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          onSave={handleSaveProduct}
          isLoading={isModalLoading}
        />
      )}
    </Layout>
  );
};

export default Products; 