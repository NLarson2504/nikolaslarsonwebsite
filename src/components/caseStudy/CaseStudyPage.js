import React from 'react';
import { Link, useParams } from 'react-router-dom';
import useProject from '../../hooks/useProject';
import CaseStudyLayout from './CaseStudyLayout';
import { useDetailTheme } from '../DetailTransition';
import { usePublishDetailBrand } from '../DetailBrand';
import { tileImage } from '../../pages/home/wallTexture';

/**
 * Reusable case study route. One component drives every type's detail page —
 * the route element just supplies `type`, `backTo`, and `backLabel`:
 *
 *   <Route path="/agents/:slug"
 *          element={<CaseStudyPage type="agent" backTo="/agents" backLabel="All agents" />} />
 *
 * Handles loading, not-found (no project or no case study for that slug), and
 * error states so pages don't repeat that logic.
 */
const CaseStudyPage = ({ type, backTo, backLabel }) => {
  const { slug } = useParams();
  const { data: project, loading, error, notFound } = useProject(type, slug);

  /*
   * The project-tinted background, applied at THIS level rather than inside
   * CaseStudyLayout.
   *
   * The layout only mounts once the data has arrived, so themeing there left
   * the loading state unthemed — it rendered its own dark panel and the tint
   * visibly flashed away and back. Here it covers all three states: skeleton,
   * error, and the loaded page.
   *
   * `project` is undefined while loading, so this starts neutral and re-runs
   * with the real colours the moment the asset is known.
   */
  useDetailTheme(project ? tileImage(project) : null);

  /*
   * Hand the project's brand to the nav, which shows it beside the wordmark
   * while a detail page is open. Published from here rather than from
   * CaseStudyLayout so it's set as soon as the project resolves, and cleared
   * when this route unmounts.
   */
  usePublishDetailBrand(project?.brand);

  /*
   * Nothing renders while loading — no skeleton, no spinner.
   *
   * The themed background is already painted by the time this branch is hit
   * (useDetailTheme runs above), so the viewport shows the project's own colour
   * and the content simply appears when it's ready. An empty full-height div
   * holds the page open, and the status line keeps the wait announced for
   * screen readers.
   */
  if (loading) {
    return (
      <div className="min-h-screen">
        <span className="sr-only" role="status">
          Loading project…
        </span>
      </div>
    );
  }

  // Only a genuinely missing project or a load failure is an error. A project
  // WITHOUT a case study still gets a page — CaseStudyLayout falls back to the
  // project's own metadata — so every project is reachable.
  if (error || notFound || !project) {
    return (
      <div className="bg-transparent border-t border-white/5 min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading font-bold text-3xl text-dark-50 mb-3">
            {error ? 'Something went wrong' : 'Project not found'}
          </h1>
          <p className="text-dark-300 mb-6">
            {error
              ? 'We couldn’t load this project right now. Please try again later.'
              : 'We couldn’t find a project at this address.'}
          </p>
          <Link
            to={backTo}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-white/10 text-dark-50 text-sm font-semibold hover:border-white/20 transition-colors"
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CaseStudyLayout project={project} backTo={backTo} backLabel={backLabel} />
  );
};

export default CaseStudyPage;
