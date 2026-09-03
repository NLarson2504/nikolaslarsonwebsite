import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import CaseStudyHeader from './CaseStudyHeader';
import SitePreview from './SitePreview';
import AppPreview from './AppPreview';
import CaseStudyStats from './CaseStudyStats';
import CaseStudyToc from './CaseStudyToc';
import CaseStudyBlock from './CaseStudyBlock';
import useFollowSticky from '../../hooks/useFollowSticky';
import useDetailReveal from '../../hooks/useDetailReveal';

/**
 * The single, reusable case study template shared by every project type
 * (agents / apps / web). Pages pass the joined project plus the back link;
 * everything visual lives here so there's one place to change the design.
 *
 * Layout: a centered reading column with a sticky "back" rail on the left and a
 * simple sticky table of contents on the right (both desktop-only).
 */
const CaseStudyLayout = ({ project, backTo, backLabel }) => {
  const caseStudy = project.caseStudy || {};
  const sections = caseStudy.sections || [];

  // The hero preview sits in a band wider than the reading column and wider
  // than the rest of the page. It shows the project's captured screenshot —
  // live iframe embedding was removed (see SitePreview), so the band needs an
  // image to be worth rendering at all.
  const featured = caseStudy.featuredImage || project.image;

  /*
   * App projects show a row of phone screenshots instead of one wide capture.
   *
   * They carry `screenshots` (two to four tall phone shots) and no `image`, so
   * the web preview had nothing landscape to show — a single phone screenshot
   * either stretched across the frame or sat as a thin strip in the middle of
   * it. AppPreview fills the same band with the screens laid out in a row.
   */
  const shots = project.screenshots || [];
  const isApp = project.type === 'app' && shots.length > 0;
  const showBand = isApp || Boolean(featured);

  // Native `position: sticky` can't work inside the site's GSAP smooth-scroll
  // transform, so the rails follow the eased scroll offset via JS instead.
  const tocRailRef = useFollowSticky({ top: 112 });

  /*
   * Entrance choreography. Keyed on the slug so each project plays once, and
   * held until the project is present — starting while the data is in flight
   * would reveal an empty column and then pop the content in behind it.
   */
  const revealRootRef = useRef(null);
  useDetailReveal({
    rootRef: revealRootRef,
    revealKey: project.slug || project.title,
    ready: Boolean(project.title),
  });

  return (
    <div
      ref={revealRootRef}
      className="bg-transparent border-t border-white/5 min-h-screen text-left"
    >
      <div className="max-w-[72rem] mx-auto px-4 md:px-10 pt-24 md:pt-28">
        <h1 data-reveal className="font-heading font-extrabold text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] leading-[0.92] tracking-tighter text-dark-50 text-balance text-center max-w-[13ch] mx-auto mb-14 md:mb-20">
          {project.title}
        </h1>
      </div>

      {/* The preview's reveal marker lives on SitePreview's own glass panel,
          not on this wrapper: the parallax rewrites that panel's transform
          every frame, so the fade has to be on the element it shares. */}
      {showBand && (
        <div className="max-w-[110rem] mx-auto px-4 md:px-8 mb-16 md:mb-24">
          {isApp ? (
            <AppPreview screenshots={shots} title={project.title} />
          ) : (
            <SitePreview
              url={project.url}
              image={featured}
              title={project.title}
            />
          )}
        </div>
      )}

      <div className="max-w-[72rem] mx-auto px-4 md:px-10 pb-24 grid grid-cols-1 lg:grid-cols-[11rem_minmax(0,42rem)_1fr] lg:gap-x-12">
        {/* Left rail — empty now that the back control is the nav's orb, but
            kept so the three-column grid keeps its proportions. */}
        <aside className="hidden lg:block" aria-hidden="true" />

        {/* Reading column */}
        <article className="min-w-0">
          {/* Inline back link, narrow screens only — the nav's back orb sits in
              the centred group, which is hidden below md. */}
          <div className="md:hidden mb-6">
            <BackLink to={backTo} label={backLabel} />
          </div>

          <div data-reveal>
            <CaseStudyHeader
              project={project}
              caseStudy={caseStudy}
              hidePreview={showBand}
            />
          </div>

          {/* The stats are the one genuinely horizontal group on the page, so
              they get the left-to-right sweep; `data-reveal-stagger` tells the
              hook to animate the cards individually rather than the row as a
              block. */}
          <CaseStudyStats stats={caseStudy.stats} />

          <div className="mt-4">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                data-reveal
                className="scroll-mt-24"
              >
                <h2 className="font-heading font-bold text-2xl md:text-3xl leading-tight tracking-tight text-dark-50 text-balance mt-14 mb-4">
                  {section.heading}
                </h2>
                {(section.blocks || []).map((block, index) => (
                  <CaseStudyBlock key={index} block={block} />
                ))}
              </section>
            ))}
          </div>

          {/* End CTA */}
          <div
            data-reveal
            className="mt-18 md:mt-20 p-8 rounded-2xl border border-white/10 bg-dark-900 max-w-prose"
          >
            <h3 className="font-heading font-bold text-xl text-dark-50 mb-2">
              Want the full technical write-up?
            </h3>
            <p className="text-dark-300 mb-5">
              Happy to walk through how this was built in more detail.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white text-dark-950 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Get in touch
              </Link>
              <Link
                to={backTo}
                className="inline-flex items-center px-5 py-2.5 rounded-lg border border-white/10 text-dark-50 text-sm font-semibold hover:border-white/20 transition-colors"
              >
                {backLabel}
              </Link>
            </div>
          </div>
        </article>

        {/* Right rail — table of contents (follow-sticky on desktop) */}
        <aside className="hidden lg:block">
          <div ref={tocRailRef}>
            <CaseStudyToc sections={sections} />
          </div>
        </aside>
      </div>
    </div>
  );
};

const BackLink = ({ to, label }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 font-mono text-xs tracking-wide uppercase text-dark-700 hover:text-dark-50 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 rounded-sm"
  >
    <span aria-hidden="true">←</span> {label}
  </Link>
);

export default CaseStudyLayout;
