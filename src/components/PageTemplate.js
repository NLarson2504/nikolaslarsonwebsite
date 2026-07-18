import React from 'react';

const PageTemplate = ({ children, className = "" }) => {
  return (
    <div className={`bg-dark-950 border-t border-white/5 ${className}`}>
      {children}
    </div>
  );
};

export default PageTemplate;