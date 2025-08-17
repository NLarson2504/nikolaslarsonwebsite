import React from 'react';

const Hero = () => {
  return (
    <section 
      className="hero min-h-screen flex items-center justify-center bg-dark-950 text-dark-50 border-t border-white/5"
      data-scroll-section
    >
      <div className="text-center max-w-4xl px-4" data-scroll data-scroll-speed="0.5">
        <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-gradient-primary">
          Nikolas Larson
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-dark-300 font-sans">
          Full Stack Developer & Designer
        </p>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-dark-400 font-sans">
          Creating innovative digital experiences through code, design, and cutting-edge technology.
        </p>
      </div>
    </section>
  );
};

export default Hero;