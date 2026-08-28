import { COLS, PACK_ROWS, SLOTS } from './wallLayout';
import { PIXEL_PALS, PALETTE as PAL_COLOURS, PAL_SIZE } from '../agents/pixelPals';

/*
 * Composites one pack of the wall into an offscreen canvas, to be used as the
 * cylinder's texture.
 *
 * Why one pack and not the whole wall: the wall is several packs around the
 * drum, and a texture for all of them would be ~24k x 3k px (75 megapixels),
 * far past the 8192px limit most GPUs enforce. Instead we draw ONE pack and let
 * the GPU repeat it around the tube (texture.wrapS = RepeatWrapping,
 * texture.repeat.x = N). That is both cheaper and exactly what makes the wall
 * endless — the seam is handled in hardware, and the pack tessellates
 * seamlessly left-to-right so the join is invisible.
 *
 * Everything is drawn at UNIT resolution: the canvas is COLS*U x PACK_ROWS*U,
 * so a 2x1 tile occupies 2U x 1U. The same packing geometry the DOM version
 * used, just rasterised.
 */

/*
 * Texture pixels per base unit.
 *
 * This is the wall's resolution, and it has to beat the SCREEN size of a tile
 * or the texture gets magnified and visibly pixelates. At 256 a 2x1 tile was
 * 512 texture px against ~640-860 screen px on a 2560-3440 wide display — a
 * 1.25-1.7x upscale, which is exactly the softness that showed up after zooming
 * in.
 *
 * 512 puts a full pack at 4096x3072 (~48MB): comfortably inside the 8192px
 * limit every modern GPU allows, and enough that a 2x1 tile carries 1024
 * texture px — a downscale even on an ultrawide. The source screenshots are
 * 1320x2868 and 2880x1800, so they have the detail to fill it.
 */
export const TEXEL_U = 512;

const PALETTE = {
  ground: '#101113',
  agentGround: '#1b1e22',
  agentBloom: '#2f3540',
  divider: 'rgba(255,255,255,0.10)',
  label: '#f4f2ee',
};

/*
 * Divider weight in TEXTURE pixels, not screen pixels. The texture is drawn at
 * TEXEL_U per base unit and then minified onto the cylinder, so a 1px line
 * would be sampled away to nothing at typical tile sizes. At TEXEL_U = 512 a
 * 2.5px stroke lands at roughly one screen pixel — thin enough to read as a
 * hairline, thick enough to survive mipmapping rather than dissolving as the
 * drum turns.
 */
const DIVIDER_W = 2.5;

/*
 * Alpha written for the wall's empty ground, vs. 1.0 for artwork. The shader
 * reads this back as a mask so the hover wash only touches the ground.
 *
 * The gap is deliberately wide (0.75 vs 1.0) rather than a single step. Mipmaps
 * and bilinear filtering blend alpha across the artwork's edge, and with a
 * 254/255 flag those blended texels landed ambiguously either side of the
 * threshold — putting a hairline of wash on the artwork's rim. A wide gap keeps
 * the mask decisive through every mip level. The wall is drawn opaque
 * regardless (the shader forces a = 1), so this is never visible as
 * transparency.
 */
export const GROUND_ALPHA = 0.75;

// Rounded-rect path, for the artwork inset inside each tile.
const roundRect = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

/*
 * Draws `img` to cover the box, cropped from the top — the same behaviour the
 * CSS version had via object-fit: cover / object-position: top center, which
 * suits both the ~1:2.2 phone screenshots and the ~1.6:1 web captures.
 */
const drawCover = (ctx, img, x, y, w, h) => {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y, dw, dh);
};

/*
 * Extracts an image's dominant colours, for the hover bloom.
 *
 * This replaces an earlier approach that scaled the image down to 10x10 and
 * stretched it back up as a "blur". That kept the image's SPATIAL layout, so a
 * screenshot with dark chrome around the edges bloomed into a muddy grey box
 * rather than the colour you actually associate with the work.
 *
 * Reading the palette instead gives the image's identity: quantise the pixels
 * into coarse colour buckets, drop the near-black and near-white ones that UI
 * chrome contributes, and keep the most populous remaining hues. The result is
 * rendered as a soft gradient, which is both cleaner and cheaper to draw.
 *
 * No extra library needed — Canvas's getImageData is the whole dependency.
 * (Skia wouldn't help here: it's a 2D rasteriser, the engine under Canvas
 * itself, with no palette API of its own. And none of this touches Three.js,
 * which only ever samples the finished texture.)
 *
 * Cached on the image object, so it runs once per project rather than per hover.
 */
const SAMPLE_SIZE = 24;   // sample grid; 576 pixels is plenty to rank colours
const BUCKET = 32;        // quantisation step per channel

export const paletteFor = (image) => {
  if (!image) return null;
  if (image.__palette) return image.__palette;

  const c = document.createElement('canvas');
  c.width = SAMPLE_SIZE;
  c.height = SAMPLE_SIZE;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  let data;
  try {
    data = cx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  } catch {
    // A tainted canvas (an image that slipped through without CORS) would throw
    // here. The bloom is decoration, so degrade rather than break the wall.
    image.__palette = null;
    return null;
  }

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 128) continue;

    // Skip near-black and near-white: that's UI chrome and paper, not the
    // image's colour, and including it washes every bloom toward grey.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 40 || min > 225) continue;
    // Skip near-greys too — they dilute the hue without adding identity.
    if (max - min < 18) continue;

    const key =
      ((r / BUCKET) | 0) * 10000 + ((g / BUCKET) | 0) * 100 + ((b / BUCKET) | 0);
    const hit = buckets.get(key);
    if (hit) {
      hit.r += r; hit.g += g; hit.b += b; hit.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const ranked = [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((x) => `rgb(${(x.r / x.n) | 0}, ${(x.g / x.n) | 0}, ${(x.b / x.n) | 0})`);

  // An image with no usable colour (a pure greyscale screenshot) gets nothing,
  // and falls back to the neutral lift below.
  image.__palette = ranked.length ? ranked : null;
  return image.__palette;
};

/*
 * Draws an agent's pixel pal into the texture.
 *
 * The sprite is a 16x16 grid of palette keys (see pixelPals.js). Rather than
 * one fillRect per pixel, runs of the same colour along a row are merged into a
 * single rect — a 16x16 sprite becomes a few dozen draws instead of up to 256.
 *
 * Returns whether anything was drawn: pals exist only for the known agent
 * slugs, and an unknown one should fall back to name-only rather than a gap.
 */
const drawPal = (ctx, slug, ax, ay, aw, ah) => {
  const pal = PIXEL_PALS[slug];
  if (!pal) return false;

  const grid = pal.idle[0]; // resting frame, eyes open
  // Sized to the tile and centred in its upper portion, leaving room for the
  // name below.
  const cell = Math.floor(Math.min(aw, ah) * 0.5) / PAL_SIZE;
  const size = cell * PAL_SIZE;
  const ox = ax + (aw - size) / 2;
  const oy = ay + ah * 0.42 - size / 2;

  for (let gy = 0; gy < PAL_SIZE; gy += 1) {
    const row = grid[gy] || '';
    let gx = 0;
    while (gx < PAL_SIZE) {
      const colour = PAL_COLOURS[row[gx]];
      if (!colour) {
        gx += 1;
        continue;
      }
      let run = 1;
      while (gx + run < PAL_SIZE && PAL_COLOURS[row[gx + run]] === colour) run += 1;
      ctx.fillStyle = colour;
      // +1 on the width closes the sub-pixel hairlines that would otherwise
      // show between adjacent runs once the texture is scaled.
      ctx.fillRect(ox + gx * cell, oy + gy * cell, run * cell + 1, cell + 1);
      gx += run;
    }
  }
  return true;
};

/*
 * Draws a project's details into the GROUND around its artwork.
 *
 * Three zones, all inside the cell's inset margin rather than over the work:
 *
 *   top-left     the brand the project belongs to
 *   top-right    its status, platform or category — whichever it has
 *   bottom       its technologies, as a subtle single row
 *
 * Everything is hard-clipped to one line. The margin is a fixed width and the
 * text has nowhere to wrap to, so anything longer is truncated with an ellipsis
 * rather than allowed to run into the artwork or collide with the opposite
 * corner. The two top labels split the width between them so they can never
 * overlap.
 */
const META_ALPHA = 0.42;

/*
 * The year a project was worked on, for the bottom row.
 *
 * Only `startDate` / `endDate` / `date` count as real: `updatedAt` is when the
 * Firestore record was last edited, not when the work happened, so using it
 * would print a confidently wrong year on almost every tile.
 *
 * A project with a start and a different end reads as a range ("2025—2026");
 * one with a single date reads as that year. Projects carrying no date at all
 * return null and the row stays empty rather than inventing something.
 */
const projectYear = (project) => {
  const yearOf = (v) => {
    if (!v) return null;
    const t = new Date(v).getFullYear();
    return Number.isNaN(t) ? null : t;
  };

  const start = yearOf(project.startDate) ?? yearOf(project.date);
  const end = yearOf(project.endDate);

  if (start && end && end !== start) return `${start}—${end}`;
  const single = start ?? end;
  return single ? String(single) : null;
};

const fitText = (ctx, text, maxWidth) => {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
};

const drawTileMeta = (ctx, { project, x, y, w, h, inset, brandLogos }) => {
  if (!project) return;

  const U = TEXEL_U;
  const pad = inset * 0.34;          // breathing room from the cell's edge
  const size = Math.round(U * 0.032); // one type size for every label
  const half = (w - pad * 2) / 2 - pad;

  /*
   * The metadata is drawn INTO the ground, which is precisely what the hover
   * wash targets — so without this it gets tinted along with the ground behind
   * it and the labels appear to be coloured over.
   *
   * Marking these pixels at full alpha puts them on the artwork side of the
   * shader's mask (see GROUND_ALPHA), so the wash flows around the text and
   * logos instead of through them.
   *
   * globalAlpha can't be used to fade the type any more for the same reason —
   * it would drag the alpha flag back down into the "ground" range. The colour
   * itself carries the opacity instead.
   */
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(244, 242, 238, ${META_ALPHA})`;
  ctx.font = `500 ${size}px 'JetBrains Mono', Consolas, monospace`;
  ctx.textBaseline = 'middle';

  const topY = y + pad + size * 0.5;
  const bottomY = y + h - pad - size * 0.5;

  /*
   * Top-left: the brand's LOGO where it has one, its name where it doesn't.
   *
   * Only some brands carry a logo (Mooslix and Tarragon do; the personal and
   * Nourished brands have an empty `logo`), so the text path stays as the
   * fallback rather than leaving those tiles blank. The mark is tinted to the
   * label colour so a full-colour JPG doesn't shout next to the muted type.
   */
  const brand = project.brand?.name || '';
  const logo = brandLogos.get(project.brand?.id);

  if (logo) {
    const lh = size * 1.25;
    const lw = (logo.width / logo.height) * lh;
    ctx.save();
    // Fully opaque: the mark is already greyscaled to sit with the metadata,
    // so fading it as well would just make it muddy.
    ctx.globalAlpha = 1;
    ctx.drawImage(logo, x + pad, topY - lh / 2, Math.min(lw, half), lh);
    ctx.restore();
  } else if (brand) {
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, brand.toUpperCase(), half), x + pad, topY);
  }

  // Top-right: when the work was done.
  const year = projectYear(project);
  if (year) {
    ctx.textAlign = 'right';
    ctx.fillText(fitText(ctx, year, half), x + w - pad, topY);
  }

  /*
   * Bottom: what the thing IS, quieter still.
   *
   * Composed rather than a single field, because no one field covers the whole
   * inventory: apps carry `platform` (6/14), sites carry `category` (5/14), and
   * agents carry neither. Falling through to `status` — which every project has
   * — means all 14 tiles get a line instead of two thirds of them showing a
   * blank row.
   */
  const kind = project.platform || project.category || project.status || '';
  if (kind) {
    ctx.fillStyle = `rgba(244, 242, 238, ${META_ALPHA * 0.72})`;
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, kind.toUpperCase(), w - pad * 2), x + pad, bottomY);
  }

  ctx.restore();
};

/**
 * Paints one pack into `canvas`.
 *
 * `entries` is one item per SLOT: { slot, project, image }, where `image` is a
 * loaded HTMLImageElement or null (agents have no screenshots).
 *
 * The pack is painted ONCE and uploaded to the GPU once. Hover is deliberately
 * NOT drawn here: repainting and re-uploading a 4096x3072 texture every frame
 * is a ~48MB transfer per frame (~2.8 GB/s at 60fps), which visibly stalls the
 * page. The hover wash is done in the fragment shader instead — see
 * useWallCylinder.js — where it costs a few uniforms and nothing else.
 */
export const paintPack = (
  canvas,
  entries,
  // `inset` is the padding between a cell's edge and its artwork, in texture
  // pixels (TEXEL_U per base unit). Raising it shrinks the work inside its
  // container and widens the ground around it, which is what gives the wall its
  // air now that there is no gutter between cells.
  //
  // `radius` is the artwork's corner rounding, also in texture pixels. At
  // TEXEL_U = 512 a radius of 10 is barely 2-3 screen pixels — just enough to
  // take the hard point off each corner without the tiles reading as rounded
  // cards. Both scale with TEXEL_U.
  { inset = 92, radius = 10, brandLogos = new Map() } = {}
) => {
  const ctx = canvas.getContext('2d');
  const U = TEXEL_U;

  /*
   * The ground is painted with alpha 254 while all artwork is drawn at 255.
   *
   * That one-step difference is a MASK for the shader: it needs to know which
   * fragments are the empty margin around a tile's work, so the hover wash can
   * light up the ground WITHOUT tinting the screenshot itself. Guessing from
   * luminance doesn't work — screenshots have dark regions of their own, and
   * those were getting washed too, which is why the colour looked like it was
   * animating over the content.
   *
   * Alpha is invisible here (the wall is opaque either way) and survives the
   * texture upload intact, so it's free to carry the flag.
   */
  ctx.save();
  ctx.globalAlpha = GROUND_ALPHA;
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  for (const { slot, project, image } of entries) {
    const x = slot.col * U;
    const y = slot.row * U;
    const w = slot.w * U;
    const h = slot.h * U;

    /*
     * The artwork sits inset from the tile edge, leaving the ground visible as
     * the gap between neighbours — the "padding, no gutter" model.
     *
     * PORTRAIT tiles flex their HORIZONTAL inset to fit the image's true
     * aspect ratio. Nothing runs along a tile's left or right margin (the
     * metadata sits along the top and bottom), so that padding is free to give
     * or take a little — and a fixed inset was cropping the sides off phone
     * screenshots, which are ~9:19.5 in a 1:2 frame.
     *
     * Deliberately limited to portrait tiles. Landscape (2x1) tiles keep a
     * fixed inset: their width is shared with the tile beside them and the
     * metadata runs the full width, so flexing it there would misalign the wall
     * and crowd the labels.
     *
     * The result is clamped so the artwork can never touch the divider lines
     * (a floor on the inset) or shrink oddly narrow (a ceiling).
     */
    const isPortrait = slot.h > slot.w;

    let hInset = inset;
    if (isPortrait && image && image.width && image.height) {
      const boxH = h - inset * 2;
      const wantW = boxH * (image.width / image.height);
      const wantInset = (w - wantW) / 2;
      // Never closer to the edge than a third of the base inset, never more
      // than half again as far.
      hInset = Math.max(inset * 0.34, Math.min(inset * 1.5, wantInset));
    }

    const ax = x + hInset;
    const ay = y + inset;
    const aw = w - hInset * 2;
    const ah = h - inset * 2;

    /*
     * Hover bloom: flood this tile's whole cell with the image's colours.
     *
     * Drawn before the artwork and across the FULL cell (x/y/w/h, not the inset
     * box), so the colour bleeds into the gap around the work — the tile lights
     * up from within rather than just getting brighter. The tiny bloom canvas
     * is scaled up here, which is what makes it read as a heavy blur.
     */
    ctx.save();
    roundRect(ctx, ax, ay, aw, ah, radius);
    ctx.clip();

    if (image) {
      drawCover(ctx, image, ax, ay, aw, ah);
    } else {
      // Agent tiles carry no screenshots — they're case-study work. They get a
      // tinted ground, the agent's pixel pal (this site's existing mascot for
      // them, see pixelPals.js) and the name beneath it.
      ctx.fillStyle = PALETTE.agentGround;
      ctx.fillRect(ax, ay, aw, ah);

      const drewPal = drawPal(ctx, project.slug, ax, ay, aw, ah);

      ctx.fillStyle = PALETTE.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(U * 0.1)}px Nunito, Inter, system-ui, sans-serif`;
      // With a pal above it the name sits low in the tile; without one it
      // centres, so a missing sprite still looks deliberate.
      const ty = drewPal ? ay + ah * 0.82 : ay + ah / 2;
      ctx.fillText(project.title || '', ax + aw / 2, ty, aw * 0.86);
    }

    ctx.restore();

    drawTileMeta(ctx, { project, x, y, w, h, inset, brandLogos });
  }

  /*
   * The dividers, drawn LAST as one continuous grid over the whole pack.
   *
   * They're strokes on the tile boundaries — not outlines around each artwork.
   * Outlining every tile reads as a set of separate cards; a shared ruled grid
   * reads as one surface the work is mounted on, which is the whole point of
   * the wall. Drawing them after the artwork also means nothing paints over
   * them.
   *
   * Each tile contributes its top and left edge. The pack tessellates, so every
   * internal seam is exactly one tile's top or left — each line is therefore
   * drawn once, at one consistent weight, with no doubled-up seams.
   */
  ctx.save();
  ctx.strokeStyle = PALETTE.divider;
  ctx.lineWidth = DIVIDER_W;
  ctx.beginPath();
  for (const { slot } of entries) {
    const x = slot.col * U;
    const y = slot.row * U;
    // Half-pixel offset so a 2px line lands on the pixel grid instead of
    // straddling it and blurring to 3px of half-tone.
    const px = Math.round(x) + 0.5;
    const py = Math.round(y) + 0.5;
    ctx.moveTo(px, py);
    ctx.lineTo(px + slot.w * U, py); // top edge
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + slot.h * U); // left edge
  }
  ctx.stroke();
  ctx.restore();
};

/**
 * Builds a COLS x PACK_ROWS map of which slot occupies each cell.
 *
 * The fragment shader needs to know, for the cell a fragment falls in, which
 * slot it belongs to — so it can look up that slot's colour and decide whether
 * it's the hovered one. Encoding it as a tiny texture (one texel per grid cell)
 * keeps the lookup to a single sample with no branching over the packing.
 *
 * The slot index is stored in the red channel, scaled to 0..255.
 */
export const createSlotMapCanvas = () => {
  const c = document.createElement('canvas');
  c.width = COLS;
  c.height = PACK_ROWS;
  const cx = c.getContext('2d');
  cx.fillStyle = 'rgb(255,0,0)'; // 255 = "no slot"
  cx.fillRect(0, 0, COLS, PACK_ROWS);

  SLOTS.forEach((slot, i) => {
    cx.fillStyle = `rgb(${i},0,0)`;
    cx.fillRect(slot.col, slot.row, slot.w, slot.h);
  });

  return c;
};

/**
 * Builds a tiny lookup texture holding each SLOT's dominant colour.
 *
 * The hover wash is drawn in the fragment shader, which needs the colours on
 * the GPU. Rather than pass an array of uniforms (awkward, and capped by
 * hardware limits), the palette is baked into a 1-pixel-per-slot strip that the
 * shader samples by slot index. It's SLOTS.length x 1 px — a few hundred bytes,
 * uploaded once alongside the wall texture.
 */
export const PALETTE_STOPS = 3;

export const createPaletteCanvas = (entries) => {
  /*
   * SLOTS.length x PALETTE_STOPS — one ROW per gradient stop, so each slot
   * carries its three dominant colours rather than just its single most common
   * one. The shader ramps between them across the cell, which gives the wash
   * some depth instead of a flat single-hue fill.
   */
  const c = document.createElement('canvas');
  c.width = SLOTS.length;
  c.height = PALETTE_STOPS;
  const cx = c.getContext('2d');

  // Neutral fallback, so a slot with no usable palette still lifts on hover.
  cx.fillStyle = PALETTE.agentBloom;
  cx.fillRect(0, 0, c.width, c.height);

  for (const { index, image } of entries) {
    const colours = paletteFor(image);
    if (!colours) continue;
    for (let row = 0; row < PALETTE_STOPS; row += 1) {
      // Images yielding fewer than three usable colours repeat their last one,
      // so the gradient degrades to a flatter wash rather than a hard edge.
      cx.fillStyle = colours[Math.min(row, colours.length - 1)];
      cx.fillRect(index, row, 1, 1);
    }
  }

  return c;
};

/**
 * Creates the offscreen canvas for a pack at the configured texel density.
 */
export const createPackCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TEXEL_U;
  canvas.height = PACK_ROWS * TEXEL_U;
  return canvas;
};

/**
 * The first usable still for a project, whatever field it happens to live in.
 * `site` projects carry a single `image`; `app` projects carry `screenshots[]`.
 * Agents carry neither — they're case-study work with no screenshots — and get
 * a typographic tile instead.
 */
export const tileImage = (project) => {
  if (!project) return null;
  if (project.image) return project.image;
  const shots = project.screenshots || [];
  const first = shots[0];
  if (!first) return null;
  return typeof first === 'string' ? first : first.url || first.src || null;
};

/**
 * Loads every brand logo referenced by the projects, keyed by brand id.
 *
 * Brands without a `logo` are simply absent from the map, and drawTileMeta
 * falls back to the brand's name — the personal and Nourished brands have no
 * mark, so the text path is a real case, not just defensive.
 */
export const loadBrandLogos = async (projects) => {
  const wanted = new Map();
  for (const p of projects) {
    const brand = p?.brand;
    if (brand?.id && brand.logo && !wanted.has(brand.id)) {
      wanted.set(brand.id, brand.logo);
    }
  }

  const out = new Map();
  await Promise.all(
    [...wanted.entries()].map(async ([id, src]) => {
      const img = await loadImage(src);
      if (img) out.set(id, greyscale(img));
    })
  );
  return out;
};

/*
 * Flattens a logo to greyscale, once, at load time.
 *
 * The brand marks are full colour (Tarragon's is a JPEG photo-style mark), and
 * dropped straight into the wall they shout next to the muted metadata type.
 * Desaturating makes them read as one system with the rest of the chrome.
 *
 * Done here rather than per-paint because it's a pixel operation: it runs once
 * per brand instead of once per tile per repaint.
 */
const greyscale = (img) => {
  const c = document.createElement('canvas');
  c.width = img.width || img.naturalWidth;
  c.height = img.height || img.naturalHeight;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, c.width, c.height);

  try {
    const d = cx.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      // Rec. 601 luma — matches how the eye weights the channels.
      const v = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    cx.putImageData(d, 0, 0);
  } catch {
    // A tainted canvas would throw; the colour original is still usable.
    return img;
  }

  return c;
};

/**
 * Loads an image with CORS enabled.
 *
 * crossOrigin is REQUIRED here: WebGL refuses to sample a texture from an image
 * fetched without it, and the canvas would be tainted. The Firebase Storage
 * bucket does return Access-Control-Allow-Origin for this site's origins
 * (verified for nikolaslarson.com and localhost), so this succeeds — but a
 * failure must not take the wall down, hence the null-on-error resolve.
 */
export const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export { COLS, PACK_ROWS, SLOTS };
