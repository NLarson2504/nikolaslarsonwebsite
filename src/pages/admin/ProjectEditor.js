import React, { useState } from 'react';
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  StringListEditor,
  Button,
} from './adminUI';
import CaseStudyEditor from './CaseStudyEditor';
import { computePriority } from '../../utils/projectPriority';

/**
 * Full editor for a single project: shared fields, type-specific fields, and
 * the case study editor. `project` is the working copy; edits are lifted via
 * onChange. Save/delete/cancel are handled by the parent.
 */

const TYPE_OPTIONS = [
  { value: 'agent', label: 'Agent' },
  { value: 'app', label: 'App' },
  { value: 'site', label: 'Web / Site' },
];

const STATUS_OPTIONS = [
  'Production',
  'Active - Maintained',
  'Active — Not Maintained',
  'Live',
  'In Progress',
  'Not Active',
  'Idea',
].map((s) => ({ value: s, label: s }));

const slugify = (s) =>
  (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ProjectEditor = ({ project, brands, onChange, onSave, onDelete, onCancel, saving }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (fields) => onChange({ ...project, ...fields });

  const brandOptions = [
    { value: '', label: '— none —' },
    ...brands.map((b) => ({ value: b.id, label: b.name || b.id })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-2xl text-dark-50">
            {project.title || 'Untitled project'}
          </h2>
          <p className="font-mono text-xs text-dark-400 mt-1">
            Priority score: <span className="text-primary-400">{computePriority(project)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Core fields */}
      <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <TextInput
              value={project.title}
              onChange={(v) =>
                set({ title: v, slug: project.slug || slugify(v) })
              }
            />
          </Field>
          <Field label="Slug" hint="URL segment, e.g. /agents/lira">
            <TextInput value={project.slug} onChange={(v) => set({ slug: slugify(v) })} />
          </Field>
          <Field label="Type">
            <Select value={project.type} onChange={(v) => set({ type: v })} options={TYPE_OPTIONS} />
          </Field>
          <Field label="Brand">
            <Select value={project.brandId} onChange={(v) => set({ brandId: v })} options={brandOptions} />
          </Field>
          <Field label="Status">
            <Select value={project.status} onChange={(v) => set({ status: v })} options={STATUS_OPTIONS} />
          </Field>
          <Field label="Order" hint="Tiebreaker when priority scores are equal">
            <TextInput
              value={project.order ?? 0}
              onChange={(v) => set({ order: Number(v) || 0 })}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-x-8 mt-2">
          <Toggle
            label="Featured (force to top of ranking)"
            checked={Boolean(project.featured)}
            onChange={(v) => set({ featured: v })}
          />
          <Toggle
            label="Professional (real client/company work)"
            checked={Boolean(project.professional)}
            onChange={(v) => set({ professional: v })}
          />
        </div>

        <Field label="Description">
          <TextArea rows={4} value={project.description} onChange={(v) => set({ description: v })} />
        </Field>

        <TypeSpecificFields project={project} set={set} />

        <div className="grid md:grid-cols-2 gap-6 mt-2">
          <Field label="Features">
            <StringListEditor
              items={project.features || []}
              onChange={(v) => set({ features: v })}
              placeholder="A key feature"
            />
          </Field>
          <Field label="Technologies">
            <StringListEditor
              items={project.technologies || []}
              onChange={(v) => set({ technologies: v })}
              placeholder="e.g. Ruby on Rails"
            />
          </Field>
        </div>
      </div>

      {/* Case study */}
      <CaseStudyEditor value={project.caseStudy || null} onChange={(cs) => set({ caseStudy: cs })} />

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5">
        {confirmDelete ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-dark-200">
              Delete <strong>{project.title}</strong>? This can’t be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
              <Button variant="danger" type="button" onClick={onDelete} disabled={saving}>
                Delete for good
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" type="button" onClick={() => setConfirmDelete(true)}>
            Delete project
          </Button>
        )}
      </div>
    </div>
  );
};

const TypeSpecificFields = ({ project, set }) => {
  if (project.type === 'app') {
    return (
      <>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Platform">
            <TextInput value={project.platform} onChange={(v) => set({ platform: v })} />
          </Field>
          <Field label="Icon path">
            <TextInput value={project.icon} onChange={(v) => set({ icon: v })} />
          </Field>
          <Field label="App Store URL">
            <TextInput value={project.appStoreUrl} onChange={(v) => set({ appStoreUrl: v })} />
          </Field>
          <Field label="Play Store URL">
            <TextInput value={project.playStoreUrl} onChange={(v) => set({ playStoreUrl: v })} />
          </Field>
        </div>
        <Field label="Screenshot paths">
          <StringListEditor
            items={project.screenshots || []}
            onChange={(v) => set({ screenshots: v })}
            placeholder="/assets/images/mobile/…"
          />
        </Field>
      </>
    );
  }

  if (project.type === 'site') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Live URL">
          <TextInput value={project.url} onChange={(v) => set({ url: v })} />
        </Field>
        <Field label="Repository URL">
          <TextInput value={project.repositoryUrl} onChange={(v) => set({ repositoryUrl: v })} />
        </Field>
        <Field label="Preview image path">
          <TextInput value={project.image} onChange={(v) => set({ image: v })} />
        </Field>
        <Field label="Category">
          <TextInput value={project.category} onChange={(v) => set({ category: v })} />
        </Field>
      </div>
    );
  }

  // agent
  return (
    <Field label="Icon path">
      <TextInput value={project.icon} onChange={(v) => set({ icon: v })} />
    </Field>
  );
};

export default ProjectEditor;
