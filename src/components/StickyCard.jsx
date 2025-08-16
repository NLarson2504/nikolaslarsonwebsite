import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

function StickyCard() {
  const cardRef = useRef();

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { x: -100, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
    );
  }, []);

  return (
    <div className="sticky top-20 h-[calc(100vh-5rem)] p-6">
      <div 
        ref={cardRef}
        className="h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 flex flex-col justify-center items-center text-white shadow-2xl"
      >
        <div className="text-center space-y-6">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mx-auto flex items-center justify-center">
            <span className="text-4xl font-bold text-white">NL</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">Nikolas Larson</h2>
            <p className="text-xl text-white/80 mb-4">Software Engineer</p>
            <p className="text-white/60 leading-relaxed">
              Passionate about creating innovative solutions and building exceptional user experiences.
            </p>
          </div>
          
          <div className="flex flex-col space-y-3 w-full">
            <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300">
              View Resume
            </button>
            <button className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all duration-300">
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StickyCard;