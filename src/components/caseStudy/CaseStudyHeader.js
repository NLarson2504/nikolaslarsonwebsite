import React from 'react';

/**
 * Case study title block: headline, dek, a mono meta byline (brand · role ·
 * stack · status), and an optional featured image.
 *
 * `project` is the joined project doc (with `project.brand`); `caseStudy` is
 * project.caseStudy.
 */
const CaseStudyHeader = ({ project, caseStudy }) => {
  const brand = project.brand;
  const stack = (project.technologies || []).slice(0, 3).join(' · ');
  const featured = caseStudy.featuredImage || project.image;

  return (
    <header>
      <h1 className="font-heading font-extrabold text-4xl md:text-6xl leading-[1.05] tracking-tight text-dark-50 text-balance max-w-[20ch] mb-4">
        {project.title}
      </h1>

      {caseStudy.dek && (
        <p className="text-lg md:text-xl text-dark-300 leading-relaxed max-w-prose mb-7">
          {caseStudy.dek}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3.5 py-4 border-y border-white/5 font-mono text-xs text-dark-400">
        {brand && (
          <span className="inline-flex items-center gap-2 text-dark-300">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt=""
                className="w-5 h-5 rounded object-contain bg-dark-800"
              />
            ) : (
              <span className="w-5 h-5 rounded bg-gradient-to-br from-primary-500 to-accent-500" />
            )}
            {brand.name}
          </span>
        )}
        {caseStudy.role && <span>Role — {caseStudy.role}</span>}
        {stack && <span>Stack — {stack}</span>}
        {project.status && (
          <span className="text-primary-400">Status — {project.status}</span>
        )}
      </div>

      {featured && (
        <div className="mt-8 rounded-2xl border border-white/10 overflow-hidden aspect-[16/8] bg-dark-900">
          <img
            src={featured}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </header>
  );
};

export default CaseStudyHeader;
