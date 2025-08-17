import React from 'react';
// import { gsap } from 'gsap';
// import HeroModules from '../../diagrams/HeroModules';

const Hero = () => {

  return (
      <section
          id="home"
          className="hero min-h-screen mt-10 mx-10 flex items-center relative bg-dark-950 text-dark-50 border-t border-white/5 overflow-hidden"
      >
        <div className={"text-white opacity-10 text-[20rem] font-heading font-bold leading-none"}>
          <div className="leading-none">Nikolas</div>
          <div className="leading-none -ml-40">Larson</div>
        </div>


        {/* 3D Modules - Overlaying on the right side */}
        {/* <HeroModules/> */}
      </section>
  );
};

export default Hero;