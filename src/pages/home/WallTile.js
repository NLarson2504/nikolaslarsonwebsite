import React from 'react';
import { COLS, KIND_META } from './wallLayout';

/*
 * One tile on the wall.
 *
 * The CONTAINER is strict: exactly 2x1, 1x1 or 1x2 base units (or a hero at
 * double both axes). That silhouette is the taxonomy and nothing here is
 * allowed to bend it — no expanding on hover, no content-driven sizing.
 *
 * The CONTENT inside is deliberately looser. Media is inset from the container
 * edge and fitted rather than cropped to fill, so a 9:19.5 phone screenshot
 * sits inside a 1x2 tile as a whole image with a margin of ground around it,
 * instead of being sliced to the tile's exact ratio. The mat between the image
 * and the tile edge is what makes the wall read as framed work rather than a
 * grid of cropped thumbnails — and it lets each piece keep its own proportions
 * while the frames stay on the taxonomy.
 *
 * The tile owns no transform of its own — useCylindricalWall writes the
 * curvature straight onto the node's style.
 */

// The first usable still for a project, whatever field it happens to live in.
// `site` projects carry a single `image`; `app` projects carry `screenshots[]`.
export const tileImage = (project) => {
  if (!project) return null;
  if (project.image) return project.image;
  const shots = project.screenshots || [];
  const first = shots[0];
  if (!first) return null;
  return typeof first === 'string' ? first : first.url || first.src || null;
};

const WallTile = ({ slot, muted, onOpen, copy = 0 }) => {
  const { kind, project, col, row, w, h, hero } = slot;
  const meta = KIND_META[kind];
  const src = tileImage(project);

  // Repeated copies of the pack are the same work shown again as the drum
  // turns, so only the first is announced to assistive tech.
  const decorative = copy > 0;

  return (
    <button
      type="button"
      data-wall-tile
      tabIndex={decorative ? -1 : 0}
      aria-hidden={decorative || undefined}
      className={[
        'wl-tile',
        `wl-tile--${kind}`,
        hero ? 'wl-tile--hero' : '',
        muted ? 'wl-tile--muted' : '',
      ].filter(Boolean).join(' ')}
      style={{
        // Copies are laid out end to end in one grid, so each copy's columns
        // are offset by a full pack width.
        gridColumn: `${copy * COLS + col + 1} / span ${w}`,
        gridRow: `${row + 1} / span ${h}`,
        // Drives the stacked mobile layout, where the grid collapses to a
        // single column and each tile falls back to its natural ratio.
        '--wl-ratio': `${w} / ${h}`,
      }}
      onClick={() => onOpen(slot)}
      aria-label={decorative ? undefined : `${project.title} — ${meta.label}`}
    >
      {src ? (
        // The image is fitted inside the mat, not cropped to the frame, so the
        // work keeps its own aspect ratio inside a taxonomy-fixed container.
        <span className="wl-mat">
          <img className="wl-media" src={src} alt="" loading="lazy" draggable="false" />
        </span>
      ) : (
        // Agents ship as case studies with no screenshots, so their tiles are
        // typographic. Only the hero square has room for a descriptor.
        <span className="wl-agent-body">
          <span className="wl-agent-glyph">{meta.label}</span>
          <span>
            <span className="wl-agent-name">{project.title}</span>
            {hero && project.description ? (
              <span className="wl-agent-desc">{project.description}</span>
            ) : null}
          </span>
        </span>
      )}

      <span className="wl-label">
        <span className="wl-label-title">{project.title}</span>
        <span className="wl-label-meta">
          {project.brand?.name ? `${project.brand.name} · ` : ''}{meta.label}
        </span>
      </span>
    </button>
  );
};

export default WallTile;
