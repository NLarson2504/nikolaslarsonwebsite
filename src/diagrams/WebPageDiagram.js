import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WebPage from './WebPage';

gsap.registerPlugin(ScrollTrigger);

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
    
    if (webpages.length === 0) return;
    
    webpages.forEach((webpage, index) => {
      const col = parseInt(webpage.dataset.col);
      const row = parseInt(webpage.dataset.row);
      const isEvenColumn = col % 2 === 0;
      
      // Calculate staggered start position to maintain spacing illusion
      const baseStagger = (row * 250) + (col * 125); // Increased offsets for better spacing
      const direction = isEvenColumn ? 1 : -1; // Fixed: opposite directions for columns
      // Use same base stagger for both sides, only direction affects movement
      const staggerOffset = baseStagger;
      
      // Get the current CSS transform values to preserve layout positioning
      const currentTransform = webpage.style.transform;
      
      // Set up parallax ScrollTrigger for each webpage
      gsap.set(webpage, { 
        willChange: "transform",
        force3D: true
      });
      
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        id: `webpage-parallax-${index}`,
        animation: gsap.fromTo(webpage, {
          transform: `${currentTransform} translateY(${staggerOffset}px)`
        }, {
          transform: `${currentTransform} translateY(${staggerOffset + (direction * -400)}px)`,
          ease: "none",
          force3D: true
        })
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.id && trigger.vars.id.startsWith('webpage-parallax')) {
          trigger.kill();
        }
      });
    };

  }, [dimensions]);

  const createWebPagePattern = () => {
    const webpages = [];
    webpagesRef.current = []; // Reset refs
    
    // Fixed number of webpages for better performance
    const cols = 2;
    const totalWebpages = 4; // Only 4 webpages total
    
    // Webpage dimensions
    const webpageWidth = 500;
    const webpageHeight = 300;
    const webpageScale = 0.8;
    const spacing = 150;
    
    // Center the grid
    const startX = (dimensions.width - (cols - 1) * (webpageWidth + spacing)) / 2 - 100;
    const startY = (dimensions.height - webpageHeight) / 2;
    
    for (let i = 0; i < totalWebpages; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = startX + col * (webpageWidth + spacing);
      const y = startY + row * (webpageHeight + spacing) - (row * 150); // Increased vertical stagger
      
      webpages.push(
        <div 
          key={`webpage-${i}`}
          ref={el => webpagesRef.current[i] = el}
          data-col={col}
          data-row={row}
          className="absolute"
          style={{
            transform: `translate(${x}px, ${y}px) scale(${webpageScale})`,
            transformOrigin: 'center center'
          }}
        >
          <WebPage size="xlarge" imageIndex={i} />
        </div>
      );
    }
    
    return webpages;
  };

  return (
    <div 
      ref={containerRef}
      className={`webpage-diagram relative w-full h-full ${className}`}
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