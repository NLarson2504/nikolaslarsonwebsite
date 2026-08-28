import React, { useState } from 'react';

/**
 * Linear-style app shell for the admin surface: a fixed left sidebar with the
 * workspace switcher and section nav, and a scrollable content pane with a
 * slim sticky header. Deliberately separate from the marketing chrome — the
 * public site's top nav, footer and smooth-scroll container are not mounted on
 * /admin (see App.js), so this is the whole frame.
 */

const NavItem = ({ icon, label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group w-full flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
      active
        ? 'bg-white/[0.07] text-dark-50'
        : 'text-dark-400 hover:bg-white/[0.04] hover:text-dark-100'
    }`}
  >
    <span className="w-4 h-4 flex-shrink-0 grid place-items-center text-dark-500 group-hover:text-dark-300">
      {icon}
    </span>
    <span className="truncate">{label}</span>
    {count !== undefined && (
      <span className="ml-auto font-mono text-[11px] text-dark-500 tabular-nums">
        {count}
      </span>
    )}
  </button>
);

const SectionLabel = ({ children }) => (
  <div className="px-2.5 pt-5 pb-1.5 font-medium text-[11px] tracking-wide text-dark-500">
    {children}
  </div>
);

/* --- icons: 14px stroked glyphs, matching Linear's weight ----------------- */
const Icon = {
  projects: (
    <svg viewBox="0 0 16 16" fill="none" className="w-[14px] h-[14px]">
      <rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 6.5h5M5.5 9.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  brands: (
    <svg viewBox="0 0 16 16" fill="none" className="w-[14px] h-[14px]">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  site: (
    <svg viewBox="0 0 16 16" fill="none" className="w-[14px] h-[14px]">
      <path
        d="M6 12.5H4.5A2.5 2.5 0 0 1 4.5 7.5H6M10 12.5h1.5a2.5 2.5 0 0 0 0-5H10M6 10h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 16 16" fill="none" className="w-[14px] h-[14px]">
      <path
        d="M6.5 13.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h2.5M10 10.5 12.5 8 10 5.5M12.5 8h-6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

const AdminShell = ({
  user,
  view,
  onViewChange,
  counts = {},
  title,
  actions,
  children,
  onSignOut,
  inspector,
  inspectorOpen = true,
}) => {
  const [navOpen, setNavOpen] = useState(false);

  const nav = (
    <>
      {/* workspace switcher */}
      <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
        <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-primary-400 to-accent-500 grid place-items-center text-[11px] font-bold text-dark-950 flex-shrink-0">
          NL
        </div>
        <span className="text-[13px] font-semibold text-dark-50 truncate">Nikolas Larson</span>
      </div>

      <SectionLabel>Workspace</SectionLabel>
      <NavItem
        icon={Icon.projects}
        label="Projects"
        count={counts.projects}
        active={view === 'projects'}
        onClick={() => {
          onViewChange('projects');
          setNavOpen(false);
        }}
      />
      <NavItem
        icon={Icon.brands}
        label="Brands"
        count={counts.brands}
        active={view === 'brands'}
        onClick={() => {
          onViewChange('brands');
          setNavOpen(false);
        }}
      />

      <SectionLabel>Links</SectionLabel>
      <a
        href="/"
        className="group w-full flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-dark-400 hover:bg-white/[0.04] hover:text-dark-100 transition-colors"
      >
        <span className="w-4 h-4 flex-shrink-0 grid place-items-center text-dark-500 group-hover:text-dark-300">
          {Icon.site}
        </span>
        <span className="truncate">View live site</span>
      </a>

      {/* account footer, pinned to the bottom of the rail */}
      <div className="mt-auto pt-4 border-t border-white/[0.06]">
        <div className="px-2.5 py-1.5">
          <div className="font-mono text-[11px] text-dark-500 truncate" title={user?.email}>
            {user?.email}
          </div>
        </div>
        <NavItem icon={Icon.signout} label="Sign out" onClick={onSignOut} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 antialiased font-heading">
      {/* ---- sidebar (fixed on desktop, slide-over on mobile) ---- */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[232px] flex-col px-2.5 py-3 bg-dark-900 border-r border-white/[0.06] z-30">
        {nav}
      </aside>

      {navOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-[248px] flex flex-col px-2.5 py-3 bg-dark-900 border-r border-white/[0.06] z-50">
            {nav}
          </aside>
        </>
      )}

      {/* ---- content pane: padded left for the nav rail, right for the
           inspector rail (which is fixed, so it needs reserved space). The
           header lives inside this padding, so it heads the centre column only
           — the inspector rail runs full-height beside it, not under it. ---- */}
      <div className={`md:pl-[232px] ${inspectorOpen ? 'lg:pr-[292px]' : 'lg:pr-14'}`}>
        <header className="sticky top-0 z-20 flex items-center gap-3 h-[52px] px-4 md:px-6 bg-gradient-to-b from-dark-950 via-dark-950/85 to-transparent pointer-events-none [&>*]:pointer-events-auto">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="md:hidden -ml-1 p-1.5 rounded-md text-dark-400 hover:text-dark-100 hover:bg-white/[0.05] transition-colors"
            aria-label="Open navigation"
          >
            {Icon.menu}
          </button>
          <h1 className="text-[13px] font-semibold text-dark-100 truncate">{title}</h1>
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </header>

        <main className="px-4 md:px-6 py-6 max-w-[1100px]">{children}</main>
      </div>

      {/* ---- inspector rail (third column) ---- */}
      {inspector}
    </div>
  );
};

export default AdminShell;
