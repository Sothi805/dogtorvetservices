import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faHome, 
  faUsers, 
  faPaw, 
  faCalendarAlt, 
  faCog,
  faBoxOpen,
  faFileInvoiceDollar,
  faUserTie,
  //faProjectDiagram,
  faSignOutAlt,
  faUser,
  faChevronDown,
  faChevronUp,
  //faDna,
  faShieldAlt,
  faSyringe,
  //faUserFriends,
  //faAtom,
  //faCertificate,
  faHeart,
  faTag,
  faFlask,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMobileClose?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCustomersDropdownOpen, setIsCustomersDropdownOpen] = useState(false);
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onMobileClose?.();
  };

  const handleNavClick = () => {
    onMobileClose?.();
  };

  const menuItems = [
    { to: '/appointments', icon: faCalendarAlt, label: 'Appointments', gradient: 'from-purple-500 to-purple-600' },
    { to: '/users', icon: faUserTie, label: 'Staff', gradient: 'from-red-500 to-red-600' },
  ];

  const customersSubItems = [
    { to: '/customer', icon: faUsers, label: 'All Customers', gradient: 'from-green-500 to-green-600' },
    { to: '/pets', icon: faPaw, label: 'All Pets', gradient: 'from-yellow-500 to-yellow-600' },
    { to: '/pets/species', icon: faFlask, label: 'Species', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/pets/breeds', icon: faTag, label: 'Breeds', gradient: 'from-teal-500 to-teal-600' },
    { to: '/pets/allergies', icon: faShieldAlt, label: 'Allergies', gradient: 'from-red-500 to-red-600' },
    { to: '/pets/vaccinations', icon: faSyringe, label: 'Vaccinations', gradient: 'from-blue-500 to-blue-600' },
  ];

  const invoiceSubItems = [
    { to: '/invoices', icon: faFileInvoiceDollar, label: 'All Invoices', gradient: 'from-orange-500 to-orange-600' },
    { to: '/services', icon: faCog, label: 'Services', gradient: 'from-indigo-500 to-indigo-600' },
    { to: '/products', icon: faBoxOpen, label: 'Products', gradient: 'from-pink-500 to-pink-600' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) => (
    `group relative flex items-center space-x-3 px-4 py-3 my-1 mx-2 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-white/20 text-white shadow-lg transform scale-105 backdrop-blur-sm' 
        : 'text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:translate-x-1'
    }`
  );

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) => (
    `group relative flex items-center space-x-3 px-4 py-2 my-1 mx-6 rounded-lg transition-all duration-300 ${
      isActive 
        ? 'bg-white/30 text-white shadow-md transform scale-105 backdrop-blur-sm' 
        : 'text-white/70 hover:bg-white/15 hover:text-white hover:transform hover:translate-x-1'
    }`
  );

  const isCustomersActive = location.pathname.startsWith('/customer') || 
                           location.pathname.startsWith('/pets');

  const isInvoiceActive = location.pathname.startsWith('/invoices') || 
                         location.pathname.startsWith('/services') || 
                         location.pathname.startsWith('/products');

  // Auto-expand customers dropdown when on customers/pets-related page
  useEffect(() => {
    if (isCustomersActive) {
      setIsCustomersDropdownOpen(true);
    }
  }, [isCustomersActive]);

  // Auto-expand invoice dropdown when on invoice-related page
  useEffect(() => {
    if (isInvoiceActive) {
      setIsInvoiceDropdownOpen(true);
    }
  }, [isInvoiceActive]);

  return (
    <aside className="w-64 h-full bg-gradient-to-b from-[#007c7c] via-[#006666] to-[#005555] text-white flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
      </div>

      {/* Close button for mobile */}
      <div className="md:hidden absolute top-4 right-4 z-[100]">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMobileClose) {
              onMobileClose();
            }
          }}
          className="text-white/90 hover:text-white transition-all p-3 hover:scale-110 active:scale-95"
          title="Close Menu"
          type="button"
        >
          <FontAwesomeIcon icon={faTimes} className="text-lg" />
        </button>
      </div>

      <div className="flex flex-col h-full relative z-10">
        {/* User Profile Section */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <FontAwesomeIcon icon={faUser} className="text-lg text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || 'Dr. Veterinarian'}
              </p>
              <p className="text-xs text-white/70 capitalize truncate">
                {user?.role || 'Veterinarian'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-hidden">
          <div className="space-y-1 py-4 h-full overflow-y-auto scrollbar-hide">
            {/* Dashboard */}
            <NavLink
              to="/dashboard"
              className={navLinkClass}
              onClick={handleNavClick}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <FontAwesomeIcon icon={faHome} className="text-sm text-white" />
              </div>
              <span className="font-medium text-sm truncate">Dashboard</span>
              
              {/* Active indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </NavLink>

            {/* Customers & Pets Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsCustomersDropdownOpen(!isCustomersDropdownOpen)}
                className="w-full group relative flex items-center justify-between space-x-3 px-4 py-3 my-1 mx-2 rounded-xl transition-all duration-300 text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:translate-x-1"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <FontAwesomeIcon icon={faHeart} className="text-sm text-white" />
                  </div>
                  <span className="font-medium text-sm truncate">Customers & Pets</span>
                </div>
                <FontAwesomeIcon 
                  icon={isCustomersDropdownOpen ? faChevronUp : faChevronDown} 
                  className={`text-xs transition-transform duration-300 ${isCustomersDropdownOpen ? 'rotate-180' : ''}`} 
                />
                
                {/* Active indicator */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              {/* Dropdown Items */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isCustomersDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="py-2">
                  {customersSubItems.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className={subNavLinkClass}
                      onClick={handleNavClick}
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${subItem.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                        <FontAwesomeIcon icon={subItem.icon} className="text-xs text-white" />
                      </div>
                      <span className="font-medium text-xs truncate">{subItem.label}</span>
                      
                      {/* Active indicator */}
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Invoice Section Dropdown Menu */}
            {true && (
              <div className="relative">
                <button
                  onClick={() => setIsInvoiceDropdownOpen(!isInvoiceDropdownOpen)}
                  className="w-full group relative flex items-center justify-between space-x-3 px-4 py-3 my-1 mx-2 rounded-xl transition-all duration-300 text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:translate-x-1"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-sm text-white" />
                    </div>
                    <span className="font-medium text-sm truncate">Invoice Section</span>
                  </div>
                  <FontAwesomeIcon 
                    icon={isInvoiceDropdownOpen ? faChevronUp : faChevronDown} 
                    className={`text-xs transition-transform duration-300 ${isInvoiceDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                  
                  {/* Active indicator */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                {/* Dropdown Items */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isInvoiceDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="py-2">
                    {invoiceSubItems.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        className={subNavLinkClass}
                        onClick={handleNavClick}
                      >
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${subItem.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                          <FontAwesomeIcon icon={subItem.icon} className="text-xs text-white" />
                        </div>
                        <span className="font-medium text-xs truncate">{subItem.label}</span>
                        
                        {/* Active indicator */}
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Menu Items */}
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                onClick={handleNavClick}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                  <FontAwesomeIcon icon={item.icon} className="text-sm text-white" />
                </div>
                <span className="font-medium text-sm truncate">{item.label}</span>
                
                {/* Active indicator */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
