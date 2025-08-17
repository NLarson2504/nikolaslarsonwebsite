import React from 'react';
import PageTemplate from '../../components/PageTemplate';

const Agents = () => {
  return (
    <PageTemplate className="agents-page">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-heading font-bold text-center mb-12 text-dark-50">AI Agents</h1>
        <p className="text-xl text-center text-dark-300 mb-16 max-w-3xl mx-auto font-sans">
          Leveraging artificial intelligence to create intelligent automation solutions 
          that enhance productivity and drive innovation.
        </p>
      </div>
    </PageTemplate>
  );
};

export default Agents;