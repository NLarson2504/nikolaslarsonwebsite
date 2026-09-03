import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sortByPriority } from '../utils/projectPriority';

/*
 * Session-lifetime cache for the projects/brands reads.
 *
 * Every consumer of useProjects held its data in component state, so the fetch
 * re-ran on each mount. Leaving the home page unmounted the wall and destroyed
 * that state; coming back re-fetched from Firestore and, because `loading`
 * started true again, re-showed "Loading the wall…" for data the session had
 * already read. The same applied to every gallery page.
 *
 * The cost was not just the wait. Wall alone calls useProjects three times
 * (sites, apps, agents) and EACH call re-read the entire brands collection, so
 * a home → web → home round trip was eight full collection reads returning
 * byte-identical data.
 *
 * Module scope is deliberately the right lifetime here. This data changes when
 * the Notion sync runs, not while someone is browsing, so a cache that lives as
 * long as the tab is both correct and the simplest thing that works — no
 * invalidation, no staleness window to reason about. A hard reload gets fresh
 * data, which is also how the admin surface is used after an edit.
 */

// type -> joined, sorted project array
const projectsByType = new Map();
// type -> in-flight promise, so concurrent mounts share one request rather than
// racing three identical queries (exactly what Wall does on first paint).
const inFlight = new Map();
// The brands collection is read once and shared by every type.
let brandsPromise = null;

const loadBrands = () => {
  if (!brandsPromise) {
    brandsPromise = getDocs(collection(db, 'brands'))
      .then((snap) => {
        const byId = {};
        snap.forEach((d) => {
          byId[d.id] = { id: d.id, ...d.data() };
        });
        return byId;
      })
      .catch((err) => {
        // Don't cache a failure: a network blip would otherwise poison every
        // later read for the life of the tab.
        brandsPromise = null;
        throw err;
      });
  }
  return brandsPromise;
};

/** Cached projects for a type, or undefined if not loaded yet. */
export const getCachedProjects = (type) => projectsByType.get(type);

/**
 * Fetch (or join an in-flight fetch for) the projects of a type.
 * Resolves to the joined, priority-sorted array.
 */
export const fetchProjects = (type) => {
  const cached = projectsByType.get(type);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(type);
  if (pending) return pending;

  const request = Promise.all([
    loadBrands(),
    getDocs(query(collection(db, 'projects'), where('type', '==', type))),
  ])
    .then(([brandsById, projectsSnap]) => {
      const projects = projectsSnap.docs.map((d) => {
        const project = { id: d.id, ...d.data() };
        return { ...project, brand: brandsById[project.brandId] || null };
      });
      const sorted = sortByPriority(projects);
      projectsByType.set(type, sorted);
      inFlight.delete(type);
      return sorted;
    })
    .catch((err) => {
      inFlight.delete(type);
      throw err;
    });

  inFlight.set(type, request);
  return request;
};

/** Drop everything — used by the admin surface after it writes. */
export const clearProjectsCache = () => {
  projectsByType.clear();
  inFlight.clear();
  brandsPromise = null;
};
