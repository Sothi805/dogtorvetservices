import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Search from "../../components/Search";
import Layout from "../../layouts/PageLayout";
import {
  faBarsStaggered,
  faCheck,
  faXmark,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import CustomerTable from "../../components/CustomerTable";

const Customer = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "id" | "status">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // desc for latest first
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const createCustomerRef = useRef<(() => void) | null>(null);

  // Force default to "active" on component mount to show only active customers
  useEffect(() => {
    setStatusFilter("active");
    console.log("🔧 Customer tab opened - filter set to 'active'");
  }, []);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const getSortDisplayText = (sortBy: string, sortOrder: string) => {
    const sortLabels = {
      name: sortOrder === "asc" ? "Name (A-Z)" : "Name (Z-A)",
      created_at: sortOrder === "asc" ? "Oldest First" : "Latest First",
      id: sortOrder === "asc" ? "ID (Low-High)" : "ID (High-Low)",
      status: sortOrder === "asc" ? "Inactive First" : "Active First"
    };
    return sortLabels[sortBy as keyof typeof sortLabels] || "Name (A-Z)";
  };

  const handleCreateCustomer = () => {
    console.log("🔘 Create Customer button clicked");
    console.log("📞 createCustomerRef.current:", createCustomerRef.current);
    if (createCustomerRef.current) {
      createCustomerRef.current();
    } else {
      console.error("❌ createCustomerRef.current is null");
    }
  };

  return (
    <Layout title="Customers">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between mb-4 gap-4">
          <div className="flex-1 sm:max-w-md">
          <Search 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search customers..."
          />
          </div>
          <button 
            onClick={handleCreateCustomer}
            className="bg-[#007c7c] hover:bg-[#005f5f] text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-all duration-200 whitespace-nowrap relative z-10 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Customer</span>
          </button>
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
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select 
                className="responsive-select w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "created_at" | "id" | "status")}
              >
                <option value="created_at">Registration Date</option>
                <option value="name">Name</option>
                <option value="id">Customer ID</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
              <select 
                className="responsive-select w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                {sortBy === "name" && (
                  <>
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
                  </>
                )}
                {sortBy === "created_at" && (
                  <>
                    <option value="desc">Latest First</option>
                    <option value="asc">Oldest First</option>
                  </>
                )}
                {sortBy === "id" && (
                  <>
                    <option value="desc">Newest ID</option>
                    <option value="asc">Oldest ID</option>
                  </>
                )}
                {sortBy === "status" && (
                  <>
                    <option value="desc">Active First</option>
                    <option value="asc">Inactive First</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Show</label>
              <select 
                className="responsive-select w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs md:text-sm"
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
                  setSortBy("created_at");
                  setSortOrder("desc");
                  setPageSize(15);
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
        <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600 mb-4">
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

          <div className={`flex items-center space-x-4 transition-all duration-500 ease-in-out overflow-hidden ${
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

            <div className="space-x-2 flex-shrink-0">
              <label>Sort by:</label>
              <select 
                className="responsive-select bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "created_at" | "id" | "status")}
              >
                <option value="created_at">Registration Date</option>
                <option value="name">Name</option>
                <option value="id">Customer ID</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Order:</label>
              <select 
                className="responsive-select bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                {sortBy === "name" && (
                  <>
                    <option value="asc">A to Z</option>
                    <option value="desc">Z to A</option>
                  </>
                )}
                {sortBy === "created_at" && (
                  <>
                    <option value="desc">Latest First</option>
                    <option value="asc">Oldest First</option>
                  </>
                )}
                {sortBy === "id" && (
                  <>
                    <option value="desc">Newest ID</option>
                    <option value="asc">Oldest ID</option>
                  </>
                )}
                {sortBy === "status" && (
                  <>
                    <option value="desc">Active First</option>
                    <option value="asc">Inactive First</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-x-2 flex-shrink-0">
              <label>Show:</label>
              <select 
                className="responsive-select bg-white border border-gray-300 rounded-sm px-2 py-1 transition-all duration-200"
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

        {/* Customer Table - Responsive */}
        <CustomerTable 
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          pageSize={pageSize}
          searchTerm={searchTerm}
          onCreateCustomerRef={(callback) => { 
            console.log("🔗 Setting createCustomerRef callback:", callback);
            createCustomerRef.current = callback; 
          }}
        />
      </div>
    </Layout>
  );
};

export default Customer;
