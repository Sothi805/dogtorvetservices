import React, { useEffect } from "react";

const Layout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  useEffect(() => {
    // Update document title with the page title
    document.title = `${title} - :Dogtor VET Services`;
    
    // Clean up - set back to default when component unmounts
    return () => {
              document.title = ":Dogtor VET Services";
    };
  }, [title]);

  return (
    <div className="p-4 space-y-4">
      {/* Clean page header without duplicate controls */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="w-12 h-1 bg-gradient-to-r from-[#007c7c] to-emerald-500 rounded-full mt-2"></div>
      </div>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
