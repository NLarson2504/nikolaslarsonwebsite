import React from 'react';
import usePreviewParallax from '../../hooks/usePreviewParallax';

/**
 * Point several refs at one node. The parallax hook wants a element to measure
 * and an element to move; here they are the same node, and a ref can only be
 * assigned once in JSX.
 */
const mergeRefs = (...refs) => (node) => {
  refs.forEach((ref) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  });
};

/**
 * The big hero preview at the top of a case study: the project's captured
 * screenshot in a glass frame, linking to the live site.
 *
 * This used to embed the live site in an iframe and fall back to the screenshot
 * when framing was blocked or the host was down. That was removed — a live
 * cross-origin frame turned out to be a liability rather than a feature:
 *
 *  - Recursion. nikolaslarson.com embeds itself, so its own case-study page
 *    nested endlessly, each level rendering another copy of the page.
 *  - Whatever the site decides to serve. CampusLM added a client-side catch-all
 *    redirect to its login screen, so the hero quietly became a login page. A
 *    paused Vercel deployment did the same with a 503 error screen. Both are
 *    changes on someone else's server that silently replace the hero here.
 *  - A dead cursor. A cross-origin iframe swallows pointer events, so they
 *    never reach this element — the site's cursor dot froze over the one frame
 *    that most wanted the "opens the live site" cue, and the frame could not be
 *    made clickable either.
 *
 * The screenshots come from `scripts/captureScreenshots.js`, which renders each
 * site through the Microlink API and uploads the result to Firebase Storage. So
 * the "load and screenshot" already happens — just ahead of time, on a schedule,
 * where a bad capture can be caught and a project can opt out with `noCapture`
 * instead of being discovered live by a visitor.
 *
 * The frame is deliberately large: the layout gives it a full-bleed band wider
 * than the reading column. Height is never capped here — a `max-height` against
 * a fixed ratio makes the box widen to preserve the ratio once the cap bites,
 * which pushed the frame off the right edge of the page. The band's own `max-w`
 * bounds the size instead.
 *
 * `url` is the live address to link to. It is accepted under both `url` and
 * `visitUrl` because callers pass `url` only for embeddable projects and
 * `visitUrl` for the rest; with embedding gone the distinction is moot, so
 * either one serves as the link target.
 */
const SitePreview = ({ url, image, title, visitUrl = url }) => {
  // Parallax drifts the whole glass frame against the page.
  const { frameRef, mediaRef } = usePreviewParallax();

  const href = visitUrl || url;
  const canVisit = Boolean(href);

  return (
    /*
     * The parallax moves the GLASS FRAME itself, not the picture inside it.
     * `frameRef` measures position, `mediaRef` receives the transform, and both
     * are this element: the whole panel — glass, bevel, shadow and screenshot —
     * drifts against the page as one object, which is what reads as the frame
     * sitting at a different depth. Drifting the image inside a pinned frame
     * instead made the picture slide behind a static window, which is a
     * different (and much subtler) effect.
     */
    <div
      ref={mergeRefs(frameRef, mediaRef)}
      data-reveal
      data-reveal-order="1"
      className="preview-glass relative block w-full max-w-full rounded-2xl p-2 sm:p-3"
    >
      {/* Inner media well. The shell's padding is what insets the media from
          the frame rather than letting it run to the edge, the way the gallery
          cards do — so the shell reads as a lit glass frame around the preview
          instead of a border drawn on it. The well owns the clipping; the shell
          owns the material.

          The well carries NO aspect ratio and the image is a normal in-flow
          block, so the image's own dimensions set the well's height and the
          shell wraps it exactly. An earlier version forced a 4/3 -> 16/9 ratio
          and pinned the image `absolute inset-0 object-contain`: the rounded
          corners then clipped the *well*, but the visible edge was the
          letterboxed image sitting inset from those corners, so the image's own
          corners stayed square and the leftover bands read as the container not
          fitting its content.

          The radii are concentric, not merely both-rounded: an inner corner
          bevels cleanly inside an outer one only when
          `inner = outer - padding`. The shell is `rounded-2xl` (16px) with 8px
          padding, so the well is 8px; at `sm` the padding grows to 12px, so the
          well drops to 4px. `overflow-hidden` clips the image to that curve.

          `data-preview-hover` opts the frame into the cursor's arrow cue, and
          only when there is somewhere to go — the arrow should never promise a
          click that does nothing. It's a real anchor rather than an onClick div
          so the destination is honest: it shows in the status bar, and
          cmd/middle-click, "open in new tab", and keyboard activation all work
          the way they should. */}
      <a
        href={canVisit ? href : undefined}
        target={canVisit ? '_blank' : undefined}
        rel={canVisit ? 'noreferrer' : undefined}
        aria-label={canVisit ? `${title} — open the live site in a new tab` : undefined}
        data-preview-hover={canVisit ? 'true' : undefined}
        className="site-preview__well relative block w-full min-w-0 overflow-hidden rounded-[8px] sm:rounded-[4px]"
      >
        {/* The image sizes the well directly. No overscan wrapper any more:
            the whole frame moves now, so nothing travels inside the clip and
            there is no leading edge to cover. */}
        {image && (
          <img src={image} alt={title} className="block w-full h-auto" />
        )}
      </a>
    </div>
  );
};

export default SitePreview;
