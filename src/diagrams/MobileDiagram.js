import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Phone from './Phone';

gsap.registerPlugin(ScrollTrigger);

const MobileDiagram = ({ className = "" }) => {
  const containerRef = useRef();
  const phonesRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const phones = phonesRef.current.filter(Boolean);
    
    phones.forEach((phone, index) => {
      const col = parseInt(phone.dataset.col);
      const row = parseInt(phone.dataset.row);
      const isEvenColumn = col % 2 === 0;
      
      // Calculate staggered start position to maintain spacing illusion
      const baseStagger = (row * 200) + (col * 100); // Different offsets for rows and columns
      const direction = isEvenColumn ? -1 : 1; // Opposite directions for columns
      // Use same base stagger for both sides, only direction affects movement
      const staggerOffset = baseStagger;
      
      // Get the current CSS transform values to preserve layout positioning
      const currentTransform = phone.style.transform;
      
      // Set up parallax ScrollTrigger for each phone
      gsap.set(phone, { 
        willChange: "transform",
        force3D: true
      });
      
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        id: `mobile-parallax-${index}`,
        animation: gsap.fromTo(phone, {
          transform: `${currentTransform} translateY(${staggerOffset}px)`
        }, {
          transform: `${currentTransform} translateY(${staggerOffset + (direction * -300)}px)`,
          ease: "none",
          force3D: true
        })
      })
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.id && trigger.vars.id.startsWith('mobile-parallax')) {
          trigger.kill();
        }
      });
    };

  }, [dimensions]);

  const createPhonePattern = () => {
    const phones = [];
    phonesRef.current = []; // Reset refs
    
    // Fixed number of phones for better performance
    const cols = 2;
    const totalPhones = 6; // Only 6 phones total
    
    // Phone dimensions
    const phoneWidth = 192;
    const phoneHeight = 400;
    const phoneScale = 1.0;
    const spacing = 120;
    
    // Center the grid
    const startX = (dimensions.width - (cols - 1) * (phoneWidth + spacing)) / 2;
    const startY = (dimensions.height - phoneHeight) / 2;
    
    for (let i = 0; i < totalPhones; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = startX + col * (phoneWidth + spacing);
      const y = startY + row * (phoneHeight + spacing) - (row * 200); // Increased vertical stagger
      
      phones.push(
        <div 
          key={`phone-${i}`}
          ref={el => phonesRef.current[i] = el}
          data-col={col}
          data-row={row}
          className="absolute"
          style={{
            transform: `translate(${x}px, ${y}px) scale(${phoneScale})`,
            transformOrigin: 'center center'
          }}
        >
          <Phone size="promax15" imageIndex={i} />
        </div>
      );
    }
    
    return phones;
  };

  return (
    <div 
      ref={containerRef}
      className={`mobile-diagram relative w-full h-full ${className}`}
    >
      <div 
        className="relative w-full h-full overflow-visible"
        style={{
          transform: 'rotate(-15deg)',
          transformOrigin: 'center center'
        }}
      >
        {createPhonePattern()}
      </div>
    </div>
  );
};

export default MobileDiagram;