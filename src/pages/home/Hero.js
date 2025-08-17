import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
// import HeroModules from '../../diagrams/HeroModules';

const Hero = () => {
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);

  useEffect(() => {
    const splitText = (element) => {
      const text = element.textContent;
      element.innerHTML = '';
      
      text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.classList.add('char');
        element.appendChild(span);
      });
      
      return element.querySelectorAll('.char');
    };

    // Split the text into individual characters
    const firstNameChars = splitText(firstNameRef.current);
    const lastNameChars = splitText(lastNameRef.current);

    // Set initial state - characters invisible and transformed
    gsap.set([firstNameChars, lastNameChars], {
      opacity: 0,
      y: 100,
      rotationX: -90,
      transformOrigin: '50% 50%'
    });

    // Create timeline for the animation
    const tl = gsap.timeline({ delay: 0.5 });

    // Animate first name
    tl.to(firstNameChars, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      ease: "back.out(1.7)",
      stagger: {
        amount: 0.8,
        from: "start"
      }
    })
    // Animate last name with slight delay
    .to(lastNameChars, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      ease: "back.out(1.7)",
      stagger: {
        amount: 0.8,
        from: "start"
      }
    }, "-=0.6"); // Start 0.6 seconds before first name finishes

  }, []);

  return (
      <section
          id="home"
          className="hero min-h-screen pt-16 mx-10 flex items-center relative bg-dark-950 text-dark-50 border-t border-white/5 overflow-hidden"
      >
        <div className={"text-white opacity-10 text-[20rem] font-heading font-bold leading-none"}>
          <div ref={firstNameRef} className="leading-none">Nikolas</div>
          <div ref={lastNameRef} className="leading-none -ml-40">Larson</div>
        </div>


        {/* 3D Modules - Overlaying on the right side */}
        {/* <HeroModules/> */}
      </section>
  );
};

export default Hero;