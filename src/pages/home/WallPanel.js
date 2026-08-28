import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KIND_META } from './wallLayout';
import { tileImage } from './WallTile';

/*
 * The detail overlay.
 *
 * Clicking a tile opens this rather than navigating, so the wall stays mounted
 * underneath — no teardown, no re-measure, and no curvature recompute on the
 * way back. The route link is still offered inside the panel for anyone who
 * wants the full case study.
 */

const WallPanel = ({ slot, onClose }) => {
  const closeRef = useRef(null);
  const { kind, project } = slot;
  const meta = KIND_META[kind];
  const src = tileImage(project);
  const tech = project.technologies || [];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog so the overlay is keyboard-reachable and Esc
    // lands somewhere sensible.
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="wl-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={onClose}
    >
      {/* Stop clicks inside the panel from closing it. */}
      <div className="wl-panel" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          className="wl-panel-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {src ? (
          <div className="wl-panel-media">
            <img src={src} alt={project.title} />
          </div>
        ) : (
          <div className="wl-panel-media wl-panel-media--agent">{project.title}</div>
        )}

        <div className="wl-panel-body">
          <div className="wl-panel-kicker">
            {project.brand?.name ? `${project.brand.name} · ` : ''}{meta.label}
            {project.status ? ` · ${project.status}` : ''}
          </div>

          <h2 className="wl-panel-title">{project.title}</h2>

          {project.description ? (
            <p className="wl-panel-desc">{project.description}</p>
          ) : null}

          {tech.length ? (
            <div className="wl-panel-tech">
              {tech.slice(0, 10).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          ) : null}

          <div className="wl-panel-actions">
            {project.slug ? (
              <Link className="wl-panel-link" to={`${meta.base}/${project.slug}`}>
                {project.caseStudy ? 'Read case study' : 'View project'}
              </Link>
            ) : null}
            {project.url ? (
              <a
                className="wl-panel-link wl-panel-link--ghost"
                href={project.url}
                target="_blank"
                rel="noreferrer"
              >
                Visit site
              </a>
            ) : null}
            {project.appStoreUrl ? (
              <a
                className="wl-panel-link wl-panel-link--ghost"
                href={project.appStoreUrl}
                target="_blank"
                rel="noreferrer"
              >
                App Store
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallPanel;
