import { useEffect, useRef } from 'react';
import LocomotiveScroll from 'locomotive-scroll';

const useLocomotiveScroll = (currentPage) => {
  const scrollRef = useRef(null);
  const locomotiveScrollRef = useRef(null);

  useEffect(() => {
    let resizeHandler, loadHandler, initTimer, updateTimer;

    // Destroy existing instance first
    if (locomotiveScrollRef.current) {
      locomotiveScrollRef.current.destroy();
      locomotiveScrollRef.current = null;
    }

    if (!scrollRef.current) return;

    // Small delay to ensure DOM is ready
    initTimer = setTimeout(() => {
      if (!scrollRef.current) return;

      try {
        // Initialize Locomotive Scroll with enhanced locomotive feel
        locomotiveScrollRef.current = new LocomotiveScroll({
          el: scrollRef.current,
          smooth: true,
          multiplier: 0.5,
          class: 'is-revealed',
          scrollbarContainer: false,
          inertia: 0.8,
          getSpeed: true,
          getDirection: true,
          smartphone: {
            smooth: true,
            inertia: 0.9
          },
          tablet: {
            smooth: true,
            inertia: 0.8
          }
        });

        // Update scroll on window resize
        resizeHandler = () => {
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.update();
          }
        };

        // Update on load
        loadHandler = () => {
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.update();
          }
        };

        window.addEventListener('resize', resizeHandler);
        window.addEventListener('load', loadHandler);

        // Force update after initialization
        updateTimer = setTimeout(() => {
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.update();
          }
        }, 100);
      } catch (error) {
        console.warn('Locomotive Scroll initialization failed:', error);
      }
    }, 50);

    // Cleanup
    return () => {
      if (initTimer) clearTimeout(initTimer);
      if (updateTimer) clearTimeout(updateTimer);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (loadHandler) window.removeEventListener('load', loadHandler);
      if (locomotiveScrollRef.current) {
        try {
          locomotiveScrollRef.current.destroy();
        } catch (error) {
          console.warn('Locomotive Scroll destroy failed:', error);
        }
        locomotiveScrollRef.current = null;
      }
    };
  }, [currentPage]);

  return { scrollRef, locomotiveScroll: locomotiveScrollRef.current };
};

export default useLocomotiveScroll;