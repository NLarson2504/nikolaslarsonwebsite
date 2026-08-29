/*
 * Pull a representative tint out of an image, favouring colourful pixels.
 *
 * This is the sampler behind the "footlight" glow on the web gallery — the
 * warm wash that rises from the bottom edge in the colour of whatever project
 * is focused. It was written inline in WebGallery.js; the home page's list view
 * needs exactly the same treatment per row, so it lives here now and both call
 * it rather than keeping two copies that can drift apart.
 *
 * Why weighted rather than a plain average: a flat mean over a screenshot is
 * almost always a muddy grey, because most of a UI screenshot is background.
 * Weighting by chroma lets the few saturated pixels — the brand colour, the
 * accent — carry the result, which is what actually reads as "that project's
 * colour".
 */

// What a project falls back to when its image can't be sampled: a neutral that
// matches the page's own dark chrome, so a failed pick looks deliberate.
export const NEUTRAL_PICK = '#23262b';

/*
 * Average one rectangular region of RGBA pixel data into an `rgb()` string.
 *
 * `data` is a flat RGBA array (as from getImageData), `dim` its row width in
 * pixels, and x0/y0..x1/y1 the region bounds. Returns null when the region has
 * no usable colour at all, so callers can fall back rather than render mud.
 */
export const averageRegion = (data, dim, x0, y0, x1, y1) => {
  let r = 0;
  let g = 0;
  let b = 0;
  let wsum = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const k = (y * dim + x) * 4;
      const rr = data[k];
      const gg = data[k + 1];
      const bb = data[k + 2];
      const mx = Math.max(rr, gg, bb);
      const mn = Math.min(rr, gg, bb);
      if (mx < 18 || mn > 248) continue; // skip near-black / near-white
      const chroma = mx - mn;
      if (chroma < 8) continue; // effectively gray → don't let it dilute
      const w = (chroma / 255) ** 1.5;
      r += rr * w;
      g += gg * w;
      b += bb * w;
      wsum += w;
    }
  }
  if (wsum < 0.02) return null;
  let ar = r / wsum;
  let ag = g / wsum;
  let ab = b / wsum;
  // Push saturation up and normalise brightness to a fixed target, so every
  // project's glow reads at comparable strength regardless of whether its
  // screenshot happens to be light or dark.
  const mean = (ar + ag + ab) / 3;
  const SAT = 1.6;
  ar = mean + (ar - mean) * SAT;
  ag = mean + (ag - mean) * SAT;
  ab = mean + (ab - mean) * SAT;
  const luma = Math.max(1, 0.3 * ar + 0.59 * ag + 0.11 * ab);
  const target = 140;
  const scale = target / luma;
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * scale)));
  return `rgb(${clamp(ar)},${clamp(ag)},${clamp(ab)})`;
};

/*
 * Sample a whole loaded image down to ONE tint.
 *
 * The gallery samples four corners because its glow is a multi-origin field;
 * a list row only needs a single colour for its underline and wash, so this
 * averages the frame as a whole.
 *
 * Returns NEUTRAL_PICK rather than throwing when the image is cross-origin and
 * taints the canvas — a common case with remote Storage URLs, and not worth
 * failing a render over.
 */
export const pickImageTint = (img) => {
  try {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data;
    return averageRegion(d, s, 0, 0, s, s) || NEUTRAL_PICK;
  } catch (e) {
    return NEUTRAL_PICK; // tainted / unreadable → neutral
  }
};

/*
 * Parse a colour string into {r, g, b}, or null if it isn't one.
 *
 * Handles the two forms this codebase actually produces: `rgb(r,g,b)` from
 * averageRegion above, and hex literals like NEUTRAL_PICK. Callers treat null as
 * "leave it alone" rather than guessing.
 */
export const parseRgb = (value) => {
  if (typeof value !== 'string') return null;
  const fn = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3] };
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  return null;
};

/*
 * Mix two colours to an OPAQUE result.
 *
 * `amount` is how much of `top` survives — the same arithmetic a browser does
 * for `opacity: amount` over `bottom`, but resolved up front so the result can
 * be written as a solid colour. Layered effects use this instead of stacking
 * translucent elements, so every layer paints a known value rather than one that
 * depends on whatever is behind it.
 */
export const blendRgb = (top, bottom, amount) => {
  const a = parseRgb(top);
  const b = parseRgb(bottom);
  if (!a || !b) return top;
  const mix = (x, y) => Math.round(y + (x - y) * amount);
  return `rgb(${mix(a.r, b.r)},${mix(a.g, b.g)},${mix(a.b, b.b)})`;
};
