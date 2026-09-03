import React, { useEffect, useRef, useState } from 'react';

/**
 * The big hero preview at the top of a case study. Given a `url` it tries to
 * embed the site in an iframe; if the site blocks framing (X-Frame-Options /
 * frame-ancestors), is down, or doesn't load in time, it falls back to the
 * `image` screenshot.
 *
 * Passing no `url` renders the image on its own at exactly the same size — that
 * covers projects that can't be embedded (`noEmbed`) and non-web projects,
 * which get the identical large frame rather than a smaller inline figure.
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
 * "Did it load?" is inferred from two signals, because we can't read
 * cross-origin frame contents:
 *
 *  1. A timeout. If the iframe hasn't fired `load` in time, we assume it was
 *     blocked and show the screenshot. A successful `load` clears it.
 *  2. A status probe. An error page (503 Service Unavailable, 502, 404, …)
 *     still fires `load` on the iframe — the frame "loaded", it just holds the
 *     host's error page — so the timeout alone would leave a Service
 *     Unavailable screen sitting in the hero. A CORS-mode `fetch` reads the
 *     real status where the server allows it, and any non-OK status pins the
 *     fallback on. A fetch that *throws* is ambiguous (a perfectly healthy site
 *     with no CORS headers throws too), so a throw is ignored and the timeout
 *     stays the judge.
 */
const SitePreview = ({ url, image, title }) => {
  const [blocked, setBlocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
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

  // Probe whether the site is actually serving, because an error page (503
  // SERVICE_UNAVAILABLE, 502, 404, ...) still fires `load` on the iframe — the
  // frame "loaded", it just holds the host's error page — so the load timeout
  // alone leaves a Service Unavailable screen sitting in the hero.
  //
  // Two probes run, because neither covers every host on its own:
  //
  //  1. `fetch`. Reads the real status, but only when the server sends CORS
  //     headers. Without them the request throws, and a throw is ambiguous — a
  //     perfectly healthy site with no CORS policy throws too — so a throw is
  //     ignored here and left to probe 2.
  //  2. An image load. Not subject to CORS at all. A host that is down serves
  //     its error page for *every* path, so a URL that should be an image comes
  //     back as the error document instead and fails to decode, firing
  //     `onerror`. A healthy site returns a real favicon and fires `onload`.
  //     This is what catches a paused Vercel deployment, which sends a 503 with
  //     no CORS headers and no framing restrictions.
  //
  // A cache-buster keeps a previously-cached favicon from masking an outage.
  useEffect(() => {
    if (!url) return undefined;
    setUnavailable(false);

    let cancelled = false;
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 6000);

    fetch(url, { method: 'GET', signal: controller.signal })
      .then((response) => {
        if (!cancelled && !response.ok) setUnavailable(true);
      })
      .catch(() => {});

    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) setUnavailable(true);
    };
    try {
      const faviconUrl = new URL('/favicon.ico', url);
      faviconUrl.searchParams.set('_probe', Date.now());
      probe.src = faviconUrl.href;
    } catch {
      // Malformed URL — nothing to probe, leave it to the load timeout.
    }

    return () => {
      cancelled = true;
      clearTimeout(abortTimer);
      controller.abort();
      probe.onerror = null;
      probe.src = '';
    };
  }, [url]);

  const showImage = blocked || unavailable || !url;

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
    </div>
  );
};

export default SitePreview;
