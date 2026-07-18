import React from 'react';

/**
 * Simple, Medusa-style table of contents: plain anchor links to each section,
 * no active-section indicator. Sticky positioning is applied by the parent
 * layout's grid rail.
 *
 * `sections` is the case study's sections array ([{ id, heading }]).
 */
const CaseStudyToc = ({ sections = [] }) => {
  if (sections.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="font-mono text-[11px] tracking-widest uppercase text-dark-400 mb-3.5">
        On this page
      </p>
      <ol className="flex flex-col gap-2.5 list-none m-0 p-0">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block text-sm leading-snug text-dark-400 hover:text-dark-50 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 rounded-sm"
            >
              {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default CaseStudyToc;
