import React, { useLayoutEffect, useRef, useState } from 'react';
import './NavSlider.css';

/*
 * The site's primary navigation: a glass segmented control.
 *
 * This began life inside the home page's wall as a FILTER — it dimmed the 3D
 * drum to one section without navigating. It now navigates instead, and is
 * shared by home / web / apps / agents so the same control persists across all
 * four rather than appearing only on home.
 *
 * The thumb marks the current route, so on any of those four pages the
 * selection is read from the URL rather than from local state. On routes not
 * listed here (contact, case studies, admin) no option matches and the thumb is
 * simply hidden — see `activeKey` below.
 */
const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'web', label: 'Web' },
  { key: 'apps', label: 'Apps' },
  { key: 'agents', label: 'Agents' },
];

const NavSlider = ({ currentPage, navigateToPage, onHoverSection }) => {
  const optionRefs = useRef({});
  const [thumb, setThumb] = useState(null);

  // Only the four routes above own a thumb position. Anything else (contact, a
  // case study) leaves this undefined, which hides the thumb rather than
  // stranding it under a stale option.
  const activeKey = NAV_ITEMS.some((i) => i.key === currentPage)
    ? currentPage
    : null;

  /*
   * The thumb is MEASURED off the active button rather than computed as an even
   * 1/n of the track.
   *
   * An even pitch assumes every label is the same width. They aren't — "Agents"
   * is the widest by a clear margin, so forcing it into an average-sized quarter
   * left it overflowing its own box: crowded against the track's right edge, and
   * wider than the thumb meant to sit under it. Reading offsetLeft/offsetWidth
   * back off the real element keeps the thumb exactly under whichever label is
   * selected, whatever that label happens to be.
   *
   * Layout effect, not a plain effect: this runs before paint, so the thumb is
   * never seen a frame behind the label it belongs under.
   */
  useLayoutEffect(() => {
    if (!activeKey) {
      setThumb(null);
      return undefined;
    }

    const measure = () => {
      const el = optionRefs.current[activeKey];
      if (!el) return;
      setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();

    window.addEventListener('resize', measure);
    // Fonts landing late change the label widths without changing the route, so
    // re-measure once they're ready. `document.fonts` is absent in older
    // browsers; the initial measure still holds there, against the fallback face.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => window.removeEventListener('resize', measure);
  }, [activeKey]);

  return (
    <nav className="nav-slider" aria-label="Sections">
      <div className="nav-slider-track">
        <span
          className="nav-slider-thumb"
          aria-hidden="true"
          /* Hidden until measured, so it never flashes at the wrong width — and
             hidden entirely on routes with no matching option. */
          style={
            thumb
              ? { left: `${thumb.left}px`, width: `${thumb.width}px` }
              : { opacity: 0 }
          }
        />
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-current={activeKey === item.key ? 'page' : undefined}
            ref={(el) => {
              optionRefs.current[item.key] = el;
            }}
            className={`nav-slider-option${
              activeKey === item.key ? ' is-active' : ''
            }`}
            onClick={() => navigateToPage(item.key)}
            /* Drives the section hover-menu. Home is excluded: it has no
               dropdown, so hovering it should close whatever is open rather
               than leaving the previous section's panel up. */
            onMouseEnter={() =>
              onHoverSection && onHoverSection(item.key === 'home' ? null : item.key)
            }
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavSlider;
