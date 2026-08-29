import React, { useEffect, useRef, useState } from 'react';

/**
 * The big hero preview at the top of a case study. Given a `url` it tries to
 * embed the site in an iframe; if the site blocks framing (X-Frame-Options /
 * frame-ancestors) or doesn't load in time, it falls back to the `image`
 * screenshot with a "Visit site" overlay.
 *
 * Passing no `url` renders the image on its own at exactly the same size — that
 * covers projects that can't be embedded (`noEmbed`) and non-web projects,
 * which get the identical large frame rather than a smaller inline figure.
 * `visitUrl` keeps the "Visit site" link working when the embed is skipped but
 * the project still has a live address.
 *
 * The frame is deliberately large — the layout gives it a full-bleed band wider
 * than the reading column. The min-heights apply only to the live iframe, where
 * real height is what makes an embedded site render its desktop layout instead
 * of a phone breakpoint. A screenshot gets the aspect ratio alone: forcing a
 * ~46rem height on a wide image makes `object-cover` scale it up to fill that
 * height and crop the sides off, so the image is left to fit the ratio and
 * `object-contain` keeps the whole screenshot visible.
 *
 * Only the iframe path paints a background, and it's white: an embedded site
 * that hasn't painted its own background yet would otherwise show the page
 * through it. The screenshot path stays transparent so the project's tinted
 * page colour sits behind any letterboxing.
 *
 * Height is never capped here. A `max-height` against a fixed `aspect-ratio`
 * makes the box widen to preserve the ratio once the cap bites, which pushed
 * the frame off the right edge of the page — the band's own `max-w` is what
 * bounds the size instead.
 *
 * We can't read cross-origin frame contents, so "did it load?" is inferred: if
 * the iframe hasn't fired `load` within a timeout, we assume it was blocked and
 * show the fallback. A successful `load` clears the fallback.
 */
const SitePreview = ({ url, image, title, visitUrl = url }) => {
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // If the frame never loads, treat it as blocked and show the screenshot.
    // Nothing to wait on when there's no URL to embed in the first place.
    if (!url) return undefined;
    timerRef.current = setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [loaded, url]);

  const showImage = blocked || !url;

  return (
    <div
      className={`relative w-full max-w-full rounded-2xl border border-white/10 overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] ${
        showImage
          ? ''
          : 'bg-white min-h-[26rem] md:min-h-[40rem] lg:min-h-[46rem]'
      }`}
    >
      {!showImage && (
        <iframe
          title={`${title} live preview`}
          src={url}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full border-0"
          onLoad={() => {
            setLoaded(true);
            setBlocked(false);
          }}
          onError={() => setBlocked(true)}
        />
      )}

      {showImage && image && (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-contain object-top"
        />
      )}

      {/* Visit-site affordance: always available on the fallback, and a subtle
          corner chip over the live frame so the site is reachable in a new tab. */}
      {visitUrl && (
        <a
          href={visitUrl}
          target="_blank"
          rel="noreferrer"
          className={
            showImage
              ? 'absolute inset-0 flex items-end justify-end p-4 bg-gradient-to-t from-black/40 to-transparent'
              : 'absolute top-3 right-3'
          }
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 backdrop-blur px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider text-dark-100 hover:bg-black/70 transition-colors">
            Visit site <span aria-hidden>↗</span>
          </span>
        </a>
      )}
    </div>
  );
};

export default SitePreview;
