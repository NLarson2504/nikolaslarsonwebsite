/*
 * Markdown ⇄ case-study conversion.
 *
 * Case studies are stored as `sections[] → blocks[]` (see CaseStudyBlock), which
 * is what the public renderer and the table of contents read. That shape is good
 * for rendering but miserable to author, so the admin edits markdown instead and
 * we convert on the way in and out. Storage is unchanged, so nothing on the live
 * site had to move.
 *
 * The supported subset maps 1:1 onto the three block types:
 *
 *   ## Heading          → a new section (its `id` is slugified from the text)
 *   plain paragraphs    → { type: 'paragraph', text }
 *   > quote             → { type: 'quote', text, cite }
 *   > — Attribution       (a trailing "— …" line inside a quote becomes `cite`)
 *   ![caption](src)     → { type: 'image', src, caption }
 *
 * Round-tripping is lossless for documents written in that subset.
 */

export const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* --- markdown → sections -------------------------------------------------- */

const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)]*)\)$/;

const flushParagraph = (lines, blocks) => {
  const text = lines.join('\n').trim();
  if (text) blocks.push({ type: 'paragraph', text });
  lines.length = 0;
};

const flushQuote = (lines, blocks) => {
  if (!lines.length) return;
  let cite = '';
  const body = [...lines];
  // a trailing "— Name" / "- Name" line is the attribution
  const last = (body[body.length - 1] || '').trim();
  const citeMatch = last.match(/^[—–-]\s*(.+)$/);
  if (citeMatch && body.length > 1) {
    cite = citeMatch[1].trim();
    body.pop();
  }
  const text = body.join('\n').trim();
  if (text) blocks.push({ type: 'quote', text, cite });
  lines.length = 0;
};

/**
 * `previous` is the sections array being edited. Anchor ids are stable URLs
 * (the TOC links to them), and existing ones were often hand-shortened —
 * "The problem" → #problem — so a matching heading keeps its original id
 * rather than being re-slugified out from under any existing link.
 */
export const markdownToSections = (md, previous = []) => {
  const idByHeading = new Map();
  previous.forEach((s) => {
    if (s && s.heading && s.id) idByHeading.set(s.heading.trim(), s.id);
  });

  const sections = [];
  let current = null;
  let para = [];
  let quote = [];

  const ensureSection = () => {
    if (!current) {
      // content before the first heading still needs somewhere to live
      current = { id: 'overview', heading: 'Overview', blocks: [] };
      sections.push(current);
    }
    return current;
  };

  const flushAll = () => {
    if (quote.length) flushQuote(quote, ensureSection().blocks);
    if (para.length) flushParagraph(para, ensureSection().blocks);
  };

  (md || '').split('\n').forEach((raw) => {
    const line = raw.replace(/\s+$/, '');
    const trimmed = line.trim();

    // heading → start a new section
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flushAll();
      const text = heading[1].trim();
      current = { id: idByHeading.get(text) || slugify(text), heading: text, blocks: [] };
      sections.push(current);
      return;
    }

    // quote line
    const q = trimmed.match(/^>\s?(.*)$/);
    if (q) {
      if (para.length) flushParagraph(para, ensureSection().blocks);
      quote.push(q[1]);
      return;
    }
    if (quote.length) flushQuote(quote, ensureSection().blocks);

    // standalone image
    const img = trimmed.match(IMAGE_ONLY);
    if (img) {
      if (para.length) flushParagraph(para, ensureSection().blocks);
      ensureSection().blocks.push({ type: 'image', src: img[2].trim(), caption: img[1].trim() });
      return;
    }

    // blank line ends a paragraph
    if (!trimmed) {
      if (para.length) flushParagraph(para, ensureSection().blocks);
      return;
    }

    para.push(line);
  });

  flushAll();
  return sections;
};

/* --- sections → markdown -------------------------------------------------- */

export const sectionsToMarkdown = (sections = []) =>
  sections
    .map((section) => {
      const parts = [];
      if (section.heading) parts.push(`## ${section.heading}`);

      (section.blocks || []).forEach((block) => {
        switch (block.type) {
          case 'paragraph':
            parts.push((block.text || '').trim());
            break;
          case 'quote': {
            const body = (block.text || '')
              .trim()
              .split('\n')
              .map((l) => `> ${l}`)
              .join('\n');
            parts.push(block.cite ? `${body}\n> — ${block.cite}` : body);
            break;
          }
          case 'image':
            parts.push(`![${block.caption || ''}](${block.src || ''})`);
            break;
          default:
            break;
        }
      });

      return parts.filter(Boolean).join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n');
