import React from 'react';
import PageTemplate from '../../components/PageTemplate';

const Design = () => {
  return (
    <PageTemplate className="design-page">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-heading font-bold text-center mb-12 text-dark-50">Design</h1>
        <p className="text-xl text-center text-dark-300 mb-16 max-w-3xl mx-auto font-sans">
          Crafting beautiful, functional, and user-centered designs that solve problems 
          and create meaningful experiences.
        </p>
      </div>
    </PageTemplate>
  );
};

export default Design;