import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import imagePreloader from '../utils/imagePreloader';

gsap.registerPlugin(ScrollTrigger);

const HorizontalCarousel = ({ className = "" }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const progressRef = useRef(null);
  const [images, setImages] = useState([]);
  const [showProgress, setShowProgress] = useState(true);
  const [isCarouselActive, setIsCarouselActive] = useState(false);

  // Load images from preloader
  useEffect(() => {
    const loadImages = () => {
      const webImages = imagePreloader.getWebImages();
      if (webImages.length > 0) {
        setImages(webImages);
      }
    };

    if (imagePreloader.areImagesLoaded()) {
      loadImages();
    } else {
      imagePreloader.preloadAllImages().then(() => {
        loadImages();
      });
    }
  }, []);

  // Set up intersection observer to detect when carousel is in view
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setIsCarouselActive(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Manage scroll behavior when carousel is active
  useEffect(() => {
    // We'll rely on ScrollTrigger's pinning instead of manual scroll prevention
    // This works better with GSAP's smooth scroll implementation
    if (isCarouselActive) {
      // Add a class to indicate carousel is active for any external smooth scroll systems
      document.documentElement.classList.add('carousel-active');
    } else {
      document.documentElement.classList.remove('carousel-active');
    }

    return () => {
      document.documentElement.classList.remove('carousel-active');
    };
  }, [isCarouselActive]);

  // Set up GSAP horizontal scroll and center highlighting
  useEffect(() => {
    if (!containerRef.current || !trackRef.current || images.length === 0) return;

    const container = containerRef.current;
    const track = trackRef.current;
    const items = itemRefs.current.filter(Boolean);

    // Calculate total scroll distance
    const itemWidth = 400; // Width of each item
    const itemSpacing = 40; // Gap between items
    const totalWidth = (itemWidth + itemSpacing) * images.length - itemSpacing;
    const containerWidth = container.offsetWidth;
    const scrollDistance = totalWidth - containerWidth;

    // Create horizontal scroll animation
    const horizontalScroll = gsap.to(track, {
      x: -scrollDistance,
      ease: "none",
    });

    // Calculate the scroll distance needed to view all items
    // We need enough scroll distance to move through the entire carousel
    const totalScrollNeeded = Math.max(scrollDistance * 2, window.innerHeight * images.length * 0.8);
    
    console.log(`Carousel Debug: ${images.length} images, scrollDistance: ${scrollDistance}, totalScrollNeeded: ${totalScrollNeeded}`);
    
    // Create ScrollTrigger for horizontal scroll with complete lock
    const scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${totalScrollNeeded}`,
      scrub: 0.5, // Slightly faster scrub for smoother interaction
      pin: true,
      pinSpacing: true, // Allow proper spacing after pin
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: horizontalScroll,
      markers: true, // Set to true for debugging
      normalizeScroll: true, // Better compatibility with custom smooth scroll
      onStart: () => {
        console.log("Carousel pinning started");
        setIsCarouselActive(true);
      },
      onUpdate: (self) => {
        // Only allow forward scrolling (left movement)
        const progress = Math.max(0, Math.min(1, self.progress));
        const currentOffset = progress * scrollDistance;
        const centerPosition = containerWidth / 2;
        
        // Keep carousel active throughout the entire scroll
        if (progress < 1 && !isCarouselActive) {
          setIsCarouselActive(true);
        }
        
        // Update progress bar
        if (progressRef.current) {
          gsap.set(progressRef.current, {
            scaleX: progress,
            transformOrigin: "left center"
          });
        }
        
        items.forEach((item, index) => {
          if (!item) return;
          
          const itemPosition = (itemWidth + itemSpacing) * index;
          const itemCenter = itemPosition + itemWidth / 2;
          const distanceFromCenter = Math.abs(currentOffset + itemCenter - centerPosition);
          
          // Calculate scale and opacity based on distance from center
          const maxDistance = itemWidth;
          const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
          const scale = 1 + (0.2 * (1 - normalizedDistance)); // Scale from 1 to 1.2
          const opacity = 0.6 + (0.4 * (1 - normalizedDistance)); // Opacity from 0.6 to 1
          const blur = normalizedDistance * 2; // Blur from 0 to 2px
          
          gsap.set(item, {
            scale: scale,
            opacity: opacity,
            filter: `blur(${blur}px)`,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      },
      onComplete: () => {
        // Carousel is complete, user can now scroll normally
        setShowProgress(false);
        console.log("Carousel animation complete");
      },
      onLeave: () => {
        // Only allow normal scrolling when user leaves the carousel section
        setIsCarouselActive(false);
        console.log("Left carousel section - normal scrolling enabled");
      }
    });

    // Set initial styles for items
    items.forEach((item, index) => {
      gsap.set(item, {
        opacity: index === 0 ? 1 : 0.6,
        scale: index === 0 ? 1.2 : 1,
        filter: index === 0 ? "blur(0px)" : "blur(2px)"
      });
    });

    return () => {
      if (scrollTrigger) {
        scrollTrigger.kill();
      }
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, [images]);

  if (images.length === 0) {
    return (
      <div className={`horizontal-carousel h-96 flex items-center justify-center ${className}`}>
        <div className="text-white/50">Loading images...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`horizontal-carousel h-screen w-full overflow-hidden relative bg-dark-950 flex items-center justify-start ${className}`}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Track containing all items */}
      <div 
        ref={trackRef}
        className="flex gap-10 h-full items-center pl-32"
        style={{ width: `${(400 + 40) * images.length + 320}px` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            ref={el => itemRefs.current[index] = el}
            className="carousel-item flex-shrink-0 relative"
            style={{ width: '400px', height: '250px' }}
          >
            {/* Web page frame */}
            <div className="w-full h-full bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-white/10">
              {/* Browser bar */}
              <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 flex-1 h-4 bg-gray-700 rounded"></div>
              </div>
              
              {/* Image content */}
              <div className="flex-1 overflow-hidden">
                <img 
                  src={image} 
                  alt={`Design project ${index + 1}`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Glow effect for centered item */}
            <div className="absolute inset-0 rounded-lg opacity-0 pointer-events-none transition-opacity duration-300 shadow-[0_0_30px_rgba(59,130,246,0.5)]"></div>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="text-white/60 text-sm mb-3 font-sans">Scroll to explore portfolio</div>
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              ref={progressRef}
              className="h-full bg-white/80 rounded-full origin-left"
              style={{ transform: 'scaleX(0)' }}
            ></div>
          </div>
        </div>
      )}

      {/* Gradient overlays for edge fade effect */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-dark-950 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-dark-950 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default HorizontalCarousel;