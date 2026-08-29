import React, { useMemo, useRef, useState } from 'react';
import { Field, TextInput, TextArea, Button, inputCls } from './adminUI';
import { markdownToSections, sectionsToMarkdown } from '../../utils/caseStudyMarkdown';
import CaseStudyBlock from '../../components/caseStudy/CaseStudyBlock';
import ImageUpload from './ImageUpload';

/**
 * Case study editor: a plain markdown document, the way a Notion page or a
 * Linear ticket is written — one text surface, no block widgets or reordering
 * arrows.
 *
 * Storage is unchanged (`sections[] → blocks[]`, what the public renderer and
 * the table of contents read); markdown is only the editing surface, converted
 * on the way in and out. See utils/caseStudyMarkdown.
 */

const emptyCaseStudy = () => ({
  dek: '',
  role: '',
  featuredImage: '',
  stats: [],
  sections: [],
});

const STARTER = `## Overview

What this project is, in a couple of sentences.

## The problem

What made it hard.

## The approach

How you solved it.
`;

const CaseStudyEditor = ({ value, onChange, slug }) => {
  const [tab, setTab] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  // The markdown is derived from stored sections. Keeping the draft in local
  // state while typing avoids re-serialising on every keystroke (which would
  // fight the cursor); it's converted back to sections on each change.
  const [draft, setDraft] = useState(() => sectionsToMarkdown(value?.sections || []));

  const sections = useMemo(
    () => markdownToSections(draft, value?.sections || []),
    [draft, value?.sections]
  );

  if (!value) {
    return (
      <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
        <p className="text-sm text-dark-300 mb-3">
          This project has no case study. Adding one makes its card clickable.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setDraft(STARTER);
            onChange({ ...emptyCaseStudy(), sections: markdownToSections(STARTER) });
          }}
        >
          Add case study
        </Button>
      </div>
    );
  }

  const patch = (fields) => onChange({ ...value, ...fields });

  const setMarkdown = (md) => {
    setDraft(md);
    patch({ sections: markdownToSections(md, value.sections || []) });
  };

  /* wrap/insert helpers for the formatting bar ---------------------------- */
  const surround = (before, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value: v } = el;
    const next = v.slice(0, a) + before + v.slice(a, b) + after + v.slice(b);
    setMarkdown(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, b + before.length);
    });
  };

  const prefixLine = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: a, value: v } = el;
    const start = v.lastIndexOf('\n', a - 1) + 1;
    const next = v.slice(0, start) + prefix + v.slice(start);
    setMarkdown(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + prefix.length, a + prefix.length);
    });
  };

  const onKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === 'b') {
      e.preventDefault();
      surround('**');
    } else if (e.key === 'i') {
      e.preventDefault();
      surround('_');
    }
  };

  const stats = value.stats || [];
  const setStat = (i, key, v) =>
    patch({ stats: stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)) });
  const addStat = () => patch({ stats: [...stats, { value: '', unit: '', label: '' }] });
  const removeStat = (i) => patch({ stats: stats.filter((_, idx) => idx !== i) });

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-dark-100">Case study</h3>
        <Button type="button" variant="danger" onClick={() => onChange(null)}>
          Remove case study
        </Button>
      </div>

      {/* --- meta --- */}
      <Field label="Dek (subtitle under the title)">
        <TextArea rows={2} value={value.dek} onChange={(v) => patch({ dek: v })} />
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Role">
          <TextInput value={value.role} onChange={(v) => patch({ role: v })} />
        </Field>
        <ImageUpload
          label="Featured image"
          value={value.featuredImage}
          onChange={(v) => patch({ featuredImage: v })}
          slug={slug}
        />
      </div>

      {/* --- stats --- */}
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
            className="self-start mt-1 text-[12px] font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            + Add stat
          </button>
        </div>
      </Field>

      {/* --- the document --- */}
      <div className="mt-5">
        <div className="flex items-center gap-1 mb-2">
          <Tab active={tab === 'write'} onClick={() => setTab('write')}>
            Write
          </Tab>
          <Tab active={tab === 'preview'} onClick={() => setTab('preview')}>
            Preview
          </Tab>
          <span className="ml-auto text-[11px] text-dark-500 tabular-nums">
            {sections.length} section{sections.length === 1 ? '' : 's'} · {words} words
          </span>
        </div>

        {tab === 'write' ? (
          <>
            <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-white/10 bg-dark-950 px-1.5 py-1">
              <ToolBtn label="Heading" onClick={() => prefixLine('## ')}>H</ToolBtn>
              <ToolBtn label="Bold (⌘B)" onClick={() => surround('**')}>
                <span className="font-bold">B</span>
              </ToolBtn>
              <ToolBtn label="Italic (⌘I)" onClick={() => surround('_')}>
                <span className="italic font-serif">I</span>
              </ToolBtn>
              <ToolBtn label="Quote" onClick={() => prefixLine('> ')}>”</ToolBtn>
              <ToolBtn label="Link" onClick={() => surround('[', '](url)')}>🔗</ToolBtn>
              <ToolBtn label="Image" onClick={() => prefixLine('![caption](/assets/images/…)')}>
                🖼
              </ToolBtn>
            </div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setMarkdown(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck
              placeholder={STARTER}
              className={`${inputCls} rounded-t-none min-h-[420px] leading-relaxed font-mono text-[13px] resize-y`}
            />
            <p className="mt-2 text-[11px] text-dark-500">
              <code className="text-dark-400">##</code> starts a new section (and a table-of-contents
              entry). <code className="text-dark-400">&gt;</code> quotes — a final{' '}
              <code className="text-dark-400">— Name</code> line becomes the attribution.{' '}
              <code className="text-dark-400">![caption](/path.png)</code> embeds an image.
            </p>
          </>
        ) : (
          <Preview sections={sections} />
        )}
      </div>
    </div>
  );
};

const Tab = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
      active ? 'bg-white/[0.08] text-dark-50' : 'text-dark-400 hover:text-dark-100'
    }`}
  >
    {children}
  </button>
);

const ToolBtn = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="w-7 h-7 grid place-items-center rounded text-[12px] text-dark-400 hover:text-dark-50 hover:bg-white/[0.06] transition-colors"
  >
    {children}
  </button>
);

/* Preview renders through the real CaseStudyBlock, so what you see here is
   exactly what the public page will render. */
const Preview = ({ sections }) => {
  if (!sections.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-dark-950 p-8 text-center text-[13px] text-dark-500">
        Nothing to preview yet.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-dark-950 p-6 max-h-[520px] overflow-y-auto">
      {sections.map((section, i) => (
        <section key={section.id || i} className="mb-8 last:mb-0">
          {section.heading && (
            <h2 className="text-lg font-semibold text-dark-50 mb-3">{section.heading}</h2>
          )}
          {(section.blocks || []).map((block, j) => (
            <CaseStudyBlock key={j} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
};

export default CaseStudyEditor;
