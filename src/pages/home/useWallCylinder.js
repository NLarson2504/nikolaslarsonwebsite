import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLS, PACK_ROWS, SLOTS } from './wallLayout';
import { TEXEL_U, createPackCanvas, createPaletteCanvas, createSlotMapCanvas, paintPack } from './wallTexture';

/*
 * The wall as a real 3D cylinder.
 *
 * Why WebGL and not CSS: a CSS element is always a flat plane, so a curved wall
 * built from DOM tiles is a faceted polygon — at this radius a 2x1 tile misses
 * the true cylinder by ~10.6px and meets its neighbour at a ~10deg crease.
 * Subdividing tiles into strips shrinks that error but never removes it, and it
 * fights the grid: the tessellation and the curve end up specified in two
 * different coordinate systems that drift apart at the edges.
 *
 * A cylinder mesh has no such problem. The geometry IS the curve, the GPU
 * interpolates the texture across it per fragment, and there are no element
 * boundaries left to misalign. Rotation is a single scalar on the mesh.
 *
 * ---------------------------------------------------------------- the texture
 *
 * The wall is drawn once into an offscreen canvas as a single pack, then the
 * GPU repeats it around the tube (wrapS = RepeatWrapping, repeat.x = REPEATS).
 * A texture spanning every repeat would be ~24k x 3k px, far past the 8192px
 * limit most GPUs enforce. Repeating in hardware is cheaper AND is what makes
 * the wall endless — the seam is handled by the sampler, and the pack
 * tessellates seamlessly left-to-right so the join is invisible.
 *
 * ------------------------------------------------------------- interaction
 *
 * The mesh is a texture, so it has no DOM children to click. Pointer events are
 * resolved by raycasting into the cylinder and reading the hit's UV, which maps
 * back to a cell in the packing and therefore to a project. The DOM keeps a
 * parallel list of real links for accessibility and crawlers (see Wall.js), so
 * nothing depends on the canvas being reachable.
 */

/*
 * Packs around the full circumference. FEWER packs means each one wraps a
 * larger arc, so more of the screen is filled by fewer tiles — i.e. lower is
 * more zoomed in. 4 fills the view with the work while still leaving enough
 * wall behind the viewer for the loop to stay seamless.
 */
const REPEATS = 4;
const BANDS = 2;          // packs stacked vertically
const RADIUS = 2.6;       // world units
const SEGMENTS = 128;     // radial segments — plenty for a seamless silhouette
/*
 * The wash's FULL strength, once the ramp has settled.
 *
 * This is the wash at full strength, reached at the end of the hover ramp.
 *
 * The hard ceiling on the wash: the hovered cell's ground travels at most this
 * far from its own colour toward the artwork's. 0.035 = a 3.5% tint.
 *
 * This is deliberately minute. The wash sits on a near-black ground in a dark
 * room, and anything that reads as a distinct colour there is already competing
 * with the artwork. At this level it registers as the cell warming very
 * slightly rather than as a coloured panel.
 *
 * This is now the ONLY brightness control — see the shader, where it is applied
 * once. It reads as a quiet tint rather than a glow, which is the intent: the
 * ground picks up a hint of the work's colour and nothing more.
 */
const WASH_STRENGTH = 0.035;

/*
 * Mouse position steers the camera, so moving around feels like looking about
 * inside the drum rather than at a fixed panorama.
 *
 * Both axes are kept small and are parallax cues, not camera controls:
 *
 *   PITCH (vertical)  the wall is only a couple of packs tall, so too much
 *                     would swing past its top and bottom and show the open
 *                     ends of the tube.
 *   YAW (horizontal)  this is a nudge on top of the scroll-driven spin, not a
 *                     second way to rotate — too much and the wall appears to
 *                     drift whenever the pointer moves.
 */
const MAX_PITCH = 0.13;     // radians (~7.5deg) at the very top or bottom
const MAX_YAW = 0.06;       // radians (~3.5deg) at the far left or right
const TILT_EASE = 0.06;     // slower than the spin, so it drifts rather than tracks

const SPIN_PER_PX = 0.0016;
const EASE = 0.09;
const TAU = Math.PI * 2;

export default function useWallCylinder({ entries, enabled = true, onPick, filter = 'all', compact = false }) {
  const mountRef = useRef(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // Hover/spin state lives in refs: it changes every frame and must never
  // trigger a React render.
  const spinRef = useRef({ current: 0, target: 0 });
  const hoverRef = useRef(-1);

  useEffect(() => {
    const mount = mountRef.current;
    const items = entries?.items;
    if (!mount || !enabled || !items || !items.length) return undefined;
    const brandLogos = entries.brandLogos || new Map();

    /* ---------------------------------------------------------- renderer */

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    /*
     * A narrow viewport is a small window onto the same wide cylinder, so at the
     * desktop field of view a phone would show only a sliver of one tile. A
     * wider FOV pulls more of the drum into frame; the radius is trimmed to
     * match so tiles stay a comfortable size rather than receding.
     */
    const camera = new THREE.PerspectiveCamera(
      compact ? 62 : 42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    /*
     * The camera sits INSIDE the cylinder, at its axis. That's what makes the
     * wall concave — the work wraps around the viewer rather than bulging out
     * at them, which is the difference between looking at an object and
     * standing in a room.
     */
    camera.position.set(0, 0, 0);
    // YXZ: yaw is applied before pitch, so leaning the view never rolls the
    // horizon. Set once here rather than per frame.
    camera.rotation.order = 'YXZ';

    /* ----------------------------------------------------------- texture */

    const canvas = createPackCanvas();
    paintPack(canvas, items, { brandLogos });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    /*
     * Negative X repeat MIRRORS the texture horizontally.
     *
     * We render the cylinder's BackSide and stand inside it, and looking at a
     * surface from behind flips it left-to-right — so the artwork and any text
     * came out mirrored. Negating repeat.x (with a matching offset.x of 1 to
     * keep the pack aligned to the seam) flips the sampling back, so the wall
     * reads correctly from the inside.
     */
    texture.repeat.set(-REPEATS, BANDS);
    texture.offset.set(1, 0);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.colorSpace = THREE.SRGBColorSpace;
    // Mipmaps + trilinear filtering keep the far side of the tube from
    // shimmering as it rotates.
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    /* ---------------------------------------------------------- geometry */

    // Height chosen so the pack's aspect ratio survives being wrapped: the
    // circumference carries REPEATS packs, so one pack's arc length sets the
    // scale for its height.
    const radius = compact ? RADIUS * 0.72 : RADIUS;
    const circumference = TAU * radius;
    const packArc = circumference / REPEATS;
    const packAspect = (COLS * TEXEL_U) / (PACK_ROWS * TEXEL_U);
    const height = (packArc / packAspect) * BANDS;

    const geometry = new THREE.CylinderGeometry(
      radius, radius, height, SEGMENTS, 1, true
    );
    // Render the inside of the tube: we're standing in it, and by default only
    // the outward faces are drawn.
    /*
     * Two tiny lookup textures feed the hover wash:
     *   slotMap  COLS x PACK_ROWS — which slot owns each grid cell
     *   palette  SLOTS.length x 1 — that slot's dominant colour
     * Both are nearest-filtered: they're data, not pictures, and interpolating
     * them would blend adjacent slot indices into meaningless values.
     */
    const makeDataTexture = (cnv) => {
      const t = new THREE.CanvasTexture(cnv);
      t.minFilter = THREE.NearestFilter;
      t.magFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      return t;
    };

    const slotMapTex = makeDataTexture(createSlotMapCanvas());
    const paletteTex = makeDataTexture(createPaletteCanvas(items));

    /*
     * The hover wash lives in the FRAGMENT SHADER, not in the wall texture.
     *
     * Painting it into the texture meant re-uploading 4096x3072 (~48MB) every
     * animated frame — about 2.8 GB/s at 60fps, which stalls the page badly.
     * Here the wall texture is uploaded once and never touched again; hover
     * costs two uniforms and a couple of texture samples per fragment, which is
     * free by comparison.
     */
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        uMap: { value: texture },
        uSlotMap: { value: slotMapTex },
        uPalette: { value: paletteTex },
        uRepeat: { value: new THREE.Vector2(-REPEATS, BANDS) },
        uOffset: { value: new THREE.Vector2(1, 0) },
        uSlotCount: { value: SLOTS.length },
        uFilter: { value: 0 },
        uFilterFade: { value: 1 },
        uHoverSlot: { value: -1 },
        uHoverAmount: { value: 0 },
        uPrevSlot: { value: -1 },
        uPrevAmount: { value: 0 },
        uWashStrength: { value: WASH_STRENGTH },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform sampler2D uSlotMap;
        uniform sampler2D uPalette;
        uniform vec2  uRepeat;
        uniform vec2  uOffset;
        uniform float uSlotCount;
        /*
         * TWO washes, not one.
         *
         * Moving between tiles has to fade the old cell down while the new one
         * comes up — with a single (slot, amount) pair the slot swaps instantly
         * and the incoming tile simply inherits the outgoing brightness, so
         * nothing appears to animate after the first hover. A second slot lets
         * both run at once.
         */
        uniform float uHoverSlot;
        uniform float uHoverAmount;
        uniform float uPrevSlot;
        uniform float uPrevAmount;
        uniform float uWashStrength;
        // 0 = show everything; otherwise the kind index to keep lit.
        uniform float uFilter;
        uniform float uFilterFade;
        varying vec2 vUv;

        void main() {
          // Match the CanvasTexture repeat/offset by hand, since a raw sampler
          // ignores Three's texture transform.
          vec2 uv = vUv * uRepeat + uOffset;
          vec4 wall = texture2D(uMap, uv);

          // Position inside ONE pack, which is what the lookup maps describe.
          vec2 cellUv = fract(uv);
          float slot = floor(texture2D(uSlotMap, cellUv).r * 255.0 + 0.5);

          // How lit is THIS cell? It may be the incoming tile, the outgoing
          // one, or neither.
          float amount = 0.0;
          if (abs(slot - uHoverSlot) < 0.5) amount = uHoverAmount;
          else if (abs(slot - uPrevSlot) < 0.5) amount = uPrevAmount;

          if (amount > 0.001) {
            /*
             * Blend this slot's THREE dominant colours across the cell.
             *
             * The palette texture carries one row per stop, so a diagonal
             * position within the cell picks how far through the ramp we are.
             * A single flat colour read as a solid tint; ramping between the
             * top three gives the wash some internal variation, closer to light
             * bouncing off the work than a colour fill.
             */
            float u0 = (slot + 0.5) / uSlotCount;
            vec3 cA = texture2D(uPalette, vec2(u0, 0.5 / 3.0)).rgb;
            vec3 cB = texture2D(uPalette, vec2(u0, 1.5 / 3.0)).rgb;
            vec3 cC = texture2D(uPalette, vec2(u0, 2.5 / 3.0)).rgb;

            /*
             * Diagonal ramp across the PACK, not within each cell.
             *
             * fract(cellUv * grid) would repeat per BASE UNIT, so a 2x1 tile
             * would show the gradient twice with a hard reset at its midpoint —
             * a visible seam through every landscape and portrait tile. Ramping
             * across the pack keeps each tile's wash continuous and lets
             * neighbours differ slightly, which is the variation we wanted.
             */
            float g = clamp((cellUv.x + (1.0 - cellUv.y)) * 0.5, 0.0, 1.0);

            vec3 wash = g < 0.5
              ? mix(cA, cB, g * 2.0)
              : mix(cB, cC, (g - 0.5) * 2.0);

            /*
             * The wash belongs BEHIND the artwork, so it may only touch the
             * cell's empty ground — the inset margin around the work.
             *
             * The ground is flagged in the texture's ALPHA (see GROUND_ALPHA in
             * wallTexture.js): ground is written at 0.75, artwork at 1.0.
             * An earlier version inferred the ground from luminance instead,
             * but screenshots contain dark pixels of their own and those got
             * washed too — which is exactly the "animating over the content"
             * problem. Alpha is exact, so the artwork is never touched.
             */
            // Threshold sits midway between the ground flag (0.75) and
            // artwork (1.0), so filtered edge texels resolve cleanly either
            // way and no wash creeps onto the work's rim.
            float ground = 1.0 - smoothstep(0.86, 0.94, wall.a);

            /*
             * Two terms, because a mix alone cannot lift this ground.
             *
             * The ground is near-black (#101113), so mixing it 16% toward the
             * image colour moved it by only ~26/255 — running the animation
             * correctly but with almost nothing visible, which is why the
             * effect kept reading as "not animated". The additive term is what
             * makes it actually glow: the cell lights UP toward the colour
             * rather than merely leaning toward it.
             */
            /*
             * ONE blend, one number.
             *
             * This used to be a mix plus a separate additive lift, with
             * uWashStrength applied to BOTH — so the strength was effectively
             * squared into the result and the additive term (which just piles
             * light on regardless of how dark the ground is) contributed most
             * of the brightness. Lowering the strength barely dimmed anything
             * because the two terms fought each other.
             *
             * Now uWashStrength is the literal ceiling: at 0.16 the ground ends
             * up exactly 16% of the way from its own colour to the artwork's,
             * and nothing else brightens it.
             */
            float k = ground * amount * uWashStrength;
            wall.rgb = mix(wall.rgb, wash, k);
            wall.a = 1.0;
          }

          /*
           * Filtering DIMS, it never removes.
           *
           * The wall is one tessellated surface — pulling tiles out would tear
           * a hole in it. Non-matching cells fade toward the room's own black
           * instead, so the packing stays intact and the selected section is
           * simply the only lit thing on the wall.
           *
           * The kind is stored in the slot map's GREEN channel (1 = web,
           * 2 = app, 3 = agent), alongside the slot index in red.
           */
          if (uFilter > 0.5) {
            float kind = floor(texture2D(uSlotMap, cellUv).g * 255.0 + 0.5);
            float keep = abs(kind - uFilter) < 0.5 ? 1.0 : 0.0;
            float dim = mix(1.0, keep, uFilterFade);
            wall.rgb = mix(wall.rgb * 0.18, wall.rgb, dim);
          }

          gl_FragColor = wall;

          /*
           * Convert to the renderer's output colour space.
           *
           * MeshBasicMaterial gets this for free; a raw ShaderMaterial does
           * not, so writing gl_FragColor directly left the whole wall in linear
           * space — which reads as noticeably dark and over-saturated. This
           * include restores the same conversion the built-in materials apply.
           */
          #include <colorspace_fragment>
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    /* ------------------------------------------------------- interaction */

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    /*
     * Turn a hit on the cylinder into a slot index.
     *
     * The UV runs 0..1 across one texture repeat, so scaling by the repeat
     * counts and taking the fractional part gives a position inside ONE pack.
     * That maps to a cell, and the cell maps to whichever slot covers it.
     */
    const slotAtUV = (uv) => {
      if (!uv) return -1;
      /*
       * The texture is sampled mirrored (repeat.x is negative), so the hit's
       * raw U must be mirrored the same way before it maps back to a column —
       * otherwise picking would be flipped relative to what's on screen.
       */
      const u = ((-uv.x * REPEATS) % 1 + 1) % 1;
      const v = ((uv.y * BANDS) % 1 + 1) % 1;
      const col = Math.floor(u * COLS);
      // Texture V is bottom-up; the packing's rows are top-down.
      const row = Math.floor((1 - v) * PACK_ROWS);
      return SLOTS.findIndex(
        (s) => col >= s.col && col < s.col + s.w && row >= s.row && row < s.row + s.h
      );
    };

    const hitSlot = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(mesh)[0];
      return hit ? slotAtUV(hit.uv) : -1;
    };

    /*
     * Hover tracking only — the cursor stays the default arrow across the whole
     * wall. A pointing finger over every tile makes the surface read as a wall
     * of buttons; the wall should feel like a space you're looking around, with
     * the work itself inviting the click.
     */
    /*
     * Hover is ANIMATED, so the wash fades in and out instead of snapping.
     *
     * `hover.amount` eases toward 1 while a tile is hovered and back to 0 when
     * it isn't; `hover.slot` only changes once the outgoing wash has faded, so
     * moving between tiles crossfades rather than jumping.
     */
    const hover = { slot: -1, amount: 0, prevSlot: -1, prevAmount: 0 };

    /*
     * Filter state, animated so switching sections eases rather than snaps.
     * `fade` runs 0..1: 1 = the filter fully applied, 0 = everything lit.
     */
    const KIND_ID = { all: 0, web: 1, app: 2, agent: 3 };
    const filterState = { id: KIND_ID[filter] ?? 0, fade: filter === 'all' ? 0 : 1 };
    material.uniforms.uFilter.value = filterState.id;
    material.uniforms.uFilterFade.value = filterState.fade;

    /*
     * Hover now costs two uniform writes — no texture repaint, no upload. This
     * is the whole reason the wash moved into the shader.
     */
    const applyHover = () => {
      /*
       * hover.amount advances LINEARLY along a fixed duration; the smoothstep
       * here gives it its shape — easing in and out so the wash starts and
       * settles gently rather than beginning at full rate.
       *
       * (Shaping a linear timeline is not the same as the earlier mistake of
       * smoothstepping an exponential ease, which flattened an already
       * front-loaded curve into something that looked like nothing happened.)
       */
      const shape = (v) => {
        const t = Math.min(1, Math.max(0, v));
        return t * t * (3 - 2 * t);
      };
      material.uniforms.uHoverSlot.value = hover.slot;
      material.uniforms.uHoverAmount.value = shape(hover.amount);
      material.uniforms.uPrevSlot.value = hover.prevSlot;
      material.uniforms.uPrevAmount.value = shape(hover.prevAmount);
    };

    // Last known pointer position, so the hovered slot can be re-resolved as the
    // drum spins underneath a stationary cursor.
    const lastPointer = { x: 0, y: 0, inside: false };
    const tilt = { pitch: 0, pitchTarget: 0, yaw: 0, yawTarget: 0 };

    const syncHover = () => {
      if (!lastPointer.inside) return;
      hoverRef.current = hitSlot(lastPointer.x, lastPointer.y);
    };

    const onPointerMove = (e) => {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      lastPointer.inside = true;

      // -1..+1 across the viewport on each axis.
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      // Both negated, so the view leans TOWARD the pointer.
      tilt.pitchTarget = -Math.max(-1, Math.min(1, ny)) * MAX_PITCH;
      tilt.yawTarget = -Math.max(-1, Math.min(1, nx)) * MAX_YAW;

      syncHover();
    };

    // Leaving the canvas must clear the bloom, or the last tile stays lit.
    const onPointerLeave = () => {
      lastPointer.inside = false;
      hoverRef.current = -1;
      // Settle back to level when the pointer leaves the wall.
      tilt.pitchTarget = 0;
      tilt.yawTarget = 0;
    };

    // Distinguish a click from a drag, so spinning the wall doesn't open a
    // project every time the pointer comes to rest.
    let downX = 0;
    let downY = 0;
    const onPointerDown = (e) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const idx = hitSlot(e.clientX, e.clientY);
      if (idx >= 0 && pickRef.current) pickRef.current(idx);
    };

    const spin = spinRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      spin.target += d * SPIN_PER_PX;
    };

    let touchX = null;
    const onTouchStart = (e) => { touchX = e.touches[0].clientX; };
    const onTouchMove = (e) => {
      if (touchX === null) return;
      const x = e.touches[0].clientX;
      spin.target -= (x - touchX) * SPIN_PER_PX * 2.2;
      touchX = x;
    };
    const onTouchEnd = () => { touchX = null; };

    const onKey = (e) => {
      if (e.key === 'ArrowLeft') spin.target -= 0.12;
      else if (e.key === 'ArrowRight') spin.target += 0.12;
      else return;
      e.preventDefault();
    };

    const el = renderer.domElement;
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);

    /* ------------------------------------------------------------- loop */

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = null;
    let running = true;

    /*
     * Hover ramps the cell's ground from the wall's own background up to full
     * wash strength — a dimmer coming up, with nothing skipped at the start.
     *
     * There is deliberately NO onset floor. An earlier version snapped the
     * value to a floor on first contact to kill a perceived lag, but that made
     * the wash TELEPORT to ~1.6% and then animate only the remaining sliver.
     * That snap was simultaneously the "too bright on first hover" and the
     * "I don't notice any brightening" — the tile lit instantly and then barely
     * moved. Starting from a true 0 and easing faster gives an onset that is
     * both immediate and actually visible as a ramp.
     */
    /*
     * Fixed DURATIONS, not an exponential ease.
     *
     * Exponential easing (amount += (target - amount) * k) is fastest at the
     * start: at k = 0.28 the first frame covered 28% of the range in 17ms, so
     * the eye read an instant ON followed by a slow crawl — a snap wearing an
     * animation's clothing. Lowering k just moved the problem, because the
     * shape is wrong, not the speed.
     *
     * Driving progress from elapsed TIME and shaping it with a smoothstep gives
     * even, watchable motion: the first frame moves ~1/255, the peak rate is in
     * the middle, and it settles gently at the end.
     */
    const HOVER_IN_MS = 240;
    // Fading out is the FASTER of the two: a cell you've left should get out of
    // the way quickly, and a slow fade makes a sweep across the wall look like
    // it's smearing light behind the pointer.
    const HOVER_OUT_MS = 170;

    /*
     * Timestamped so the hover ramp advances by real elapsed time rather than
     * per frame. A frame-counted ramp runs at whatever rate the display happens
     * to refresh at — twice as fast on a 120Hz screen, and it stutters whenever
     * a frame is dropped.
     */
    let lastTick = performance.now();

    const tick = (now = performance.now()) => {
      if (!running) return;

      let dirty = false;

      const diff = spin.target - spin.current;
      if (Math.abs(diff) > 0.00002) {
        spin.current += reduceMotion ? diff : diff * EASE;
        mesh.rotation.y = spin.current;
        // The tile under the cursor changes as the wall turns, even if the
        // pointer itself hasn't moved.
        syncHover();
        // Keep the accumulated angle bounded so long sessions don't lose float
        // precision.
        if (Math.abs(spin.current) > TAU) {
          spin.current %= TAU;
          spin.target %= TAU;
        }
        dirty = true;
      }

      /*
       * Ease the camera's pitch and yaw.
       *
       * Applied to the CAMERA, not the mesh, so the wall itself stays put and
       * only the point of view shifts. The yaw is added on top of the
       * scroll-driven spin (which lives on mesh.rotation.y), so the two don't
       * fight each other.
       */
      const pitchDiff = tilt.pitchTarget - tilt.pitch;
      const yawDiff = tilt.yawTarget - tilt.yaw;

      if (Math.abs(pitchDiff) > 0.00002 || Math.abs(yawDiff) > 0.00002) {
        tilt.pitch += reduceMotion ? pitchDiff : pitchDiff * TILT_EASE;
        tilt.yaw += reduceMotion ? yawDiff : yawDiff * TILT_EASE;
        camera.rotation.y = tilt.yaw;
        camera.rotation.x = tilt.pitch;
        dirty = true;
      }

      /*
       * Animate the wash. When the pointer moves to a different tile the old
       * one fades out first, then the new slot takes over and fades in — a
       * crossfade rather than an instant swap.
       */
      const want = hoverRef.current;

      /*
       * Switch to whatever the pointer is over IMMEDIATELY — no waiting for the
       * previous cell to fade. Waiting meant the new tile sat dark for the whole
       * of the old one's fade-out, which is most of what felt laggy when moving
       * between tiles.
       */
      /*
       * On a slot change, HAND THE OUTGOING CELL OFF to the `prev` channel and
       * start the incoming one from zero.
       *
       * Previously the slot swapped while `amount` carried over, so every tile
       * after the first inherited full brightness and had nothing left to
       * animate — the wash appeared to teleport from tile to tile. Two channels
       * let the old cell fade out on its own timeline while the new one ramps
       * up, so every tile animates in and every tile animates out.
       */
      /*
       * Only hand off when moving to ANOTHER tile.
       *
       * Leaving the wall (want === -1) must let the current cell ramp down in
       * place — treating that as a slot change zeroed `amount` instantly and
       * the fade-out never played at all.
       */
      if (want !== -1 && hover.slot !== want) {
        /*
         * Only claim the fade-out channel if this cell is brighter than
         * whatever is already fading. Sweeping quickly across the wall would
         * otherwise let a tile that was lit for a single frame evict a fully
         * bright one mid-fade, cutting the visible fade-out short.
         */
        if (hover.slot !== -1 && hover.amount > hover.prevAmount) {
          hover.prevSlot = hover.slot;
          hover.prevAmount = hover.amount;
        }
        hover.slot = want;
        hover.amount = 0;
        dirty = true;
      }

      // Clamp the frame gap: after a backgrounded tab or a long stall,
      // now - lastTick can be hundreds of ms and would jump an entire ramp in a
      // single frame — the exact snap this is all meant to avoid.
      const dt = Math.min(50, now - lastTick);

      // The hovered cell ramps up; once the pointer leaves, the same cell
      // ramps back down in place (its slot is retained so it stays visible
      // while it fades).
      const target = want !== -1 ? 1 : 0;
      if (hover.amount !== target) {
        if (reduceMotion) {
          hover.amount = target;
        } else {
          const dur = target > hover.amount ? HOVER_IN_MS : HOVER_OUT_MS;
          const delta = dt / dur;
          hover.amount += target > hover.amount ? delta : -delta;
          hover.amount = Math.min(1, Math.max(0, hover.amount));
        }
        dirty = true;
      }

      // Release the slot once it has fully dimmed, so it stops being drawn.
      if (want === -1 && hover.amount === 0 && hover.slot !== -1) {
        hover.slot = -1;
        dirty = true;
      }

      /*
       * Ease the filter's dimming. The target id is set on mount and whenever
       * `filter` changes (the effect re-runs), so this only animates the fade
       * between "everything lit" and "one section lit".
       */
      const wantFade = filterState.id === 0 ? 0 : 1;
      if (filterState.fade !== wantFade) {
        const d = dt / 320;
        filterState.fade = wantFade > filterState.fade
          ? Math.min(1, filterState.fade + d)
          : Math.max(0, filterState.fade - d);
        material.uniforms.uFilterFade.value = filterState.fade;
        dirty = true;
      }

      // The cell just left always fades to nothing.
      if (hover.prevAmount > 0) {
        if (reduceMotion) {
          hover.prevAmount = 0;
        } else {
          hover.prevAmount = Math.max(0, hover.prevAmount - dt / HOVER_OUT_MS);
        }
        if (hover.prevAmount === 0) hover.prevSlot = -1;
        dirty = true;
      }

      if (dirty) {
        applyHover();
        renderer.render(scene, camera);
      }

      lastTick = now;
      raf = requestAnimationFrame(tick);
    };

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);

    /* ----------------------------------------------------------- resize */

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize, { passive: true });

    /* ---------------------------------------------------------- cleanup */

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      // WebGL resources are not garbage collected — leaking them across route
      // changes would exhaust GPU memory.
      geometry.dispose();
      material.dispose();
      texture.dispose();
      slotMapTex.dispose();
      paletteTex.dispose();
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [entries, enabled, filter, compact]);

  return { mountRef };
}
