import React from 'react';
import { PRIORITY_WEIGHTS, computePriority, sortByPriority } from '../../utils/projectPriority';

/**
 * Right-hand inspector rail: a rounded glassy panel of read-only context for
 * whatever is selected in the centre column — properties, a priority-score
 * breakdown, and quick links. Collapsible to a slim icon rail so the editor can
 * take the full width when you don't need it.
 */

/* --- primitives ---------------------------------------------------------- */

const Section = ({ title, children }) => (
  <section className="px-4 py-3.5 border-b border-white/[0.06] last:border-b-0">
    <h3 className="text-[11px] font-semibold tracking-wide text-dark-500 mb-2.5">
      {title}
    </h3>
    {children}
  </section>
);

const Row = ({ label, children }) => (
  <div className="flex items-baseline gap-3 py-[5px]">
    <span className="text-[12px] text-dark-500 w-[86px] flex-shrink-0">{label}</span>
    <span className="text-[12px] text-dark-100 min-w-0 flex-1">{children}</span>
  </div>
);

const Empty = () => <span className="text-dark-600">—</span>;

const Pill = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'border-white/10 text-dark-300',
    good: 'border-success-500/30 text-success-400 bg-success-500/10',
    info: 'border-primary-500/30 text-primary-300 bg-primary-500/10',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

/* --- priority breakdown --------------------------------------------------
 * The score is a weighted sum (see utils/projectPriority). Showing each factor's
 * contribution turns an opaque number into something you can act on. */
const PriorityBreakdown = ({ project }) => {
  const total = computePriority(project);
  const factors = [
    { key: 'status', label: 'Status', on: Boolean(project.status), note: project.status || 'unset' },
    { key: 'featured', label: 'Featured', on: Boolean(project.featured) },
    { key: 'caseStudy', label: 'Case study', on: Boolean(project.caseStudy) },
    { key: 'recency', label: 'Recency', on: Boolean(project.endDate || project.date), note: project.endDate || project.date || 'no date' },
    { key: 'professional', label: 'Professional', on: Boolean(project.professional) },
  ];

  return (
    <>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-mono text-2xl text-dark-50 tabular-nums leading-none">{total}</span>
        <span className="text-[11px] text-dark-500">/ 100</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-[width] duration-500"
          style={{ width: `${total}%` }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {factors.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                f.on ? 'bg-primary-400' : 'bg-dark-700'
              }`}
            />
            <span className={`text-[12px] ${f.on ? 'text-dark-200' : 'text-dark-500'}`}>
              {f.label}
            </span>
            {f.note && (
              <span className="text-[11px] text-dark-600 truncate ml-0.5">{f.note}</span>
            )}
            <span className="ml-auto font-mono text-[11px] text-dark-500 tabular-nums flex-shrink-0">
              {Math.round(PRIORITY_WEIGHTS[f.key] * 100)}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

/* --- panel bodies per view ----------------------------------------------- */

const ProjectInspector = ({ project, brands }) => {
  const brand = brands.find((b) => b.id === project.brandId);
  const TYPE_PATH = { agent: 'agents', app: 'apps', site: 'web' };
  const livePath = project.slug ? `/${TYPE_PATH[project.type] || 'web'}/${project.slug}` : null;

  return (
    <>
      <Section title="Properties">
        <Row label="Type">{project.type || <Empty />}</Row>
        <Row label="Status">
          {project.status ? <Pill tone="good">{project.status}</Pill> : <Empty />}
        </Row>
        <Row label="Brand">{brand?.name || project.brandId || <Empty />}</Row>
        <Row label="Slug">
          <span className="font-mono text-[11px] text-dark-300 break-all">
            {project.slug || <Empty />}
          </span>
        </Row>
        <Row label="Order">
          <span className="font-mono tabular-nums">{project.order ?? 0}</span>
        </Row>
        <Row label="Flags">
          <span className="flex flex-wrap gap-1">
            {project.featured && <Pill tone="info">Featured</Pill>}
            {project.professional && <Pill>Professional</Pill>}
            {project.caseStudy && <Pill>Case study</Pill>}
            {!project.featured && !project.professional && !project.caseStudy && <Empty />}
          </span>
        </Row>
      </Section>

      <Section title="Priority">
        <PriorityBreakdown project={project} />
      </Section>

      <Section title="Content">
        <Row label="Features">
          <span className="font-mono tabular-nums">{(project.features || []).length}</span>
        </Row>
        <Row label="Tech">
          <span className="font-mono tabular-nums">{(project.technologies || []).length}</span>
        </Row>
        <Row label="Description">
          <span className="font-mono tabular-nums">
            {(project.description || '').trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </Row>
      </Section>

      <Section title="Links">
        <div className="flex flex-col gap-1">
          {livePath ? (
            <InspectorLink href={livePath}>View on site</InspectorLink>
          ) : (
            <p className="text-[12px] text-dark-600">Add a slug to get a live link.</p>
          )}
          {project.liveUrl && <InspectorLink href={project.liveUrl}>Live URL</InspectorLink>}
          {project.repoUrl && <InspectorLink href={project.repoUrl}>Repository</InspectorLink>}
        </div>
      </Section>
    </>
  );
};

const InspectorLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-2 text-[12px] text-primary-400 hover:text-primary-300 py-1 transition-colors"
  >
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <path
        d="M6.5 3.5H4A1.5 1.5 0 0 0 2.5 5v7A1.5 1.5 0 0 0 4 13.5h7a1.5 1.5 0 0 0 1.5-1.5V9.5M9 3.5h4v4M13 3.5 7 9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="truncate">{children}</span>
  </a>
);

/* --- details for the list views ------------------------------------------
 * No project selected, so the rail describes the view you're actually looking
 * at: the composition of that list and where its ranking sits. */

const Bar = ({ label, value, total }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="py-[5px]">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[12px] text-dark-300">{label}</span>
        <span className="ml-auto font-mono text-[11px] text-dark-400 tabular-nums">
          {value}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500/70 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const TYPE_LABELS = { agent: 'Agents', app: 'Apps', site: 'Web' };

const ProjectsViewInspector = ({ projects }) => {
  const byType = { agent: 0, app: 0, site: 0 };
  let featured = 0;
  let caseStudies = 0;
  projects.forEach((p) => {
    if (byType[p.type] !== undefined) byType[p.type] += 1;
    if (p.featured) featured += 1;
    if (p.caseStudy) caseStudies += 1;
  });

  const ranked = sortByPriority(projects).slice(0, 5);
  const total = projects.length;

  return (
    <>
      <Section title="This view">
        <Row label="Projects">
          <span className="font-mono tabular-nums">{total}</span>
        </Row>
        <Row label="Featured">
          <span className="font-mono tabular-nums">{featured}</span>
        </Row>
        <Row label="Case studies">
          <span className="font-mono tabular-nums">
            {caseStudies}
            <span className="text-dark-600"> / {total}</span>
          </span>
        </Row>
      </Section>

      <Section title="By type">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <Bar key={type} label={label} value={byType[type]} total={total} />
        ))}
      </Section>

      <Section title="Top ranked">
        <ol className="flex flex-col gap-1.5">
          {ranked.length === 0 && <p className="text-[12px] text-dark-600">No projects yet.</p>}
          {ranked.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] text-dark-600 w-3 flex-shrink-0 tabular-nums">
                {i + 1}
              </span>
              <span className="text-[12px] text-dark-200 truncate">{p.title}</span>
              <span className="ml-auto font-mono text-[11px] text-primary-400 tabular-nums flex-shrink-0">
                {computePriority(p)}
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
};

const BrandsViewInspector = ({ brands, projects }) => {
  const usage = brands
    .map((b) => ({ ...b, count: projects.filter((p) => p.brandId === b.id).length }))
    .sort((a, b) => b.count - a.count);
  const unassigned = projects.filter((p) => !p.brandId).length;
  const total = projects.length;

  return (
    <>
      <Section title="This view">
        <Row label="Brands">
          <span className="font-mono tabular-nums">{brands.length}</span>
        </Row>
        <Row label="Unassigned">
          <span className="font-mono tabular-nums">
            {unassigned}
            <span className="text-dark-600"> / {total}</span>
          </span>
        </Row>
      </Section>

      <Section title="Projects per brand">
        {usage.length === 0 && <p className="text-[12px] text-dark-600">No brands yet.</p>}
        {usage.map((b) => (
          <Bar key={b.id} label={b.name || b.id} value={b.count} total={total} />
        ))}
      </Section>
    </>
  );
};

/* --- the rail ------------------------------------------------------------- */

const AdminInspector = ({ open, onToggle, editing, projects, brands, view }) => {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Show details"
        aria-label="Show details"
        className="hidden lg:flex fixed top-3 right-4 z-30 w-9 h-9 items-center justify-center rounded-lg border border-white/10 bg-dark-900/70 backdrop-blur-md text-dark-400 hover:text-dark-100 hover:border-white/20 transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
          <rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 2.5v11" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
    );
  }

  return (
    <aside className="hidden lg:block fixed inset-y-0 right-0 w-[292px] p-3 z-30">
      <div className="h-full flex flex-col rounded-xl border border-white/10 bg-dark-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-[42px] border-b border-white/[0.06] flex-shrink-0">
          <span className="text-[12px] font-semibold text-dark-200">
            {editing ? 'Details' : view === 'brands' ? 'Brands' : 'Projects'}
          </span>
          <button
            type="button"
            onClick={onToggle}
            title="Hide details"
            aria-label="Hide details"
            className="ml-auto -mr-1 p-1 rounded text-dark-500 hover:text-dark-100 hover:bg-white/[0.06] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M6 4.5 9.5 8 6 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {editing ? (
            <ProjectInspector project={editing} brands={brands} />
          ) : view === 'brands' ? (
            <BrandsViewInspector brands={brands} projects={projects} />
          ) : (
            <ProjectsViewInspector projects={projects} />
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminInspector;
