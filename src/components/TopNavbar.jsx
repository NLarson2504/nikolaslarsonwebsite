import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Logo from "../downloads/NLLogo.svg";

function TopNavbar() {
  const navRef = useRef();

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  return (
    <nav 
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 bg-white/5 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="h-10 w-10" />
          <span className="text-white text-xl font-semibold">Nikolas Larson</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
          <a href="#projects" className="text-white/80 hover:text-white transition-colors">Projects</a>
          <a href="#experience" className="text-white/80 hover:text-white transition-colors">Experience</a>
          <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </nav>
  );
}

export default TopNavbar;