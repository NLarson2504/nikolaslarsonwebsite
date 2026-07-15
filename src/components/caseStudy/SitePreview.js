import React, { useEffect, useRef, useState } from 'react';

/**
 * Live preview of a web project on its case-study page. Tries to embed the site
 * in an iframe; if the site blocks framing (X-Frame-Options / frame-ancestors)
 * or doesn't load in time, it falls back to the auto-captured screenshot with a
 * "Visit site" overlay.
 *
 * We can't read cross-origin frame contents, so "did it load?" is inferred: if
 * the iframe hasn't fired `load` within a timeout, we assume it was blocked and
 * show the fallback. A successful `load` clears the fallback.
 */
const SitePreview = ({ url, image, title }) => {
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // If the frame never loads, treat it as blocked and show the screenshot.
    timerRef.current = setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [loaded]);

  const showImage = blocked || !url;

  return (
    <div className="mt-8 relative rounded-2xl border border-white/10 overflow-hidden aspect-[16/9] bg-dark-900">
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
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      )}

      {/* Visit-site affordance: always available on the fallback, and a subtle
          corner chip over the live frame so the site is reachable in a new tab. */}
      {url && (
        <a
          href={url}
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
