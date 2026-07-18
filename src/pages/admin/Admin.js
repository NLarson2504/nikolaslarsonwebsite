import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { signInWithGoogle, signOut } from '../../lib/adminAuth';
import {
  fetchAllProjects,
  fetchAllBrands,
  createProject,
  saveProject,
  deleteProject,
} from '../../lib/adminData';
import { sortByPriority, computePriority } from '../../utils/projectPriority';
import { Button } from './adminUI';
import ProjectEditor from './ProjectEditor';
import BrandManager from './BrandManager';

const TYPE_LABELS = { agent: 'Agents', app: 'Apps', site: 'Web' };

const blankProject = () => ({
  type: 'agent',
  title: '',
  slug: '',
  brandId: '',
  status: 'Idea',
  order: 0,
  featured: false,
  professional: false,
  description: '',
  features: [],
  technologies: [],
});

const Admin = () => {
  const { user, admin, loading } = useAuth();

  if (loading) {
    return <Centered>Checking sign-in…</Centered>;
  }

  if (!user) {
    return (
      <Centered>
        <div className="text-center max-w-sm">
          <h1 className="font-heading font-bold text-3xl text-dark-50 mb-2">Admin</h1>
          <p className="text-dark-300 mb-6">Sign in to manage projects.</p>
          <Button type="button" onClick={() => signInWithGoogle().catch(console.error)}>
            Sign in with Google
          </Button>
        </div>
      </Centered>
    );
  }

  if (!admin) {
    return (
      <Centered>
        <div className="text-center max-w-sm">
          <h1 className="font-heading font-bold text-2xl text-dark-50 mb-2">Not authorized</h1>
          <p className="text-dark-300 mb-6">
            {user.email} doesn’t have admin access.
          </p>
          <Button variant="ghost" type="button" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </Centered>
    );
  }

  return <AdminDashboard user={user} />;
};

const AdminDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // working copy or null
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('projects'); // 'projects' | 'brands'

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([fetchAllProjects(), fetchAllBrands()]);
      setProjects(p);
      setBrands(b);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const grouped = useMemo(() => {
    const g = { agent: [], app: [], site: [] };
    projects.forEach((p) => {
      if (g[p.type]) g[p.type].push(p);
    });
    Object.keys(g).forEach((k) => (g[k] = sortByPriority(g[k])));
    return g;
  }, [projects]);

  const startNew = () => {
    setEditing(blankProject());
    setIsNew(true);
    setError(null);
  };
  const startEdit = (p) => {
    setEditing({ ...p });
    setIsNew(false);
    setError(null);
  };
  const cancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing.title || !editing.slug) {
      setError('Title and slug are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) await createProject(editing);
      else await saveProject(editing.id, editing);
      await reload();
      setEditing(null);
      setIsNew(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await deleteProject(editing.id);
      await reload();
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-dark-950 border-t border-white/5 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl text-dark-50">Admin</h1>
            <nav className="flex gap-1 ml-2">
              {['projects', 'brands'].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    cancel();
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    view === v ? 'bg-white/10 text-dark-50' : 'text-dark-400 hover:text-dark-100'
                  }`}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-dark-400 hidden sm:inline">{user.email}</span>
            <Button variant="ghost" type="button" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-dark-300">Loading…</p>
        ) : view === 'brands' ? (
          <BrandManager brands={brands} projects={projects} onChanged={reload} />
        ) : editing ? (
          <ProjectEditor
            project={editing}
            brands={brands}
            onChange={setEditing}
            onSave={save}
            onDelete={remove}
            onCancel={cancel}
            saving={saving}
          />
        ) : (
          <ProjectList grouped={grouped} onNew={startNew} onEdit={startEdit} />
        )}
      </div>
    </div>
  );
};

const ProjectList = ({ grouped, onNew, onEdit }) => (
  <div>
    <div className="flex justify-end mb-4">
      <Button type="button" onClick={onNew}>
        + New project
      </Button>
    </div>
    <div className="flex flex-col gap-8">
      {Object.entries(TYPE_LABELS).map(([type, label]) => (
        <section key={type}>
          <h2 className="font-mono text-xs tracking-wider uppercase text-dark-400 mb-3">
            {label} · {grouped[type].length}
          </h2>
          <div className="flex flex-col gap-2">
            {grouped[type].length === 0 && (
              <p className="text-sm text-dark-500">No projects.</p>
            )}
            {grouped[type].map((p) => (
              <button
                key={p.id}
                onClick={() => onEdit(p)}
                className="group flex items-center justify-between gap-4 text-left rounded-lg border border-white/10 bg-dark-900 hover:border-white/20 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-dark-50 font-medium truncate">{p.title}</span>
                    {p.featured && (
                      <span className="text-primary-400 text-xs" title="Featured">★</span>
                    )}
                    {p.caseStudy && (
                      <span className="font-mono text-[10px] tracking-wide uppercase text-dark-500 border border-white/10 rounded px-1.5 py-0.5">
                        case study
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-dark-500 mt-0.5 truncate">
                    {p.slug} · {p.status || 'no status'}
                  </div>
                </div>
                <span className="font-mono text-xs text-primary-400 flex-shrink-0">
                  {computePriority(p)}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

const Centered = ({ children }) => (
  <div className="bg-dark-950 border-t border-white/5 min-h-screen grid place-items-center px-4 text-dark-300">
    {children}
  </div>
);

export default Admin;
