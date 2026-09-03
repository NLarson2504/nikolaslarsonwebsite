import React from 'react';

/**
 * Case study dek and optional featured image.
 *
 * There used to be a mono meta byline here (brand · role · stack · status) in a
 * bordered strip under the dek. It's gone: the brand now rides in the nav
 * beside the wordmark for the whole length of the page, so repeating it at the
 * top read as saying the same thing twice.
 *
 * The preview isn't rendered here — the layout hoists it into a full-bleed band
 * above the reading column, at the same large size whether it's a live iframe
 * or the screenshot fallback. This only renders the image when a page opts out
 * of that band entirely.
 *
 * `project` is the joined project doc (with `project.brand`); `caseStudy` is
 * project.caseStudy.
 */
const CaseStudyHeader = ({ project, caseStudy, hidePreview = false }) => {
  const featured = caseStudy.featuredImage || project.image;

  return (
    <header>
      {caseStudy.dek && (
        <p className="text-lg md:text-xl text-dark-300 leading-relaxed max-w-prose mb-7">
          {caseStudy.dek}
        </p>
      )}

      {!hidePreview && featured && (
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
