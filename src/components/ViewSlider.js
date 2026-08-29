import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ViewSlider.css';

/*
 * The home page's view switcher: gallery (the 3D wall) or list.
 *
 * Bottom-centred and free-floating, matching the nav's section control in
 * material so the two read as one family of chrome — the same glass, the same
 * measured thumb, just anchored to the opposite edge.
 *
 * It's a two-option slider rather than the single icon-button this started as.
 * Both destinations being visible means the control states what the choices
 * ARE, instead of asking you to infer the alternative from one icon; and it
 * gives the thumb something to travel across, which is what makes it read as
 * the same component as the nav above.
 */

const VIEWS = [
  { key: 'gallery', label: 'Gallery' },
  { key: 'list', label: 'List' },
];

/*
 * Icons drawn on a 16 viewBox so strokes land on whole pixels. aria-hidden —
 * each sits beside a real text label that already names the option.
 */
const GalleryIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <g fill="currentColor">
      <rect x="1" y="1" width="6.2" height="6.2" rx="1.2" />
      <rect x="8.8" y="1" width="6.2" height="6.2" rx="1.2" />
      <rect x="1" y="8.8" width="6.2" height="6.2" rx="1.2" />
      <rect x="8.8" y="8.8" width="6.2" height="6.2" rx="1.2" />
    </g>
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <g fill="currentColor">
      <rect x="1" y="3" width="3" height="1.6" rx="0.5" />
      <rect x="5.5" y="3" width="9.5" height="1.6" rx="0.5" />
      <rect x="1" y="7.2" width="3" height="1.6" rx="0.5" />
      <rect x="5.5" y="7.2" width="9.5" height="1.6" rx="0.5" />
      <rect x="1" y="11.4" width="3" height="1.6" rx="0.5" />
      <rect x="5.5" y="11.4" width="9.5" height="1.6" rx="0.5" />
    </g>
  </svg>
);

const ICONS = { gallery: GalleryIcon, list: ListIcon };

const ViewSlider = ({ view, onChange }) => {
  const optionRefs = useRef({});
  const [thumb, setThumb] = useState(null);

  /*
   * The thumb is measured off the active button rather than computed as half
   * the track — "Gallery" and "List" are different widths, so an even split
   * would leave the thumb too wide under one and too narrow under the other.
   * Same approach as the nav slider, for the same reason.
   *
   * Layout effect so the thumb is never painted a frame behind its label.
   */
  useLayoutEffect(() => {
    const measure = () => {
      const el = optionRefs.current[view];
      if (!el) return;
      setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();

    window.addEventListener('resize', measure);
    // Late-loading fonts change label widths without changing the view.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => window.removeEventListener('resize', measure);
  }, [view]);

  /*
   * Portalled to <body>, and this is load-bearing rather than tidiness.
   *
   * The GSAP smooth-scroll wrapper puts a translate3d on .scroll-content, and a
   * transformed ancestor becomes the containing block for position:fixed — so
   * rendered in place this pinned itself to the scrolled content and drifted
   * into the middle of the page instead of staying at the bottom of the
   * viewport. Escaping to <body> restores a real viewport anchor.
   */
  return createPortal(
    <div className="view-slider" role="group" aria-label="View mode">
      <div className="view-slider-track">
        <span
          className="view-slider-thumb"
          aria-hidden="true"
          /* Hidden until measured, so it never flashes at the wrong width. */
          style={
            thumb
              ? { left: `${thumb.left}px`, width: `${thumb.width}px` }
              : { opacity: 0 }
          }
        />
        {VIEWS.map((v) => {
          const Icon = ICONS[v.key];
          return (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              ref={(el) => {
                optionRefs.current[v.key] = el;
              }}
              className={`view-slider-option${
                view === v.key ? ' is-active' : ''
              }`}
              onClick={() => onChange(v.key)}
            >
              <Icon />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

export default ViewSlider;
