import Resume from '../downloads/Nikolas-Larson-Resume.pdf'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

function Hero() {
  const titleRefs = useRef([]);
  const buttonsRef = useRef();

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(titleRefs.current, 
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
    )
    .fromTo(buttonsRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.3"
    );
  }, []);

  const handleNavClick = (anchor) => {
    const section = document.querySelector(anchor);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
      <div className="w-full h-screen flex flex-col px-8 space-y-8">
          {/* Header */}
          <div 
            ref={el => titleRefs.current[0] = el}
            className="text-6xl md:text-8xl font-bold text-white uppercase"
          >
              Software Engineer
          </div>
          <div 
            ref={el => titleRefs.current[1] = el}
            className="text-6xl md:text-8xl font-bold text-white uppercase"
          >
              X
          </div>
          <div 
            ref={el => titleRefs.current[2] = el}
            className="text-6xl md:text-8xl font-bold text-white uppercase"
          >
              Student
          </div>

          {/* Buttons */}
          <div ref={buttonsRef} className="flex space-x-4 flex-grow items-end md:pb-28 pb-48">
              <a
                  href={Resume} // Replace with the actual path to your resume file
                  download="Nikolas-Larson-Resume.pdf" // Optional: Customize the downloaded file name
                  className="h-fit px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white text-lg font-medium hover:bg-white/20 transition-all shadow-lg"
              >
                  Download Resume
              </a>
              <a
                  onClick={() => handleNavClick("#contact")}
                  className="h-fit px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white text-lg font-medium hover:bg-white/20 transition-all shadow-lg cursor-pointer"
              >
                  Contact
              </a>
          </div>
      </div>
  );
}

export default Hero;
