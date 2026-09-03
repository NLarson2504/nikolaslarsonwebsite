import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import HoverMenu from './HoverMenu';
import NavSlider from './NavSlider';
import { useDetailBrand } from './DetailBrand';

/*
 * The section hover-menu is DISABLED for now.
 *
 * Hovering Web / Apps / Agents used to open a dropdown panel of that section's
 * top-2 projects (components/HoverMenu.js, fed live from Firestore by
 * hooks/useTopProjects). It's parked rather than deleted: flip this to true to
 * bring it back, and everything below — the open/visible state, the hover
 * handlers, the panel itself — is still wired for it.
 *
 * Worth revisiting once the nav settles. If it does come back, two things want
 * a second look: the panel was built against the old solid nav bar, so it needs
 * checking over the now-transparent one, and it anchored to three text links
 * rather than to a centred glass pill, so its horizontal origin will be off.
 */
const HOVER_MENU_ENABLED = false;

/*
 * How long the detail controls take to blur/slide in and out. Must match the
 * transition duration on .nav-back-orb / .nav-brand-mark in index.css — this
 * timer is what keeps them mounted long enough for the exit to be seen.
 */
const DETAIL_CHROME_MS = 340;

const TopNav = ({ currentPage, navigateToPage, showBack, onBack }) => {
  // Whose page you're on, published by the detail route (components/DetailBrand).
  const detailBrand = useDetailBrand();

  /*
   * The back orb and the brand mark animate in AND out, so they can't simply be
   * `{showBack && ...}` — that unmounts them the instant you leave, and an exit
   * animation on an unmounted node never runs.
   *
   * So mounting and visibility are tracked separately: `mountDetailChrome` keeps
   * them in the tree, `detailChromeIn` drives the class that plays the blur and
   * slide. On the way in, the two are set a frame apart so the browser has a
   * chance to paint the "out" state first and actually transition from it. On
   * the way out, unmounting waits for the transition to finish.
   */
  const [mountDetailChrome, setMountDetailChrome] = useState(showBack);
  const [detailChromeIn, setDetailChromeIn] = useState(showBack);

  useEffect(() => {
    if (showBack) {
      setMountDetailChrome(true);
      // Next frame, so the entry transition has an "out" state to start from.
      const raf = requestAnimationFrame(() => setDetailChromeIn(true));
      return () => cancelAnimationFrame(raf);
    }

    setDetailChromeIn(false);
    const timer = setTimeout(() => setMountDetailChrome(false), DETAIL_CHROME_MS);
    return () => clearTimeout(timer);
  }, [showBack]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerLine1Ref = useRef(null);
  const hamburgerLine2Ref = useRef(null);

  const handleNavClick = (page) => {
    navigateToPage(page);
  };

  const handleMobileNavClick = (page) => {
    navigateToPage(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Animate hamburger to X and back
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Transform to X - move lines to center and rotate
      gsap.to(hamburgerLine1Ref.current, {
        attr: { d: "M6 12h12" },
        rotation: 45,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
      gsap.to(hamburgerLine2Ref.current, {
        attr: { d: "M6 12h12" },
        rotation: -45,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
    } else {
      // Transform back to hamburger
      gsap.to(hamburgerLine1Ref.current, {
        attr: { d: "M6 9h12" },
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
      gsap.to(hamburgerLine2Ref.current, {
        attr: { d: "M6 15h12" },
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
        svgOrigin: "12 12"
      });
    }
  }, [isMobileMenuOpen]);

  const handleMouseEnter = () => {
    if (!HOVER_MENU_ENABLED) return;
    if (!hasEverOpened) {
      setHasEverOpened(true);
      setIsMenuOpen(true);
    }
    setIsMenuVisible(true);
  };

  const handleMouseLeave = () => {
    if (!HOVER_MENU_ENABLED) return;
    setIsMenuVisible(false);
    setActiveSection(null);
    // Keep menu mounted for smooth transitions
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999]">
      {/* Transparent on every route, with no bottom border. The bar used to go
          solid off the home page; now that its controls are themselves glass
          pills, a filled strip behind them just boxed in the glass — the pills
          carry their own blur, so they read against the page directly. */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-16">
            {/* Logo, plus — on a detail page only — a close mark and the
                brand whose page you're on. Same gate as the back orb
                (`showBack`), so the wordmark stands alone everywhere else.

                Reads as a breadcrumb: NL ✕ <brand>. The ✕ is separator and
                control at once — clicking anywhere in the cluster leaves the
                detail page, which is what the mark promises. */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <button
                onClick={() => handleNavClick('home')}
                /* The first-load intro flies its own NL to this exact element
                   and cross-fades onto it, so it needs to be findable from
                   outside the React tree — see components/LogoIntro. */
                data-nav-logo
                className="text-xl font-mark font-bold text-gradient-primary hover:opacity-80 transition-opacity focus:outline-none"
              >
                NL
              </button>

              {mountDetailChrome && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label={
                    detailBrand?.name ? `Close ${detailBrand.name}` : 'Close'
                  }
                  // Hidden from the tab order and the a11y tree while it's on
                  // its way out — it's still painted, but no longer a control.
                  aria-hidden={!detailChromeIn}
                  tabIndex={detailChromeIn ? undefined : -1}
                  className={`nav-brand-mark${detailChromeIn ? ' is-in' : ''}`}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="11"
                    height="11"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>

                  {/* The brand itself: its logo when there is one, its name as
                      a wordmark when there isn't. Absent while the project is
                      still loading — the ✕ appears immediately with the route,
                      and the brand fills in beside it. */}
                  {detailBrand &&
                    (detailBrand.logo ? (
                      <img
                        src={detailBrand.logo}
                        alt={detailBrand.name || ''}
                        className="w-6 h-6 rounded object-contain"
                      />
                    ) : (
                      <span className="font-sans text-sm font-medium text-white/80">
                        {detailBrand.name}
                      </span>
                    ))}
                </button>
              )}
            </div>

            {/* Centered navigation: the glass segmented control.
                This used to be three text links here plus a separate filter
                slider that existed only on home and dimmed the wall in place.
                They're now one control that navigates, shown on every route so
                it persists across home / web / apps / agents rather than
                appearing and disappearing. */}
            <div
              className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Inner wrapper stays `relative` so the HoverMenu has a
                  positioned ancestor to anchor to — the outer div is spending
                  its own position on the centring. */}
              <div className="relative flex items-center gap-2.5">
                {/* Back orb, sitting just left of the section pill. Shown only
                    on detail routes — App decides, from the path — and blurred
                    in and out with the brand mark on the left (see
                    mountDetailChrome above). */}
                {mountDetailChrome && (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back"
                    aria-hidden={!detailChromeIn}
                    tabIndex={detailChromeIn ? undefined : -1}
                    className={`nav-back-orb${detailChromeIn ? ' is-in' : ''}`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="15"
                      height="15"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 3.5 5.5 8l4.5 4.5" />
                    </svg>
                  </button>
                )}
                <NavSlider
                  currentPage={currentPage}
                  navigateToPage={handleNavClick}
                  onHoverSection={HOVER_MENU_ENABLED ? setActiveSection : undefined}
                />

                {/* Hover Menu — see HOVER_MENU_ENABLED above. */}
                {HOVER_MENU_ENABLED && isMenuOpen && (
                  <HoverMenu
                    activeSection={activeSection}
                    navigateToPage={navigateToPage}
                    isVisible={isMenuVisible}
                  />
                )}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="flex items-center">
              {/* Glass rather than a solid white pill, matching the wall's
                  section slider that sits beside it in this same nav. The
                  ground, hover and current states live in .nav-cta-glass
                  (index.css) because the lit-edge inset shadows can't be
                  expressed as Tailwind utilities. Rounded-full, not -lg, to
                  echo the slider's pill.

                  Vertical padding also comes from that class (height-matched to
                  the slider) — hence px-4 alone here rather than px-4 py-2, so
                  a utility and the class aren't setting the same property. */}
              <button 
                onClick={() => handleNavClick('contact')}
                className={`px-4 rounded-full font-sans text-sm font-medium text-white focus:outline-none nav-cta-glass${
                  currentPage === 'contact' ? ' is-current' : ''
                }`}
              >
                Contact
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-white opacity-25 transition-colors duration-200 focus:outline-none p-1"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    ref={hamburgerLine1Ref}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 9h12"
                  />
                  <path
                    ref={hamburgerLine2Ref}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 15h12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-page Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-[10000] md:hidden">
          {/* Heavy blur backdrop */}
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-xl"></div>
          
          {/* Menu content */}
          <div className="relative h-full flex flex-col items-center justify-center space-y-12">
            {/* Navigation links */}
            <nav className="flex flex-col items-center space-y-8">
              <button
                onClick={() => handleMobileNavClick('agents')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Agents
              </button>
              <button
                onClick={() => handleMobileNavClick('apps')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Apps
              </button>
              <button
                onClick={() => handleMobileNavClick('web')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Web
              </button>
              <button
                onClick={() => handleMobileNavClick('contact')}
                className="text-4xl font-medium text-white/90 hover:text-white transition-colors font-sans"
              >
                Contact
              </button>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;