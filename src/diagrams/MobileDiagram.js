import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Phone from './Phone';

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
    
    // Use the same spacing calculations as the layout for seamless infinite scroll
    const phoneWidth = 192;
    const phoneHeight = 400;
    const horizontalSpacing = Math.min(phoneWidth, phoneHeight) * 0.1;
    const verticalSpacing = Math.min(phoneWidth, phoneHeight) * 0.05;
    const effectivePhoneHeight = phoneHeight * 0.7 + verticalSpacing; // Must match the CSS scale(0.7)
    
    phones.forEach((phone, index) => {
      const col = parseInt(phone.dataset.col);
      const row = parseInt(phone.dataset.row);
      const isEvenColumn = col % 2 === 0;
      
      // Calculate travel distance using actual layout spacing for perfect infinite loop
      const rows = Math.floor(dimensions.height / effectivePhoneHeight) + 4;
      const totalDistance = rows * effectivePhoneHeight;
      
      // Stagger phones within each column
      const delay = -(row * (60 / rows)); // Distribute delays evenly across duration
      
      // Infinite scroll with proper spacing
      gsap.fromTo(phone, {
        y: isEvenColumn ? totalDistance : -totalDistance
      }, {
        y: isEvenColumn ? -totalDistance : totalDistance,
        duration: 60, // Same slow speed as web pages
        repeat: -1,
        ease: "none",
        delay: delay
      });
    });

  }, [dimensions]);

  const createPhonePattern = () => {
    const phones = [];
    phonesRef.current = []; // Reset refs
    
    // Phone dimensions (scaled)
    const phoneWidth = 192;
    const phoneHeight = 400;
    
    // Calculate spacing - tighter spacing for closer phones
    const horizontalSpacing = Math.min(phoneWidth, phoneHeight) * 0.1;
    const verticalSpacing = Math.min(phoneWidth, phoneHeight) * 0.05; // Reduced for closer spacing
    
    // Calculate how many phones can fit
    const effectivePhoneWidth = phoneWidth * 0.7 + horizontalSpacing;
    const effectivePhoneHeight = phoneHeight * 0.7 + verticalSpacing;
    
    const cols = Math.floor(dimensions.width / effectivePhoneWidth) + 2;
    const rows = Math.floor(dimensions.height / effectivePhoneHeight) + 4; // +4 for infinite scroll buffer
    
    // Center the grid
    const totalWidth = (cols - 1) * effectivePhoneWidth;
    const totalHeight = (rows - 1) * effectivePhoneHeight;
    const offsetX = (dimensions.width - totalWidth) / 2;
    const offsetY = (dimensions.height - totalHeight) / 2 - effectivePhoneHeight; // Start above viewport
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * effectivePhoneWidth + offsetX;
        const y = row * effectivePhoneHeight + offsetY;
        const index = row * cols + col;
        
        phones.push(
          <div 
            key={`phone-${row}-${col}`}
            ref={el => phonesRef.current[index] = el}
            data-col={col}
            data-row={row}
            className="absolute"
            style={{
              transform: `translate(${x}px, ${y}px) scale(0.7)`,
              transformOrigin: 'center center'
            }}
          >
            <Phone size="promax15" />
          </div>
        );
      }
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