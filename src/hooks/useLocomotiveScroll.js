import { useEffect, useRef } from 'react';
import LocomotiveScroll from 'locomotive-scroll';

const useLocomotiveScroll = () => {
  const scrollRef = useRef(null);
  const locomotiveScrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    // Initialize Locomotive Scroll with proper settings
    locomotiveScrollRef.current = new LocomotiveScroll({
      el: scrollRef.current,
      smooth: true,
      multiplier: 0.8,
      class: 'is-revealed',
      scrollbarContainer: false,
      smartphone: {
        smooth: true
      },
      tablet: {
        smooth: true
      }
    });

    // Update scroll on window resize
    const handleResize = () => {
      if (locomotiveScrollRef.current) {
        locomotiveScrollRef.current.update();
      }
    };

    // Update on load
    const handleLoad = () => {
      if (locomotiveScrollRef.current) {
        locomotiveScrollRef.current.update();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleLoad);

    // Force update after a short delay
    setTimeout(() => {
      if (locomotiveScrollRef.current) {
        locomotiveScrollRef.current.update();
      }
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleLoad);
      if (locomotiveScrollRef.current) {
        locomotiveScrollRef.current.destroy();
      }
    };
  }, []);

  return { scrollRef, locomotiveScroll: locomotiveScrollRef.current };
};

export default useLocomotiveScroll;