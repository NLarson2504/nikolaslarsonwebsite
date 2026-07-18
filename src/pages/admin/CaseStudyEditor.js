import React from 'react';
import { Field, TextInput, TextArea, Button } from './adminUI';

/**
 * Editor for a project's `caseStudy` object: dek, role, featured image, stats,
 * and an ordered list of sections, each with an ordered list of typed blocks
 * (paragraph / quote / image). Edits are lifted to the parent via onChange.
 *
 * `value` is the caseStudy object (or null when the project has none).
 */
const emptyCaseStudy = () => ({
  dek: '',
  role: '',
  featuredImage: '',
  stats: [],
  sections: [],
});

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CaseStudyEditor = ({ value, onChange }) => {
  if (!value) {
    return (
      <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
        <p className="text-sm text-dark-300 mb-3">
          This project has no case study. Adding one makes its card clickable.
        </p>
        <Button type="button" variant="ghost" onClick={() => onChange(emptyCaseStudy())}>
          + Add case study
        </Button>
      </div>
    );
  }

  const patch = (fields) => onChange({ ...value, ...fields });

  // --- stats ---
  const stats = value.stats || [];
  const setStat = (i, key, v) => {
    const next = stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s));
    patch({ stats: next });
  };
  const addStat = () => patch({ stats: [...stats, { value: '', unit: '', label: '' }] });
  const removeStat = (i) => patch({ stats: stats.filter((_, idx) => idx !== i) });

  // --- sections ---
  const sections = value.sections || [];
  const setSection = (i, fields) =>
    patch({ sections: sections.map((s, idx) => (idx === i ? { ...s, ...fields } : s)) });
  const addSection = () =>
    patch({
      sections: [...sections, { id: `section-${sections.length + 1}`, heading: '', blocks: [] }],
    });
  const removeSection = (i) => patch({ sections: sections.filter((_, idx) => idx !== i) });
  const moveSection = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ sections: next });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg text-dark-50">Case study</h3>
        <Button type="button" variant="danger" onClick={() => onChange(null)}>
          Remove case study
        </Button>
      </div>

      <Field label="Dek (subtitle under the title)">
        <TextArea rows={2} value={value.dek} onChange={(v) => patch({ dek: v })} />
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Role">
          <TextInput value={value.role} onChange={(v) => patch({ role: v })} />
        </Field>
        <Field label="Featured image path" hint="e.g. /assets/images/web/foo.png">
          <TextInput value={value.featuredImage} onChange={(v) => patch({ featuredImage: v })} />
        </Field>
      </div>

      {/* Stats */}
      <Field label="Stats (metric row)">
        <div className="flex flex-col gap-2">
          {stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
              <TextInput value={stat.value} onChange={(v) => setStat(i, 'value', v)} placeholder="30" />
              <TextInput value={stat.unit} onChange={(v) => setStat(i, 'unit', v)} placeholder="→ 60s" />
              <TextInput value={stat.label} onChange={(v) => setStat(i, 'label', v)} placeholder="Per-invoice time" />
              <button
                type="button"
                onClick={() => removeStat(i)}
                className="px-3 py-2 rounded-lg border border-white/10 text-dark-400 hover:text-red-400 hover:border-red-400/40 transition-colors"
                aria-label="Remove stat"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStat}
            className="self-start mt-1 font-mono text-xs tracking-wide uppercase text-primary-400 hover:text-primary-300 transition-colors"
          >
            + Add stat
          </button>
        </div>
      </Field>

      {/* Sections */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] tracking-wider uppercase text-dark-400">
            Sections
          </span>
          <button
            type="button"
            onClick={addSection}
            className="font-mono text-xs tracking-wide uppercase text-primary-400 hover:text-primary-300 transition-colors"
          >
            + Add section
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <SectionEditor
              key={i}
              index={i}
              total={sections.length}
              section={section}
              onChange={(fields) => setSection(i, fields)}
              onRemove={() => removeSection(i)}
              onMove={(dir) => moveSection(i, dir)}
              slugify={slugify}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- one section, with its blocks ------------------------------------------

const SectionEditor = ({ index, total, section, onChange, onRemove, onMove, slugify }) => {
  const blocks = section.blocks || [];
  const setBlock = (i, fields) =>
    onChange({ blocks: blocks.map((b, idx) => (idx === i ? { ...b, ...fields } : b)) });
  const addBlock = (type) => {
    const base = { paragraph: { text: '' }, quote: { text: '', cite: '' }, image: { src: '', caption: '' } }[type];
    onChange({ blocks: [...blocks, { type, ...base }] });
  };
  const removeBlock = (i) => onChange({ blocks: blocks.filter((_, idx) => idx !== i) });
  const moveBlock = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ blocks: next });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-dark-950 p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 grid md:grid-cols-2 gap-3">
          <Field label="Heading">
            <TextInput
              value={section.heading}
              onChange={(v) =>
                onChange({ heading: v, id: section.id || slugify(v) })
              }
            />
          </Field>
          <Field label="Anchor id" hint="Used in the URL / table of contents">
            <TextInput value={section.id} onChange={(v) => onChange({ id: slugify(v) })} />
          </Field>
        </div>
        <div className="flex flex-col gap-1 pt-6">
          <MoveBtns index={index} total={total} onMove={onMove} />
          <button
            type="button"
            onClick={onRemove}
            className="px-2 py-1 rounded border border-white/10 text-dark-400 hover:text-red-400 hover:border-red-400/40 text-xs transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-3 pl-1">
        {blocks.map((block, i) => (
          <div key={i} className="rounded border border-white/5 bg-dark-900 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-wider uppercase text-dark-500">
                {block.type}
              </span>
              <div className="flex items-center gap-1">
                <MoveBtns index={i} total={blocks.length} onMove={(dir) => moveBlock(i, dir)} small />
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="px-2 py-0.5 rounded text-dark-400 hover:text-red-400 text-xs transition-colors"
                  aria-label="Remove block"
                >
                  ×
                </button>
              </div>
            </div>
            <BlockFields block={block} onChange={(fields) => setBlock(i, fields)} />
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-3 pl-1">
        {['paragraph', 'quote', 'image'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addBlock(t)}
            className="font-mono text-[11px] tracking-wide uppercase text-primary-400 hover:text-primary-300 transition-colors"
          >
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
};

const BlockFields = ({ block, onChange }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <TextArea rows={4} value={block.text} onChange={(v) => onChange({ text: v })} placeholder="Paragraph text…" />
      );
    case 'quote':
      return (
        <div className="flex flex-col gap-2">
          <TextArea rows={3} value={block.text} onChange={(v) => onChange({ text: v })} placeholder="Quote…" />
          <TextInput value={block.cite} onChange={(v) => onChange({ cite: v })} placeholder="Attribution (optional)" />
        </div>
      );
    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <TextInput value={block.src} onChange={(v) => onChange({ src: v })} placeholder="/assets/images/… (leave blank for placeholder)" />
          <TextInput value={block.caption} onChange={(v) => onChange({ caption: v })} placeholder="Caption (optional)" />
        </div>
      );
    default:
      return null;
  }
};

const MoveBtns = ({ index, total, onMove, small }) => {
  const cls = `rounded border border-white/10 text-dark-400 hover:text-dark-50 transition-colors disabled:opacity-30 ${
    small ? 'px-1.5 text-xs' : 'px-2 py-0.5 text-xs'
  }`;
  return (
    <div className={`flex ${small ? 'gap-0.5' : 'gap-1'}`}>
      <button type="button" className={cls} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
        ↑
      </button>
      <button
        type="button"
        className={cls}
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="Move down"
      >
        ↓
      </button>
    </div>
  );
};

export default CaseStudyEditor;
