import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
      <div
        className="flex flex-col md:flex-row justify-between items-center text-sm 
text-gray-500"
      >
        <div className="mb-2 md:mb-0">
          &copy; {currentYear} Accounting System. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-gray-700 transition-colors">
            About
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
