import React from 'react';
import usePreviewParallax from '../../hooks/usePreviewParallax';

/**
 * Point several refs at one node — the parallax hook wants an element to
 * measure and an element to move, and here they are the same node.
 */
const mergeRefs = (...refs) => (node) => {
  refs.forEach((ref) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  });
};

/**
 * The hero preview for an app case study: the project's phone screenshots laid
 * out in a row inside the same glass frame the web previews use.
 *
 * Why this exists rather than reusing SitePreview: app screenshots are tall
 * phone captures (~1:2.2), and web captures are wide desktop ones (~1.55:1).
 * Putting a single phone shot in SitePreview's frame either stretched it across
 * a landscape box or letterboxed it into a thin strip with most of the frame
 * empty. A row of phones fills the same wide band naturally, and it shows more
 * of the app besides — these projects carry two to four screenshots each.
 *
 * The frame, glass material, bevel maths and parallax are deliberately shared
 * with SitePreview so both detail types read as the same component family; only
 * the contents differ.
 *
 * Screens are capped at four. Beyond that each one is too narrow to read at
 * this width, and the row starts to look like a filmstrip rather than a
 * showcase.
 */
const MAX_SCREENS = 4;

const AppPreview = ({ screenshots = [], title }) => {
  // Parallax drifts the whole glass frame against the page, exactly as on the
  // web previews.
  const { frameRef, mediaRef } = usePreviewParallax();

  const screens = screenshots
    .map((shot) =>
      typeof shot === 'string' ? shot : shot?.url || shot?.src || null
    )
    .filter(Boolean)
    .slice(0, MAX_SCREENS);

  if (!screens.length) return null;

  return (
    <div
      ref={mergeRefs(frameRef, mediaRef)}
      data-reveal
      data-reveal-order="1"
      className="preview-glass relative block w-full max-w-full rounded-2xl p-2 sm:p-3"
    >
      {/*
        The well matches SitePreview's: same concentric radii (inner = outer
        minus padding, so 8px against p-2 and 4px against sm:p-3) and the same
        clipping, so the two previews are visibly the same object.

        Unlike the web well, this one has vertical padding of its own. A web
        screenshot is the whole picture and runs edge to edge; phone screens are
        objects sitting IN the frame, and they need air around them or they read
        as cropped off at top and bottom.
      */}
      <div className="site-preview__well relative block w-full min-w-0 overflow-hidden rounded-[8px] sm:rounded-[4px] px-4 py-6 sm:px-8 sm:py-10">
        {/*
          Screens sit on a centred row that wraps only if it must. `items-start`
          keeps their tops aligned, so screenshots of slightly different heights
          hang from a common line rather than floating around a centre — which
          is what makes a row of phones look deliberately arranged.
        */}
        <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5 lg:gap-7">
          {screens.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`${title} screenshot ${index + 1}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              /*
               * Width is a share of the row rather than a fixed pixel size, so
               * two screens sit large and four sit smaller without any of them
               * overflowing the frame. `max-w` stops a single screenshot from
               * ballooning to half the band when a project only has one.
               */
              className="block w-[38%] max-w-[15rem] sm:w-[30%] lg:w-[22%] h-auto rounded-xl border border-white/10 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
