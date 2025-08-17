import React from 'react';

const AgentsPreview = () => {
  return (
    <section 
      id="agents"
      className="agents-preview h-[650px] flex items-center justify-center bg-dark-950 border-t border-white/5"
    >
      <div className="max-w-6xl px-4 text-center">
        <h2 className="text-4xl font-heading font-bold mb-6 text-dark-50">AI Agents</h2>
        <p className="text-xl text-dark-300 mb-8 font-sans">
          Building intelligent automation and AI-powered solutions
        </p>
      </div>
    </section>
  );
};

export default AgentsPreview;