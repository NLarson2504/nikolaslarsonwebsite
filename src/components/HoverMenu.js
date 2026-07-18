import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import useTopProjects from '../hooks/useTopProjects';

const HoverMenu = ({ activeSection, navigateToPage, isVisible }) => {
  const [currentContent, setCurrentContent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Top-2 highest-priority projects per section, live from Firestore.
  const { topBySection } = useTopProjects(2);

  const navOrder = ['agents', 'apps', 'web'];

  // Static labels + right-column links; the `examples` are injected live below.
  const menuMeta = {
    agents: {
      leftLabel: 'Agents',
      rightLabel: 'Implementations',
      items: [
        { label: 'Conversational AI', page: 'agents#chatai', description: 'Chat-based solutions' },
        { label: 'Task Automation', page: 'agents#actionai', description: 'AI workflows' },
        { label: 'Custom Models', page: 'agents#assistants', description: 'Tailored AI' },
        { label: 'Integration', page: 'agents#integration', description: 'Connect systems' },
      ],
    },
    apps: {
      leftLabel: 'Apps',
      rightLabel: 'More',
      items: [
        { label: 'iOS Apps', page: 'apps#ios', description: 'Native Swift' },
        { label: 'Android Apps', page: 'apps#android', description: 'Kotlin & Java' },
        { label: 'React Native', page: 'apps#reactnative', description: 'Cross-platform' },
        { label: 'App Store', page: 'apps#appstore', description: 'Optimization' },
      ],
    },
    web: {
      leftLabel: 'Web',
      rightLabel: 'More',
      items: [
        { label: 'UI/UX Design', page: 'web#design', description: 'User interfaces' },
        { label: 'Prototyping', page: 'web#prototyping', description: 'Interactive mockups' },
        { label: 'Design Systems', page: 'web#system', description: 'Frameworks' },
        { label: 'Brand Identity', page: 'web#branding', description: 'Visual development' },
      ],
    },
  };

  // Build the live `examples` (top-2 ranked projects) for each section.
  const menuContent = Object.fromEntries(
    navOrder.map((section) => [
      section,
      {
        ...menuMeta[section],
        examples: (topBySection[section] || []).map((p) => ({
          title: p.title,
          description: p.brand?.name || p.category || p.platform || '',
          logo: p.icon || p.brand?.logo || '',
          // Link to the case study when there is one; otherwise to the section
          // list so we never land on a "no case study" page. navigateToPage
          // prepends "/", so strip the leading slash from the path.
          page: (p.caseStudy ? p.href : `/${section}`).replace(/^\//, ''),
        })),
      },
    ])
  );

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
                <button
                  key={index} 
                  onClick={() => navigateToPage(example.page)}
                  className="flex p-2 space-x-2 items-center rounded-lg hover:bg-white/10 transition-all duration-200 w-full text-left focus:outline-none group"
                >
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
                    <div className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                      {example.title}
                    </div>
                    <div className="text-sm font-medium text-white/60 leading-relaxed line-clamp-1 group-hover:text-white/80 transition-colors">
                      {example.description}
                    </div>
                  </div>
                </button>
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