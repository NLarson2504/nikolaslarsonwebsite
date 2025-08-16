import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function ModuleStack() {
  const containerRef = useRef();
  const moduleRefs = useRef([]);

  const modules = [
    {
      id: 1,
      title: "Agents",
      content: "AI automation systems for intelligent workflow optimization",
      accent: "border-blue-500"
    },
    {
      id: 2,
      title: "Mobile",
      content: "Cross-platform applications with React Native and Flutter",
      accent: "border-green-500"
    },
    {
      id: 3,
      title: "Design",
      content: "UI/UX design and creative solutions that bridge aesthetics with functionality",
      accent: "border-yellow-500"
    },
    {
      id: 4,
      title: "Academics",
      content: "Computer Science education and emerging technology research",
      accent: "border-purple-500"
    }
  ];

  useEffect(() => {
    // Initial stack animation - cards start stacked and animate in
    gsap.fromTo(moduleRefs.current,
      { 
        y: 100, 
        opacity: 0, 
        rotateX: -15
      },
      { 
        y: 0, 
        opacity: 1, 
        rotateX: 0,
        duration: 0.8, 
        stagger: 0.2, 
        ease: "power3.out",
        delay: 0.5
      }
    );

    // Hover spread animation
    moduleRefs.current.forEach((module, index) => {
      if (module) {
        const handleMouseEnter = () => {
          // Scale up the hovered card
          gsap.to(module, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });

          // Spread other cards up and down
          moduleRefs.current.forEach((otherModule, otherIndex) => {
            if (otherModule && otherIndex !== index) {
              const direction = otherIndex < index ? -1 : 1;
              const distance = Math.abs(otherIndex - index) * 20;
              
              gsap.to(otherModule, {
                y: direction * distance,
                duration: 0.3,
                ease: "power2.out"
              });
            }
          });
        };

        const handleMouseLeave = () => {
          // Return all cards to original position
          gsap.to(moduleRefs.current, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        };

        module.addEventListener('mouseenter', handleMouseEnter);
        module.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          module.removeEventListener('mouseenter', handleMouseEnter);
          module.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    });
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="stack space-y-4">
        {modules.map((module, index) => (
          <div
            key={module.id}
            ref={el => moduleRefs.current[index] = el}
            className={`layer bg-[#1b1c20] border border-[#2d2f35] ${module.accent} border-l-4 rounded-2xl p-6 cursor-pointer transform-gpu shadow-lg hover:shadow-2xl transition-shadow duration-300`}
            style={{ 
              width: '400px',
              minHeight: '120px'
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-3 font-mono">{module.title}</h3>
            <p className="text-gray-300 font-mono text-sm leading-relaxed">{module.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModuleStack;