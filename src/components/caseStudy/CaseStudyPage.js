import React from 'react';
import { Link, useParams } from 'react-router-dom';
import useProject from '../../hooks/useProject';
import CaseStudyLayout from './CaseStudyLayout';

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

  if (loading) {
    return (
      <div className="bg-dark-950 border-t border-white/5 min-h-screen grid place-items-center">
        <div className="text-center text-dark-300">
          <div className="inline-block w-8 h-8 border-2 border-dark-600 border-t-dark-50 rounded-full animate-spin mb-4" />
          <p className="font-sans">Loading…</p>
        </div>
      </div>
    );
  }

  // Not found, errored, or the project exists but has no case study to show.
  if (error || notFound || !project || !project.caseStudy) {
    return (
      <div className="bg-dark-950 border-t border-white/5 min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading font-bold text-3xl text-dark-50 mb-3">
            {error ? 'Something went wrong' : 'Case study not found'}
          </h1>
          <p className="text-dark-300 mb-6">
            {error
              ? 'We couldn’t load this case study right now. Please try again later.'
              : 'This project doesn’t have a case study yet.'}
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
