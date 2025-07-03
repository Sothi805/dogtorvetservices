import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo-no-bg.png';

const AuthenticatedLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Top Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#007c7c] to-[#006666] shadow-lg">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Menu button (no background, no padding) */}
          <button
            onClick={toggleSidebar}
            className="text-white ml-4 hover:text-white/80 transition-all duration-300"
          >
            <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} className="text-lg" />
          </button>

          {/* Right side - Text and logo */}
          <div className="flex items-center space-x-3 mr-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'Caveat, cursive' }}>
                <span className="inline-block rotate-90 mr-1 text-xl">:D</span>
                ogtor VET Services
              </span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <img src={logo} alt=":Dogtor VET" className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:static 
        z-50 md:z-auto 
        transition-transform duration-300 ease-in-out
        w-64 h-full flex-shrink-0
      `}>
        <Navbar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-y-auto scrollbar-hide">
        {/* Add top padding on mobile to account for header bar */}
        <div className="p-4 md:p-6 pt-20 md:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
