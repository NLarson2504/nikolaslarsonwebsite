import React from 'react';

const TopNav = ({ currentPage, navigateToPage }) => {
  const handleNavClick = (page) => {
    navigateToPage(page);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-dark-950/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleNavClick('home')}
                className="text-xl font-heading font-bold text-gradient-primary hover:opacity-80 transition-opacity"
              >
                NL
              </button>
            </div>

            {/* Centered Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={() => handleNavClick('agents')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium"
              >
                Agents
              </button>
              <button 
                onClick={() => handleNavClick('mobile')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium"
              >
                Mobile
              </button>
              <button 
                onClick={() => handleNavClick('design')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium"
              >
                Design
              </button>
            </div>

            {/* Contact CTA */}
            <div className="flex items-center">
              <button 
                onClick={() => handleNavClick('contact')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${
                  currentPage === 'contact'
                    ? 'bg-white text-dark-950'
                    : 'bg-white text-dark-950 hover:bg-gray-100'
                }`}
              >
                Contact
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-dark-200 hover:text-dark-50 transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;