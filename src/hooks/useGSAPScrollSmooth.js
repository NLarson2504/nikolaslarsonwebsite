import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const useGSAPScrollSmooth = (currentPage) => {
  const scrollContainerRef = useRef(null);
  const scrollContentRef = useRef(null);
  const smoothScrollRef = useRef(null);
  const scrollDataRef = useRef({
    current: 0,
    target: 0,
    ease: 0.08,
    isScrolling: false,
    lastTime: 0
  });

  useEffect(() => {
    if (!scrollContainerRef.current || !scrollContentRef.current) return;

    const container = scrollContainerRef.current;
    const content = scrollContentRef.current;
    const scrollData = scrollDataRef.current;

    // Set up scroll container
    gsap.set(container, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    });

    // Calculate content height and set body height
    const updateHeight = () => {
      const contentHeight = content.scrollHeight;
      document.body.style.height = `${contentHeight}px`;
    };

    updateHeight();

    // Optimized smooth scroll with throttling
    const smoothScroll = (timestamp) => {
      const deltaTime = timestamp - scrollData.lastTime;
      
      // Throttle to ~60fps
      if (deltaTime < 16.67) {
        smoothScrollRef.current = requestAnimationFrame(smoothScroll);
        return;
      }
      
      scrollData.lastTime = timestamp;
      scrollData.target = window.pageYOffset;
      
      // Calculate difference
      const diff = scrollData.target - scrollData.current;
      
      // Only update if there's a meaningful difference
      if (Math.abs(diff) > 0.1) {
        scrollData.current += diff * scrollData.ease;
        
        // Use transform3d for hardware acceleration
        gsap.set(content, {
          transform: `translate3d(0, ${-scrollData.current}px, 0)`,
          force3D: true
        });
        
        scrollData.isScrolling = true;
      } else {
        // Snap to target when close enough
        if (scrollData.isScrolling) {
          scrollData.current = scrollData.target;
          gsap.set(content, {
            transform: `translate3d(0, ${-scrollData.current}px, 0)`,
            force3D: true
          });
          scrollData.isScrolling = false;
        }
      }

      smoothScrollRef.current = requestAnimationFrame(smoothScroll);
    };

    smoothScrollRef.current = requestAnimationFrame(smoothScroll);

    // Handle resize with debouncing
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHeight, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup
    return () => {
      if (smoothScrollRef.current) {
        cancelAnimationFrame(smoothScrollRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.body.style.height = '';
    };
  }, [currentPage]);

  return { scrollContainerRef, scrollContentRef };
};

export default useGSAPScrollSmooth;