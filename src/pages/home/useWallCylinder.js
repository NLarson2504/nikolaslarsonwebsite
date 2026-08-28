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
 * This is the ceiling, not the onset — see HOVER_FLOOR.
 *
 * Kept low on purpose. This is a background effect: the ground around a tile
 * should pick up a hint of the work's colour, not turn into a coloured panel.
 * At 0.55 it read as a spotlight; 0.16 tops out around a sixth of the way to
 * the colour, which is a tint you notice without it taking over the wall.
 */
const WASH_STRENGTH = 0.16;

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

export default function useWallCylinder({ entries, enabled = true, onPick }) {
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
    const camera = new THREE.PerspectiveCamera(
      42,
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
    const circumference = TAU * RADIUS;
    const packArc = circumference / REPEATS;
    const packAspect = (COLS * TEXEL_U) / (PACK_ROWS * TEXEL_U);
    const height = (packArc / packAspect) * BANDS;

    const geometry = new THREE.CylinderGeometry(
      RADIUS, RADIUS, height, SEGMENTS, 1, true
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
        uHoverSlot: { value: -1 },
        uHoverAmount: { value: 0 },
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
        uniform float uHoverSlot;
        uniform float uHoverAmount;
        uniform float uWashStrength;
        varying vec2 vUv;

        void main() {
          // Match the CanvasTexture repeat/offset by hand, since a raw sampler
          // ignores Three's texture transform.
          vec2 uv = vUv * uRepeat + uOffset;
          vec4 wall = texture2D(uMap, uv);

          // Position inside ONE pack, which is what the lookup maps describe.
          vec2 cellUv = fract(uv);
          float slot = floor(texture2D(uSlotMap, cellUv).r * 255.0 + 0.5);

          if (uHoverAmount > 0.001 && abs(slot - uHoverSlot) < 0.5) {
            // Sample this slot's colour from the middle of its palette texel.
            vec2 pUv = vec2((slot + 0.5) / uSlotCount, 0.5);
            vec3 wash = texture2D(uPalette, pUv).rgb;

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

            wall.rgb = mix(wall.rgb, wash, ground * uHoverAmount * uWashStrength);
            wall.a = 1.0;
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
    const hover = { slot: -1, amount: 0 };

    /*
     * Hover now costs two uniform writes — no texture repaint, no upload. This
     * is the whole reason the wash moved into the shader.
     */
    const applyHover = () => {
      /*
       * The eased value is used as-is. An earlier version ran it through a
       * smoothstep, which flattens the beginning of the curve — the opposite of
       * what's wanted here. Combined with a slow ease it meant only ~1% of the
       * wash was visible after the first frame and ~130ms to reach a quarter,
       * which is what read as lag. The onset is handled by HOVER_FLOOR below.
       */
      material.uniforms.uHoverSlot.value = hover.slot;
      material.uniforms.uHoverAmount.value = Math.min(1, Math.max(0, hover.amount));
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
     * Hover behaves like a dimmer switch: the light comes on the instant you
     * touch it, then rides up smoothly to full.
     *
     * HOVER_FLOOR is the onset — the wash jumps straight to this on first
     * contact, so the reaction registers immediately. It is deliberately LOW
     * (a ~6% tint): enough to acknowledge the pointer, faint enough that the
     * ramp afterwards is the part you actually notice. HOVER_EASE then carries
     * it up to full over ~400ms.
     *
     * Exponential easing alone can't do this: it is slowest exactly where the
     * response needs to be fastest.
     */
    const HOVER_FLOOR = 0.1;
    const HOVER_EASE = 0.16;
    // Fading out is slower than fading in — a light dimming down, not snapping
    // off, and it keeps a fast sweep across tiles from flickering.
    const HOVER_EASE_OUT = 0.1;

    const tick = () => {
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
      if (hover.slot !== want) {
        hover.slot = want;
        // Land at the floor rather than 0, so the new cell is already visibly
        // lit on the very first frame it's hovered.
        if (want !== -1) hover.amount = Math.max(hover.amount, HOVER_FLOOR);
        dirty = true;
      }

      const target = want !== -1 ? 1 : 0;

      if (Math.abs(hover.amount - target) > 0.002) {
        if (reduceMotion) {
          hover.amount = target;
        } else {
          // Rising uses the floor for instant onset; falling is gentler.
          if (target > hover.amount && hover.amount < HOVER_FLOOR) {
            hover.amount = HOVER_FLOOR;
          }
          const step = target > hover.amount ? HOVER_EASE : HOVER_EASE_OUT;
          hover.amount += (target - hover.amount) * step;
        }
        dirty = true;
      } else if (hover.amount !== target) {
        hover.amount = target;
        dirty = true;
      }

      if (dirty) {
        applyHover();
        renderer.render(scene, camera);
      }

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
  }, [entries, enabled]);

  return { mountRef };
}
