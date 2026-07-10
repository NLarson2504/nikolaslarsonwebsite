import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Wraps a project card so it links to that project's case study — but only when
 * one exists. Projects without a case study render as a plain, non-clickable
 * card. Keeps the "some have case studies, some are just listed" rule in one
 * place across agents / apps / web.
 *
 *   <ProjectCardLink project={p} basePath="/agents">
 *     <AgentDetail ... />
 *   </ProjectCardLink>
 */
const ProjectCardLink = ({ project, basePath, children }) => {
  const hasCaseStudy = Boolean(project.caseStudy) && Boolean(project.slug);

  if (!hasCaseStudy) return children;

  return (
    <Link
      to={`${basePath}/${project.slug}`}
      aria-label={`Read the ${project.title} case study`}
      className="group block rounded-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
        {children}
      </div>
      <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide uppercase text-primary-400 opacity-80 group-hover:opacity-100 transition-opacity">
        Read case study
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
};

export default ProjectCardLink;
