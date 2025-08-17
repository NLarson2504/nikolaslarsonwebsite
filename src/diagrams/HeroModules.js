import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const ModuleCard = ({ delay = 0, title, icon, yPosition = 0 }) => {
  const moduleRef = useRef(null);
  const thickness = 40; // Extruded thickness in pixels

  useEffect(() => {
    const element = moduleRef.current;
    if (element) {
      gsap.fromTo(element, 
        { 
          x: 100, 
          opacity: 0, 
          rotationY: 25,
          rotationX: 10
        },
        { 
          x: 0, 
          opacity: 1, 
          rotationY: -15,
          rotationX: 5,
          duration: 1.2, 
          delay: delay,
          ease: "power3.out"
        }
      );

      const handleMouseEnter = () => {
        gsap.to(element, {
          duration: 0.4,
          rotationY: -5,
          rotationX: 0,
          z: 30,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          duration: 0.6,
          rotationY: -15,
          rotationX: 5,
          z: 0,
          ease: "power2.out"
        });
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [delay]);

  return (
    <div 
      ref={moduleRef}
      className="module-card w-48 h-32 absolute cursor-pointer"
      style={{
        transformStyle: 'preserve-3d',
        top: `${yPosition}px`,
        right: '0px',
        zIndex: 10
      }}
    >
      {/* Main front face */}
      <div 
        className="module-face-front absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4"
        style={{ transform: `translateZ(${thickness / 2}px)` }}
      >
        <div className="text-3xl mb-2 text-gray-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
          {title}
        </h3>
      </div>
      
      {/* Back face */}
      <div 
        className="module-face-back absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 rounded-lg"
        style={{ transform: `translateZ(-${thickness / 2}px) rotateY(180deg)` }}
      >
      </div>
      
      {/* Top face */}
      <div 
        className="module-face-top absolute bg-gradient-to-r from-gray-600 to-gray-800"
        style={{ 
          width: '192px', 
          height: `${thickness}px`,
          transform: `rotateX(90deg) translateZ(${thickness / 2}px)`,
          transformOrigin: 'top center'
        }}
      >
      </div>
      
      {/* Bottom face */}
      <div 
        className="module-face-bottom absolute bg-gradient-to-r from-gray-800 to-gray-950"
        style={{ 
          width: '192px', 
          height: `${thickness}px`,
          top: '128px',
          transform: `rotateX(-90deg) translateZ(-${thickness / 2}px)`,
          transformOrigin: 'bottom center'
        }}
      >
      </div>
      
      {/* Right face */}
      <div 
        className="module-face-right absolute bg-gradient-to-b from-gray-750 to-gray-900"
        style={{ 
          width: `${thickness}px`, 
          height: '128px',
          right: '0px',
          transform: `rotateY(90deg) translateZ(${thickness / 2}px)`,
          transformOrigin: 'right center'
        }}
      >
      </div>
      
      {/* Left face */}
      <div 
        className="module-face-left absolute bg-gradient-to-b from-gray-650 to-gray-850"
        style={{ 
          width: `${thickness}px`, 
          height: '128px',
          left: '0px',
          transform: `rotateY(-90deg) translateZ(${thickness / 2}px)`,
          transformOrigin: 'left center'
        }}
      >
      </div>
    </div>
  );
};

const HeroModules = () => {
  const containerRef = useRef(null);

  const modules = [
    { title: 'Agents', icon: '🤖', delay: 0.2 },
    { title: 'Mobile', icon: '📱', delay: 0.4 },
    { title: 'Design', icon: '🎨', delay: 0.6 },
    { title: 'Academics', icon: '🎓', delay: 0.8 }
  ];

  useEffect(() => {
    // Subtle floating animation for the entire container
    gsap.to(containerRef.current, {
      y: -5,
      duration: 4,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });
  }, []);

  return (
    <div 
      ref={containerRef}
      className="hero-modules-container absolute right-8 top-1/2 transform -translate-y-1/2 w-48 h-[600px]"
      style={{ 
        zIndex: 20,
        perspective: '1200px',
        perspectiveOrigin: 'center center'
      }}
    >
      {modules.map((module, index) => (
        <ModuleCard
          key={module.title}
          title={module.title}
          icon={module.icon}
          delay={module.delay}
          yPosition={index * 140}
        />
      ))}
    </div>
  );
};

export default HeroModules;