import React, { useState } from 'react';
import { Field, TextInput, Button } from './adminUI';
import { saveBrand, deleteBrand } from '../../lib/adminData';

/**
 * Manage brands. Brands use a human-readable doc id (e.g. "tarragon") that
 * projects reference via `brandId`, so the id is fixed once created — editing a
 * brand updates its name/logo/url, not its id. Shows how many projects use each
 * brand and blocks deletion of brands still in use.
 */
const BrandManager = ({ brands, projects, onChanged }) => {
  const [editing, setEditing] = useState(null); // { id, name, logo, url, _isNew }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const usageCount = (brandId) => projects.filter((p) => p.brandId === brandId).length;

  const startNew = () => {
    setEditing({ id: '', name: '', logo: '', url: '', _isNew: true });
    setError(null);
  };

  const save = async () => {
    const id = (editing.id || '').trim();
    if (!id) {
      setError('Brand id is required (e.g. "tarragon").');
      return;
    }
    if (editing._isNew && brands.some((b) => b.id === id)) {
      setError(`A brand with id "${id}" already exists.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveBrand(id, { name: editing.name, logo: editing.logo, url: editing.url });
      await onChanged();
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (brand) => {
    if (usageCount(brand.id) > 0) return;
    setSaving(true);
    try {
      await deleteBrand(brand.id);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="max-w-lg">
        <h2 className="font-heading font-bold text-xl text-dark-50 mb-4">
          {editing._isNew ? 'New brand' : `Edit ${editing.name || editing.id}`}
        </h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="rounded-xl border border-white/10 bg-dark-900 p-5">
          <Field label="Id" hint="Lowercase, no spaces. Fixed once created.">
            <TextInput
              value={editing.id}
              onChange={(v) => setEditing({ ...editing, id: v })}
              disabled={!editing._isNew}
            />
          </Field>
          <Field label="Name">
            <TextInput value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
          </Field>
          <Field label="Logo path">
            <TextInput value={editing.logo} onChange={(v) => setEditing({ ...editing, logo: v })} />
          </Field>
          <Field label="URL">
            <TextInput value={editing.url} onChange={(v) => setEditing({ ...editing, url: v })} />
          </Field>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" type="button" onClick={() => setEditing(null)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="flex justify-end mb-4">
        <Button type="button" onClick={startNew}>
          + New brand
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {brands.map((brand) => {
          const uses = usageCount(brand.id);
          return (
            <div
              key={brand.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-dark-900 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {brand.logo ? (
                  <img src={brand.logo} alt="" className="w-8 h-8 rounded object-contain bg-dark-800" />
                ) : (
                  <span className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-accent-500" />
                )}
                <div className="min-w-0">
                  <div className="text-dark-50 font-medium truncate">{brand.name || brand.id}</div>
                  <div className="font-mono text-xs text-dark-500 truncate">
                    {brand.id} · {uses} project{uses === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" type="button" onClick={() => setEditing({ ...brand })}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => remove(brand)}
                  disabled={uses > 0}
                  title={uses > 0 ? 'In use by projects' : 'Delete brand'}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandManager;
