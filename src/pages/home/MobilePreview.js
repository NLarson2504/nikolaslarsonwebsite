import React from 'react';

const MobilePreview = () => {
  return (
    <section 
      id="mobile"
      className="mobile-preview h-[650px] flex items-center justify-center bg-dark-950 border-t border-white/5"
    >
      <div className="max-w-6xl px-4 text-center">
        <h2 className="text-4xl font-heading font-bold mb-6 text-dark-50">Mobile Development</h2>
        <p className="text-xl text-dark-300 mb-8 font-sans">
          Creating seamless mobile experiences across platforms
        </p>
      </div>
    </section>
  );
};

export default MobilePreview;