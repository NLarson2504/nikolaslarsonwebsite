import React from 'react';

const VisBackgroundComponent = ({ children, className = "" }) => {
  return (
    <div className={`vis-background-component relative overflow-hidden ${className}`}>
      {/* Diagonal line pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 4px,
            rgba(255, 255, 255, 0.3) 4px,
            rgba(255, 255, 255, 0.3) 5px
          )`
        }}
      />
      
      {/* Additional subtle lines for more frequency */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.4) 2px,
            rgba(255, 255, 255, 0.4) 2.5px
          )`
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default VisBackgroundComponent;