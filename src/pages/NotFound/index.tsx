// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../../api/auth';

const NotFound = () => {
  const authenticated = isAuthenticated();

  useEffect(() => {
    document.title = "Page Not Found - :Dogtor VET Services";
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center bg-gray-100 p-6">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="mb-6 text-gray-600">Sorry, the page you're looking for doesn't exist.</p>
      
      <div className="space-x-4">
        {authenticated ? (
          <>
            <Link
              to="/dashboard"
              className="px-6 py-2 bg-[#007c7c] text-white rounded hover:bg-[#005f5f] transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/home"
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Go to Home
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="px-6 py-2 bg-[#007c7c] text-white rounded hover:bg-[#005f5f] transition-colors"
          >
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
