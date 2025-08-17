import React from 'react';
import Phone from './Phone';

const MobileDiagram = ({ className = "" }) => {
  const createPhonePattern = () => {
    const phones = [];
    const cols = 3;
    const rows = 3;
    const phoneWidth = 256;
    const phoneHeight = 256;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * phoneWidth;
        const y = row * phoneHeight;
        phones.push(
          <div 
            key={`phone-${row}-${col}`}
            className="absolute opacity-60"
            style={{
              transform: `translate(${x}px, ${y}px) rotate(45deg) rotateX(30deg) scale(0.7)`,
              transformOrigin: 'center center'
            }}
          >
            <Phone size="large" />
          </div>
        );
      }
    }
    
    return phones;
  };

  return (
    <div className={`mobile-diagram relative w-full h-full -translate-y-20 translate-x-6 ${className}`}>
      <div className="relative w-full h-full overflow-visible">
        {createPhonePattern()}
      </div>
    </div>
  );
};

export default MobileDiagram;