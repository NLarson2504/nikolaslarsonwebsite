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
import AdminShell from './AdminShell';
import AdminInspector from './AdminInspector';

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
  // inspector collapse is a per-viewer preference, so it survives reloads
  const [inspectorOpen, setInspectorOpen] = useState(() => {
    try {
      return localStorage.getItem('admin:inspector') !== 'closed';
    } catch {
      return true;
    }
  });

  const toggleInspector = useCallback(() => {
    setInspectorOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin:inspector', next ? 'open' : 'closed');
      } catch {
        /* storage unavailable (private mode) — the toggle still works in-session */
      }
      return next;
    });
  }, []);

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

  // header title + actions track what's on screen, the way Linear's header
  // reflects the active view rather than staying static
  const title = editing
    ? isNew
      ? 'New project'
      : editing.title || 'Untitled project'
    : view === 'brands'
    ? 'Brands'
    : 'Projects';

  const actions =
    !editing && view === 'projects' ? (
      <Button type="button" onClick={startNew}>
        New project
      </Button>
    ) : null;

  return (
    <AdminShell
      user={user}
      view={view}
      onViewChange={(v) => {
        setView(v);
        cancel();
      }}
      counts={{ projects: projects.length, brands: brands.length }}
      title={title}
      actions={actions}
      onSignOut={() => signOut()}
      inspectorOpen={inspectorOpen}
      inspector={
        <AdminInspector
          open={inspectorOpen}
          onToggle={toggleInspector}
          editing={view === 'projects' ? editing : null}
          projects={projects}
          brands={brands}
          view={view}
        />
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-dark-400 text-sm">Loading…</p>
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
        <ProjectList grouped={grouped} onEdit={startEdit} />
      )}
    </AdminShell>
  );
};

/* Linear-style grouped issue list: a sticky group header per type, then flush
   full-bleed rows separated by hairlines (no cards, no gaps). */
const ProjectList = ({ grouped, onEdit }) => (
  <div className="rounded-lg border border-white/[0.06] overflow-hidden">
    {Object.entries(TYPE_LABELS).map(([type, label]) => (
      <section key={type}>
        <div className="flex items-center gap-2 bg-dark-900 px-4 py-2 border-b border-white/[0.06]">
          <h2 className="text-[12px] font-semibold text-dark-200">{label}</h2>
          <span className="font-mono text-[11px] text-dark-500 tabular-nums">
            {grouped[type].length}
          </span>
        </div>

        {grouped[type].length === 0 ? (
          <p className="px-4 py-3 text-[13px] text-dark-500 border-b border-white/[0.06]">
            No projects.
          </p>
        ) : (
          grouped[type].map((p) => (
            <button
              key={p.id}
              onClick={() => onEdit(p)}
              className="group w-full flex items-center gap-3 text-left px-4 py-2.5 border-b border-white/[0.06] bg-dark-950 hover:bg-white/[0.03] transition-colors"
            >
              <StatusDot status={p.status} />

              <span className="text-[13px] text-dark-100 font-medium truncate">
                {p.title}
              </span>
              {p.featured && (
                <span className="text-primary-400 text-[11px] flex-shrink-0" title="Featured">
                  ★
                </span>
              )}
              {p.caseStudy && (
                <span className="hidden sm:inline font-mono text-[10px] tracking-wide uppercase text-dark-500 border border-white/10 rounded px-1.5 py-0.5 flex-shrink-0">
                  case study
                </span>
              )}

              <span className="ml-auto flex items-center gap-3 flex-shrink-0">
                <span className="hidden sm:inline font-mono text-[11px] text-dark-500 truncate max-w-[180px]">
                  {p.slug}
                </span>
                <span className="font-mono text-[11px] text-dark-400 tabular-nums w-8 text-right">
                  {computePriority(p)}
                </span>
              </span>
            </button>
          ))
        )}
      </section>
    ))}
  </div>
);

/* status pill borrowed from Linear's issue-state dots */
const STATUS_COLORS = {
  Live: 'bg-success-500',
  Building: 'bg-primary-400',
  Idea: 'bg-dark-600',
};

const StatusDot = ({ status }) => (
  <span
    title={status || 'No status'}
    className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
      STATUS_COLORS[status] || 'bg-dark-600'
    }`}
  />
);

const Centered = ({ children }) => (
  <div className="bg-dark-950 border-t border-white/5 min-h-screen grid place-items-center px-4 text-dark-300">
    {children}
  </div>
);

export default Admin;
