import React from 'react';

const DesignPreview = () => {
  return (
    <section 
      className="design-preview h-[650px] flex items-center justify-center bg-dark-950 border-t border-white/5"
      data-scroll-section
    >
      <div className="max-w-6xl px-4 text-center" data-scroll data-scroll-speed="0.3">
        <h2 className="text-4xl font-heading font-bold mb-6 text-dark-50">Design</h2>
        <p className="text-xl text-dark-300 mb-8 font-sans">
          Crafting beautiful and functional user experiences
        </p>
      </div>
    </section>
  );
};

export default DesignPreview;