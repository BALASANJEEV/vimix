import React, { useState } from "react";
import {
  Users,
  CreditCard,
  Home,
  LogOut,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import VimixDarkLogo from "../images/VimixDark.png";
import { Link, useLocation } from "react-router-dom";

interface NavigationProps {
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = localStorage.getItem("role");
  const storedName = localStorage.getItem("name");
  const name = storedName && storedName !== "undefined" ? storedName : "Guest";

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/clients", label: "Clients", icon: Users },
    ...(role === "admin"
      ? [{ path: "/partners", label: "Partners", icon: UserCheck }]
      : []),
    { path: "/projects", label: "Projects", icon: Users },
    { path: "/payments", label: "Payments", icon: CreditCard },
  ];

  const isActivePath = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to={"/"}>
              <img src={VimixDarkLogo} alt="Vimix" className="h-10 w-auto" />
            </Link>
            {/* Desktop Menu */}
            <div className="hidden px-10  md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : "text-gray-600 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-800">
              Welcome {name || "Guest"}
            </h1>

          {/* Logout & Mobile Hamburger */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLogout}
              className="hidden md:flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>

            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
