import React from 'react';
import SitePreview from './SitePreview';

/**
 * Case study title block: headline, dek, and an optional featured image.
 *
 * There used to be a mono meta byline here (brand · role · stack · status) in a
 * bordered strip under the dek. It's gone: the brand now rides in the nav
 * beside the wordmark for the whole length of the page, so repeating it at the
 * top read as saying the same thing twice.
 *
 * `project` is the joined project doc (with `project.brand`); `caseStudy` is
 * project.caseStudy.
 */
const CaseStudyHeader = ({ project, caseStudy }) => {
  const featured = caseStudy.featuredImage || project.image;
  // Sites get a live iframe preview (falling back to the screenshot); apps and
  // other types keep the static featured image. `noEmbed` opts a site out of the
  // live iframe (e.g. a login-gated app that could expose real data) so it always
  // shows the hand-picked screenshot instead.
  const isSite = project.type === 'site' && project.url && !project.noEmbed;

  return (
    <header>
      {caseStudy.dek && (
        <p className="text-lg md:text-xl text-dark-300 leading-relaxed max-w-prose mb-7">
          {caseStudy.dek}
        </p>
      )}

      {isSite ? (
        <SitePreview url={project.url} image={featured} title={project.title} />
      ) : (
        featured && (
          <div className="mt-8 rounded-2xl border border-white/10 overflow-hidden aspect-[16/8] bg-dark-900">
            <img
              src={featured}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )
      )}
    </header>
  );
};

export default CaseStudyHeader;
