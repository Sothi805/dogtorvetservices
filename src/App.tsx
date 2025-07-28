import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import PrivateRoute from './routes';
import Dashboard from './pages/Dashboard/Dashboard';
import Customer from './pages/Customer';
import Pets from './pages/Pets';
import SpeciesManagement from './pages/Species';
import BreedsManagement from './pages/Breeds';
import AllergiesManagement from './pages/Allergies';
import VaccinationsManagement from './pages/Vaccinations';
import Appointments from './pages/Appointments';
import Services from './pages/Services';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import PrintPreview from './pages/PrintPreview';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
//import Home from './pages/Home';
//import EntityRelationships from './pages/EntityRelationships';

const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <Routes>
            {/* Root route - redirect based on authentication */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route element={<AuthenticatedLayout />}>
                {/* <Route path="/home" element={<Home />} /> */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customer" element={<Customer />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/pets/species" element={<SpeciesManagement />} />
                <Route path="/pets/breeds" element={<BreedsManagement />} />
                <Route path="/pets/allergies" element={<AllergiesManagement />} />
                <Route path="/pets/vaccinations" element={<VaccinationsManagement />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/services" element={<Services />} />
                <Route path="/products" element={<Products />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/print-preview/:id" element={<PrintPreview />} />
                <Route path="/users" element={<Users />} />
                {/* <Route path="/entity-relationships" element={<EntityRelationships />} /> */}
              </Route>
            </Route>

            <Route path="*" element={<NotFound/>} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};

// Component to handle root redirect
const RootRedirect = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default App;
