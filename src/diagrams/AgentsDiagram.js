import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AgentCard from './AgentCard';

gsap.registerPlugin(ScrollTrigger);

/**
 * Agents home-preview visual: a rotated grid of little "pixel pal" terminal
 * cards that drift with a column-alternating scroll parallax — the same
 * treatment the Web (WebPageDiagram) and Apps (MobileDiagram) previews use, so
 * the three sections read as a set.
 */
const AgentsDiagram = ({ className = '' }) => {
  const containerRef = useRef();
  const cardsRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);

    // One vertical column of big cards that drifts up as the page scrolls, so a
    // single pal sits centered at a time and the next one rises into view.
    cards.forEach((card, index) => {
      const currentTransform = card.style.transform;
      gsap.set(card, { willChange: 'transform', force3D: true });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        id: `agents-parallax-${index}`,
        animation: gsap.fromTo(
          card,
          { transform: `${currentTransform} translateY(0px)` },
          {
            transform: `${currentTransform} translateY(-420px)`,
            ease: 'none',
            force3D: true,
          }
        ),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.id && trigger.vars.id.startsWith('agents-parallax')) {
          trigger.kill();
        }
      });
    };
  }, [dimensions]);

  const createCardPattern = () => {
    const cards = [];
    cardsRef.current = []; // reset refs

    // Only three pals — show them big, stacked in a single centered column.
    const totalCards = 3;
    const cardSize = 288; // 18rem square (matches AgentCard tile)
    const cardScale = 1.15;
    const verticalGap = 120;

    const startX = (dimensions.width - cardSize) / 2;
    // start the column a little low so the first card is centered and the rest
    // wait below to rise in on scroll
    const startY = (dimensions.height - cardSize) / 2;

    for (let i = 0; i < totalCards; i++) {
      const x = startX;
      const y = startY + i * (cardSize + verticalGap);

      cards.push(
        <div
          key={`agent-card-${i}`}
          ref={(el) => (cardsRef.current[i] = el)}
          className="absolute"
          style={{
            transform: `translate(${x}px, ${y}px) scale(${cardScale})`,
            transformOrigin: 'center center',
          }}
        >
          <AgentCard imageIndex={i} />
        </div>
      );
    }

    return cards;
  };

  return (
    <div
      ref={containerRef}
      className={`agents-diagram relative w-full h-full ${className}`}
    >
      <div
        className="relative w-full h-full overflow-visible"
        style={{
          transform: 'rotate(-15deg)',
          transformOrigin: 'center center',
        }}
      >
        {createCardPattern()}
      </div>
    </div>
  );
};

export default AgentsDiagram;
