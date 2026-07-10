import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import HoverMenu from './HoverMenu';

const TopNav = ({ currentPage, navigateToPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerLine1Ref = useRef(null);
  const hamburgerLine2Ref = useRef(null);

  const handleNavClick = (page) => {
    navigateToPage(page);
  };

  const handleMobileNavClick = (page) => {
    navigateToPage(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Animate hamburger to X and back
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Transform to X - move lines to center and rotate
      gsap.to(hamburgerLine1Ref.current, {
        attr: { d: "M6 12h12" },
        rotation: 45,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
      gsap.to(hamburgerLine2Ref.current, {
        attr: { d: "M6 12h12" },
        rotation: -45,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
    } else {
      // Transform back to hamburger
      gsap.to(hamburgerLine1Ref.current, {
        attr: { d: "M6 9h12" },
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
      gsap.to(hamburgerLine2Ref.current, {
        attr: { d: "M6 15h12" },
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
    }
  }, [isMobileMenuOpen]);

  const handleMouseEnter = () => {
    if (!hasEverOpened) {
      setHasEverOpened(true);
      setIsMenuOpen(true);
    }
    setIsMenuVisible(true);
  };

  const handleMouseLeave = () => {
    setIsMenuVisible(false);
    setActiveSection(null);
    // Keep menu mounted for smooth transitions
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="bg-dark-950/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleNavClick('home')}
                className="text-xl font-heading font-bold text-gradient-primary hover:opacity-80 transition-opacity focus:outline-none"
              >
                NL
              </button>
            </div>

            {/* Centered Navigation Links */}
            <div 
              className="hidden md:flex items-center space-x-2 relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                onClick={() => handleNavClick('agents')}
                onMouseEnter={() => setActiveSection('agents')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium focus:outline-none"
              >
                Agents
              </button>
              <button
                onClick={() => handleNavClick('apps')}
                onMouseEnter={() => setActiveSection('apps')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium focus:outline-none"
              >
                Apps
              </button>
              <button
                onClick={() => handleNavClick('web')}
                onMouseEnter={() => setActiveSection('web')}
                className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 font-sans text-sm font-medium focus:outline-none"
              >
                Web
              </button>
              
              {/* Hover Menu */}
              {isMenuOpen && (
                <HoverMenu 
                  activeSection={activeSection}
                  navigateToPage={navigateToPage}
                  isVisible={isMenuVisible}
                />
              )}
            </div>

            {/* Contact CTA */}
            <div className="flex items-center">
              <button 
                onClick={() => handleNavClick('contact')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all duration-200 focus:outline-none ${
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
              <button
                onClick={toggleMobileMenu}
                className="text-white opacity-25 transition-colors duration-200 focus:outline-none p-1"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    ref={hamburgerLine1Ref}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 9h12"
                  />
                  <path
                    ref={hamburgerLine2Ref}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 15h12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-page Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-[10000] md:hidden">
          {/* Heavy blur backdrop */}
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-xl"></div>
          
          {/* Menu content */}
          <div className="relative h-full flex flex-col items-center justify-center space-y-12">
            {/* Navigation links */}
            <nav className="flex flex-col items-center space-y-8">
              <button
                onClick={() => handleMobileNavClick('agents')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Agents
              </button>
              <button
                onClick={() => handleMobileNavClick('apps')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Apps
              </button>
              <button
                onClick={() => handleMobileNavClick('web')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Web
              </button>
              <button
                onClick={() => handleMobileNavClick('contact')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Contact
              </button>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;