import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sortByPriority } from '../utils/projectPriority';

// Section keys used across the nav → the Firestore `type` they map to, plus the
// route base for links.
const TYPE_BY_SECTION = { agents: 'agent', apps: 'app', web: 'site' };
const BASE_BY_SECTION = { agents: '/agents', apps: '/apps', web: '/web' };

/**
 * Loads the top-N highest-priority projects for each nav section, joined with
 * brand, for use in the nav hover menu. Fetches all projects + brands once and
 * buckets them by type, so the menu shows the same ranking the list pages use.
 *
 * Returns { topBySection, loading } where topBySection is:
 *   { agents: [proj, …], apps: [proj, …], web: [proj, …] }
 * each already sorted by priority and sliced to `count`, with a `href` added.
 */
const useTopProjects = (count = 2) => {
  const [topBySection, setTopBySection] = useState({
    agents: [],
    apps: [],
    web: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [brandsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, 'brands')),
          getDocs(collection(db, 'projects')),
        ]);
        if (!active) return;

        const brandsById = {};
        brandsSnap.forEach((d) => {
          brandsById[d.id] = { id: d.id, ...d.data() };
        });

        const all = projectsSnap.docs.map((d) => {
          const project = { id: d.id, ...d.data() };
          return { ...project, brand: brandsById[project.brandId] || null };
        });

        const next = {};
        for (const [section, type] of Object.entries(TYPE_BY_SECTION)) {
          const base = BASE_BY_SECTION[section];
          next[section] = sortByPriority(all.filter((p) => p.type === type))
            .slice(0, count)
            .map((p) => ({ ...p, href: `${base}/${p.slug}` }));
        }

        setTopBySection(next);
      } catch (err) {
        console.error('Failed to load top projects for nav:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [count]);

  return { topBySection, loading };
};

export default useTopProjects;
