import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import WebPage from './WebPage';

const WebPageDiagram = ({ className = "" }) => {
  const containerRef = useRef();
  const webpagesRef = useRef([]);
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
    const webpages = webpagesRef.current.filter(Boolean);
    
    // Use the same spacing calculations as the layout
    const webpageHeight = 80;
    const verticalSpacing = 80; // Match the layout spacing to prevent overlap
    const effectiveWebpageHeight = webpageHeight * 0.8 + verticalSpacing; // Match layout calculation
    
    webpages.forEach((webpage, index) => {
      const col = parseInt(webpage.dataset.col);
      const row = parseInt(webpage.dataset.row);
      const isEvenColumn = col % 2 === 0;
      
      // Calculate travel distance using actual layout spacing
      const rows = Math.floor(dimensions.height / effectiveWebpageHeight) + 4;
      const totalDistance = rows * effectiveWebpageHeight;
      
      // Stagger webpages within each column
      const delay = -(row * (60 / rows)); // Distribute delays evenly across duration
      
      // Infinite scroll with proper spacing
      gsap.fromTo(webpage, {
        y: isEvenColumn ? totalDistance : -totalDistance
      }, {
        y: isEvenColumn ? -totalDistance : totalDistance,
        duration: 60, // Same slow speed as mobile
        repeat: -1,
        ease: "none",
        delay: delay
      });
    });

  }, [dimensions]);

  const createWebPagePattern = () => {
    const webpages = [];
    webpagesRef.current = []; // Reset refs
    
    // Webpage dimensions (scaled larger)
    const webpageWidth = 700; // Increased even more
    const webpageHeight = 80; // Increased even more
    
    // Calculate spacing - much closer together but prevent overlap
    const horizontalSpacing = 5; // Closer columns
    const verticalSpacing = 80; // Increased to prevent overlap during animation
    
    // Calculate how many webpages can fit - ONLY 2 COLUMNS
    const effectiveWebpageWidth = webpageWidth * 0.62 + horizontalSpacing; // Reduced scale to bring columns closer
    const effectiveWebpageHeight = webpageHeight * 0.8 + verticalSpacing;
    
    const cols = 2; // Fixed to 2 columns only
    const rows = Math.floor(dimensions.height / effectiveWebpageHeight) + 4; // +4 for infinite scroll buffer
    
    // Position the grid - moved left
    const totalWidth = (cols - 1) * effectiveWebpageWidth;
    const totalHeight = (rows - 1) * effectiveWebpageHeight;
    const offsetX = (dimensions.width - totalWidth) / 2 - 100; // Moved 100px left
    const offsetY = (dimensions.height - totalHeight) / 2 - effectiveWebpageHeight; // Start above viewport
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * effectiveWebpageWidth + offsetX;
        const y = row * effectiveWebpageHeight + offsetY;
        const index = row * cols + col;
        
        webpages.push(
          <div 
            key={`webpage-${row}-${col}`}
            ref={el => webpagesRef.current[index] = el}
            data-col={col}
            data-row={row}
            className="absolute"
            style={{
              transform: `translate(${x}px, ${y}px) scale(0.8)`,
              transformOrigin: 'center center'
            }}
          >
            <WebPage size="xlarge" />
          </div>
        );
      }
    }
    
    return webpages;
  };

  return (
    <div 
      ref={containerRef}
      className={`webpage-diagram relative -ml-96 w-full h-full ${className}`}
    >
      <div 
        className="relative w-full h-full overflow-visible"
        style={{
          transform: 'rotate(-15deg)',
          transformOrigin: 'center center'
        }}
      >
        {createWebPagePattern()}
      </div>
    </div>
  );
};

export default WebPageDiagram;