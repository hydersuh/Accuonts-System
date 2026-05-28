import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  FolderIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      path: "/dashboard",

      name: "Dashboard",
      icon: HomeIcon,
      roles: ["admin", "accountant", "viewer"],
    },
    {
      path: "/chart-of-accounts",
      name: "Chart of Accounts",
      icon: FolderIcon,
      roles: ["admin", "accountant"],
    },
    {
      path: "/ledgers",
      name: "Ledgers",
      icon: BookOpenIcon,
      roles: ["admin", "accountant", "viewer"],
    },
    {
      path: "/vouchers",
      name: "Vouchers",
      icon: DocumentTextIcon,
      roles: ["admin", "accountant"],
    },
    {
      path: "/reports",
      name: "Reports",
      icon: ChartBarIcon,
      roles: ["admin", "accountant", "viewer"],
    },
    {
      path: "/financial-years",
      name: "Financial Years",
      icon: CalendarIcon,
      roles: ["admin", "accountant"],
    },
    {
      path: "/settings",
      name: "Settings",
      icon: Cog6ToothIcon,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "viewer"),
  );

  const sidebarWidth = isCollapsed ? "w-20" : "w-64";
  const sidebarWidthLg = isCollapsed ? "lg:w-20" : "lg:w-64";

  if (!isOpen && window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen ${sidebarWidth} ${
          sidebarWidthLg
        } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        {/* Logo Area */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b border-gray-700"
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">Accounting</h1>
                <p className="text-xs text-gray-400">System</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <CurrencyDollarIcon className="h-8 w-8 text-blue-400 mx-auto" />
          )}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 768 && onClose()}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"} ${isCollapsed ? "justify-center" : "space-x-3"}`
              }
              title={isCollapsed ? item.name : ""}
            >
              <item.icon
                className={`h-5 w-5 ${isCollapsed ? "" : "flex-shrink-0"}`}
              />

              {!isCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-700 p-4">
          {!isCollapsed && user && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {user.role || "User"}
                </p>
              </div>
            </div>
          )}

          {isCollapsed && user && (
            <div className="flex justify-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              isCollapsed ? "justify-center" : "space-x-3"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
