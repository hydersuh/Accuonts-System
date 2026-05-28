import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuthStore } from "../../store/authStore";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user } = useAuthStore();

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/ledgers": "Ledgers",
    "/vouchers": "Vouchers",
    "/reports": "Reports",
    "/chart-of-accounts": "Chart of Accounts",
    "/financial-years": "Financial Years",
    "/settings": "Settings",
  };

  const pageTitle = pageTitles[location.pathname] || "Accounting System";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}
      >
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          pageTitle={pageTitle}
          user={user}
        />

        {/* Main Content */}
        <main className="flex-1 pb-8">{children}</main>

        {/* Footer */}

        <Footer />
      </div>
    </div>
  );
}

export default Layout;
