import React from 'react';

/**
 * Renders one content block within a case study section. Blocks are the DRY
 * primitive shared by every case study — add a new block type here and every
 * case study across agents / apps / web gets it.
 *
 * Supported block shapes:
 *   { type: 'paragraph', text }
 *   { type: 'quote', text, cite }
 *   { type: 'image', src, caption }
 */
const CaseStudyBlock = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-dark-300 font-sans leading-relaxed mb-5">{block.text}</p>
      );

    case 'quote':
      return (
        <blockquote className="my-10 pl-6 border-l-[3px] border-primary-500 max-w-prose">
          <p className="font-heading text-xl md:text-2xl leading-snug text-dark-50">
            {block.text}
          </p>
          {block.cite && (
            <cite className="block mt-4 not-italic font-mono text-xs tracking-wide text-dark-400">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );

    case 'image':
      return (
        <figure className="my-10">
          <div className="rounded-xl border border-white/10 overflow-hidden bg-dark-800 aspect-video grid place-items-center">
            {block.src ? (
              <img
                src={block.src}
                alt={block.caption || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono text-xs tracking-widest uppercase text-dark-400">
                Image
              </span>
            )}
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-sm text-dark-400">{block.caption}</figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
};

export default CaseStudyBlock;
