import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import HorizontalCarousel from '../../components/HorizontalCarousel';

const Design = () => {
  return (
    <PageTemplate className="design-page">
      {/* Full-page Horizontal Carousel */}
      <div className="carousel-section">
        <HorizontalCarousel />
      </div>
      
      {/* Content that appears after carousel ends */}
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-heading font-bold text-dark-50 mb-8">
            Design Philosophy
          </h2>
          <p className="text-xl text-dark-300 mb-12 font-sans">
            Every design decision is made with purpose, considering user needs, 
            business goals, and technical constraints to deliver exceptional experiences.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">User-Centered</h3>
              <p className="text-dark-300">
                Research-driven designs that prioritize user needs and behaviors 
                to create intuitive experiences.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">Responsive</h3>
              <p className="text-dark-300">
                Adaptive layouts that work seamlessly across all devices 
                and screen sizes.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">Performance</h3>
              <p className="text-dark-300">
                Optimized designs that load fast and provide smooth 
                interactions for better user satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Design;