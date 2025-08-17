import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import MobileDiagram from '../../diagrams/MobileDiagram';

const Mobile = () => {
  return (
    <PageTemplate className="mobile-page">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-heading font-bold text-center mb-12 text-dark-50">Mobile Development</h1>
        <p className="text-xl text-center text-dark-300 mb-16 max-w-3xl mx-auto font-sans">
          Creating exceptional mobile experiences that engage users and drive business growth 
          across iOS and Android platforms.
        </p>
        
        {/* Mobile Portfolio Gallery */}
        <div className="flex justify-center mb-20">
          <MobileDiagram className="w-full max-w-4xl" />
        </div>
      </div>
    </PageTemplate>
  );
};

export default Mobile;