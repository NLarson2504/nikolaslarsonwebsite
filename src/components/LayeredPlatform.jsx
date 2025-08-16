import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

function LayeredPlatform() {
  const containerRef = useRef();
  const layerRefs = useRef([]);
  const timelineRef = useRef();
  const [selectedLayer, setSelectedLayer] = useState(0);

  const layers = [
    {
      id: 0,
      title: "Agents",
      icon: "🤖",
      elements: ["AI Systems", "Neural Networks", "Machine Learning", "Automation", "Bot Development", "Logic Processing"]
    },
    {
      id: 1,
      title: "Mobile",
      icon: "📱",
      elements: ["iOS Development", "Android Development", "React Native", "Flutter", "Cross-Platform", "Mobile UI/UX"]
    },
    {
      id: 2,
      title: "Design",
      icon: "🎨",
      elements: ["UI/UX Design", "Figma", "Prototyping", "Visual Design", "Design Systems", "User Research"]
    },
    {
      id: 3,
      title: "Academic",
      icon: "🎓",
      elements: ["Computer Science", "Research Papers", "Algorithm Theory", "Data Analysis", "Academic Writing", "Knowledge Base"]
    }
  ];

  useEffect(() => {
    initializeLayers();
  }, []);

  const initializeLayers = () => {
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        gsap.set(layer, {
          x: 0,
          y: index * 80,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          transformOrigin: "center center",
          transformStyle: "preserve-3d"
        });
      }
    });
  };

  const animateExplode = () => {
    const tl = gsap.timeline();
    
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        const angle = (index * 90) * (Math.PI / 180);
        const radius = 150;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        tl.to(layer, {
          x: x,
          y: y,
          rotationZ: index * 90,
          duration: 1,
          ease: "power2.out"
        }, index * 0.1);
      }
    });
    
    timelineRef.current = tl;
  };

  const animateStack = () => {
    const tl = gsap.timeline();
    
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        tl.to(layer, {
          x: 0,
          y: index * 80,
          rotationZ: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out"
        }, index * 0.1);
      }
    });
    
    timelineRef.current = tl;
  };

  const animateRotate = () => {
    gsap.to(containerRef.current, {
      rotationY: "+=360",
      duration: 2,
      ease: "power2.inOut"
    });
  };

  const animateWave = () => {
    const tl = gsap.timeline();
    
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        tl.to(layer, {
          y: (index * 80) - 50,
          duration: 0.3,
          ease: "power2.out",
          yoyo: true,
          repeat: 1
        }, index * 0.1);
      }
    });
    
    timelineRef.current = tl;
  };

  const renderLayerContent = (layer, isSelected) => {
    return (
      <div className="layer-visual flex flex-col space-y-4 h-full justify-center px-4">
        <h4 className="text-lg font-bold text-white mb-2">{layer.title}</h4>
        <div className="flex flex-col space-y-4">
          {layer.elements.map((element, i) => (
            <div 
              key={i} 
              className="w-full h-20 relative"
            >
              {/* Main Card Section */}
              <div 
                className={`w-full h-16 relative rounded-lg transition-all ${
                  isSelected 
                    ? 'bg-blue-600/20 border border-blue-400/40 hover:bg-blue-600/30' 
                    : 'bg-[#1e1e1e] border border-white/10 hover:bg-[#2e2e2e]'
                } cursor-pointer`}
              >
                <div className="p-3 flex items-center h-full">
                  <div className={`p-2 h-fit w-fit rounded-lg mr-3 ${
                    isSelected ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    <div className={`w-4 h-4 rounded-sm ${
                      isSelected ? 'bg-blue-400' : 'bg-white/40'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{element}</div>
                    <div className="text-xs text-white/50">Module</div>
                  </div>
                </div>
              </div>

              {/* Bottom Depth Section */}
              <div className={`overflow-hidden w-full h-4 rounded-b-lg flex items-center space-x-2 ${
                isSelected 
                  ? 'bg-blue-800/30 border-x border-b border-blue-400/20' 
                  : 'bg-[#1a1a1a] border-x border-b border-white/10'
              }`}>
                <div className="w-2 h-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="flex-1 h-full flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                      isSelected ? 'bg-blue-400' : 'bg-white/40'
                    }`} />
                    <span className="text-xs text-white/30">Active</span>
                  </div>
                </div>
                <div className="w-2 h-full bg-gradient-to-l from-white/10 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="layered-platform-container w-full h-screen flex items-center justify-center relative">
      {/* Control Buttons */}
      <div className="controls absolute top-6 right-6 flex space-x-3 z-20">
        <button 
          onClick={animateExplode}
          className="control-btn bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          Explode
        </button>
        <button 
          onClick={animateStack}
          className="control-btn bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          Stack
        </button>
        <button 
          onClick={animateRotate}
          className="control-btn bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          Rotate
        </button>
        <button 
          onClick={animateWave}
          className="control-btn bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          Wave
        </button>
      </div>

      {/* 3D Container */}
      <div 
        ref={containerRef}
        className="platform-container relative"
        style={{
          width: '800px',
          height: '600px',
          transformStyle: 'preserve-3d',
          perspective: '1200px'
        }}
      >
        {layers.map((layer, index) => {
          const isSelected = selectedLayer === index;
          return (
            <div
              key={layer.id}
              ref={el => layerRefs.current[index] = el}
              className="layer absolute cursor-pointer transform-gpu"
              style={{
                width: '450px',
                height: '280px',
                left: '50%',
                top: '50%',
                marginLeft: '-225px',
                marginTop: '-140px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(40deg) rotateY(-20deg) rotateZ(5deg)`,
                zIndex: layers.length - index
              }}
              onClick={() => setSelectedLayer(index)}
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  y: (index * 80) - 10,
                  rotateX: 35,
                  rotateY: -15,
                  rotateZ: 3,
                  duration: 0.3,
                  ease: "power2.out"
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  y: index * 80,
                  rotateX: 40,
                  rotateY: -20,
                  rotateZ: 5,
                  duration: 0.3,
                  ease: "power2.out"
                });
              }}
            >
              {/* Main Layer Face */}
              <div 
                className={`layer-face absolute inset-0 rounded-2xl ${
                  isSelected 
                    ? 'bg-blue-600/80 border-blue-400' 
                    : 'bg-gray-800/90 border-gray-600'
                } border-2 backdrop-blur-md shadow-2xl`}
                style={{
                  transform: 'translateZ(30px)'
                }}
              >
                {/* Layer Content */}
                <div className="layer-content h-full w-full p-6 relative overflow-hidden">
                  {renderLayerContent(layer, isSelected)}
                </div>
              </div>

              {/* Card Shadow/Depth Effect */}
              <div 
                className={`absolute inset-0 rounded-2xl ${
                  isSelected ? 'bg-blue-900/60' : 'bg-gray-900/60'
                }`}
                style={{
                  transform: 'translateZ(-8px) translateY(8px) translateX(8px)',
                  filter: 'blur(1px)'
                }}
              />
              
              {/* Bottom Thickness - Better Integration */}
              <div 
                className={`absolute left-2 right-2 bottom-0 h-8 ${
                  isSelected ? 'bg-blue-900/90' : 'bg-gray-950/90'
                } rounded-b-xl`}
                style={{
                  transform: 'rotateX(-85deg) translateZ(-2px)',
                  transformOrigin: 'bottom'
                }}
              />

              {/* Right Thickness - Better Integration */}
              <div 
                className={`absolute top-2 bottom-2 right-0 w-8 ${
                  isSelected ? 'bg-blue-950/90' : 'bg-black/90'
                } rounded-r-xl`}
                style={{
                  transform: 'rotateY(85deg) translateZ(-2px)',
                  transformOrigin: 'right'
                }}
              />

              {/* Layer Label */}
              <div 
                className="layer-label absolute text-white font-bold text-lg"
                style={{
                  left: '-120px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  transformOrigin: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {layer.title}
              </div>

              {/* Layer Icon */}
              <div 
                className={`layer-icon absolute rounded-lg flex items-center justify-center text-2xl ${
                  isSelected ? 'bg-blue-500/30' : 'bg-white/20'
                }`}
                style={{
                  width: '30px',
                  height: '30px',
                  left: '-60px',
                  top: '20px'
                }}
              >
                {layer.icon}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default LayeredPlatform;