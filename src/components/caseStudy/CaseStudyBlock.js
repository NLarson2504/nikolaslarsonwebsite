import React from 'react';

/**
 * Renders the inline markdown the admin editor produces — **bold**, _italic_,
 * `code` and [links](url) — as React nodes. Deliberately a small subset, and
 * built by splitting rather than by setting innerHTML, so authored copy can
 * never inject markup.
 */
const INLINE = /(\*\*[^*]+\*\*|(?<![A-Za-z0-9])_[^_]+_(?![A-Za-z0-9])|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export const renderInline = (text) => {
  if (!text) return null;
  return String(text)
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      let m;
      if ((m = part.match(/^\*\*([^*]+)\*\*$/))) {
        return <strong key={i} className="text-dark-100 font-semibold">{m[1]}</strong>;
      }
      if ((m = part.match(/^_([^_]+)_$/))) {
        return <em key={i}>{m[1]}</em>;
      }
      if ((m = part.match(/^`([^`]+)`$/))) {
        return (
          <code key={i} className="font-mono text-[0.9em] text-dark-200 bg-white/[0.06] rounded px-1 py-0.5">
            {m[1]}
          </code>
        );
      }
      if ((m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/))) {
        const external = /^https?:/.test(m[2]);
        return (
          <a
            key={i}
            href={m[2]}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
          >
            {m[1]}
          </a>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
};

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
        <p className="text-dark-300 font-sans leading-relaxed mb-5">{renderInline(block.text)}</p>
      );

    case 'quote':
      return (
        <blockquote className="my-10 pl-6 border-l-[3px] border-primary-500 max-w-prose">
          <p className="font-heading text-xl md:text-2xl leading-snug text-dark-50">
            {renderInline(block.text)}
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
