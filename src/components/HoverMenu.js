import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import liraLogo from '../assets/icons/liralogo.svg';
import tallieLogo from '../assets/icons/tallielogo.svg';
import tarragonLogo from '../assets/icons/tarragonlogo.jpg';
import campusLMLogo from '../assets/icons/campuslmlogo.png';
import mooslixLogo from '../assets/icons/mooslixlogo.svg';

const HoverMenu = ({ activeSection, navigateToPage, isVisible }) => {
  const [currentContent, setCurrentContent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  const navOrder = ['agents', 'mobile', 'design'];
  
  const menuContent = {
    agents: {
      leftLabel: "Agents",
      rightLabel: "Implementations",
      examples: [
        { 
          title: "Lira", 
          description: "AI Invoice Scanner",
          logo: liraLogo,
        },
        { 
          title: "Tallie", 
          description: "Restaurant Analytics Agent",
          logo: tallieLogo,
        }
      ],
      items: [
        { label: "Conversational AI", page: "agents", description: "Chat-based solutions" },
        { label: "Task Automation", page: "automation", description: "AI workflows" },
        { label: "Custom Models", page: "models", description: "Tailored AI" },
        { label: "Integration", page: "integration", description: "Connect systems" }
      ]
    },
    mobile: {
      leftLabel: "Apps",
      rightLabel: "More",
      examples: [
        {
          title: "Tarragon",
          description: "Product Ecosystem in Your Pocket",
          logo: tarragonLogo,
        },
        {
          title: "CampusLM",
          description: "AI Tools for College Students",
          logo: campusLMLogo,
        }
      ],
      items: [
        { label: "iOS Apps", page: "ios", description: "Native Swift" },
        { label: "Android Apps", page: "android", description: "Kotlin & Java" },
        { label: "React Native", page: "react-native", description: "Cross-platform" },
        { label: "App Store", page: "aso", description: "Optimization" }
      ]
    },
    design: {
      leftLabel: "Sites",
      rightLabel: "More",
      examples: [
        {
          title: "Mooslix",
          description: "Biometric Authentication",
          logo: mooslixLogo,
        },
        {
          title: "Tarragon",
          description: "Product Ecosystem in Your Pocket",
          logo: tarragonLogo,
        },
      ],
      items: [
        { label: "UI/UX Design", page: "ux-design", description: "User interfaces" },
        { label: "Prototyping", page: "prototyping", description: "Interactive mockups" },
        { label: "Design Systems", page: "design-systems", description: "Frameworks" },
        { label: "Brand Identity", page: "branding", description: "Visual development" }
      ]
    }
  };

  const getSlideDirection = (from, to) => {
    if (!from || !to) return 0;
    const fromIndex = navOrder.indexOf(from);
    const toIndex = navOrder.indexOf(to);
    return toIndex > fromIndex ? 1 : -1; // 1 for right, -1 for left
  };

  // Initialize menu as invisible on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0, y: -15, scale: 0.9 });
      
      // Trigger appear animation immediately
      if (isVisible) {
        gsap.to(containerRef.current, { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.2)",
          delay: 0.05 // Small delay to ensure mount is complete
        });
      }
    }
  }, []); // Only run on mount

  // Handle menu appear/disappear animations
  useEffect(() => {
    if (containerRef.current) {
      if (isVisible) {
        // Appear animation
        gsap.to(containerRef.current, { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.2)"
        });
      } else {
        // Disappear animation
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -10,
          scale: 0.95,
          duration: 0.25,
          ease: "power2.in"
        });
      }
    }
  }, [isVisible]);

  // Handle content sliding animations
  useEffect(() => {
    if (activeSection && menuContent[activeSection]) {
      if (currentContent && currentContent !== activeSection && contentRef.current) {
        setIsAnimating(true);
        const direction = getSlideDirection(currentContent, activeSection);
        const slideDistance = 50;
        
        // Slide out current content
        gsap.to(contentRef.current, {
          x: direction * -slideDistance,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            setCurrentContent(activeSection);
            // Slide in new content from opposite direction
            gsap.fromTo(contentRef.current, 
              { x: direction * slideDistance, opacity: 0 },
              { 
                x: 0, 
                opacity: 1, 
                duration: 0.25,
                ease: "power2.out",
                onComplete: () => setIsAnimating(false)
              }
            );
          }
        });
      } else {
        setCurrentContent(activeSection);
        if (contentRef.current) {
          gsap.set(contentRef.current, { x: 0, opacity: 1 });
        }
      }
    }
  }, [activeSection, currentContent]);

  // Set default content if none exists
  const displayContent = currentContent || activeSection || 'agents';
  
  if (!menuContent[displayContent]) {
    return null;
  }

  const content = menuContent[displayContent];

  return (
    <div 
      className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Invisible bridge to prevent gap - only active when visible */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[580px] h-2 bg-transparent"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      ></div>
      
      <div 
        ref={containerRef}
        className="bg-dark-800 border border-white/15 rounded-xl p-1 w-[800px] shadow-xl overflow-hidden"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <div ref={contentRef} className="bg-dark-700 rounded-lg p-4 flex gap-5">
          {/* Left Section - Examples with Icon */}
          <div className="flex flex-col space-y-4 w-64">
            <div className="text-white/60 text-sm font-medium text-left pl-2">
              {content.leftLabel}
            </div>
            
            <div className="space-y-3">
              {content.examples.map((example, index) => (
                <div key={index} className="flex p-2 space-x-2 items-center rounded-lg hover:bg-white/10 transition-all duration-200">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {example.logo ? (
                      <img src={example.logo} alt={example.title} className="w-9 h-9 rounded" />
                    ) : (
                      <div className="text-white">
                        {content.icon}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start justify-center text-start -space-y-0.5">
                    <div className="text-sm font-medium text-white/90">
                      {example.title}
                    </div>
                    <div className="text-sm font-medium text-white/60 leading-relaxed line-clamp-1">
                      {example.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator Bar */}
          <div className="w-px bg-white/10 self-stretch"></div>

          {/* Right Section - 2x2 Grid */}
          <div className="flex-1">
            <div className="text-white/60 text-sm font-medium text-left mb-3 pl-2">
              {content.rightLabel}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {content.items.map((item, index) => (
                <button
                  key={`${displayContent}-${index}`}
                  onClick={() => navigateToPage(item.page)}
                  className="text-left px-2 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm focus:outline-none group"
                >
                  <div className="font-medium group-hover:text-white transition-colors text-sm">
                    {item.label}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5 group-hover:text-white/70 transition-colors">
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverMenu;