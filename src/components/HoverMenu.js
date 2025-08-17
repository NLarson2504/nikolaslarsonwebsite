import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const HoverMenu = ({ activeSection, navigateToPage, isVisible }) => {
  const [currentContent, setCurrentContent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  const navOrder = ['agents', 'mobile', 'design'];
  
  const menuContent = {
    agents: {
      title: "AI Agents",
      items: [
        { label: "Conversational AI", page: "agents", description: "Chat-based solutions" },
        { label: "Task Automation", page: "automation", description: "AI workflows" },
        { label: "Custom Models", page: "models", description: "Tailored AI" },
        { label: "Integration", page: "integration", description: "Connect systems" }
      ]
    },
    mobile: {
      title: "Mobile Development",
      items: [
        { label: "iOS Apps", page: "ios", description: "Native Swift" },
        { label: "Android Apps", page: "android", description: "Kotlin & Java" },
        { label: "React Native", page: "react-native", description: "Cross-platform" },
        { label: "App Store", page: "aso", description: "Optimization" }
      ]
    },
    design: {
      title: "Design & UX",
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
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[480px] h-2 bg-transparent"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      ></div>
      
      <div 
        ref={containerRef}
        className="bg-dark-900/95 backdrop-blur-md border border-white/20 rounded-lg p-4 w-[480px] shadow-xl overflow-hidden"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
      <div ref={contentRef}>
        <div className="text-white/90 text-sm font-semibold mb-3 text-center">
          {content.title}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {content.items.map((item, index) => (
            <button
              key={`${displayContent}-${index}`}
              onClick={() => navigateToPage(item.page)}
              className="text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm focus:outline-none group"
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
  );
};

export default HoverMenu;