import { useEffect, useState } from 'react';
import { fetchProjects, getCachedProjects } from './projectsCache';

/**
 * Loads projects of a given type from the single `projects` collection and
 * joins each with its brand from the `brands` collection.
 *
 * Data model:
 *   brands/{brandId}     -> { name, logo, url, ... }
 *   projects/{projectId} -> { type: 'agent'|'app'|'site', brandId, order, ... }
 *
 * A project may reference a brand that is shared across types (e.g. Tarragon
 * has agents, an app, and a site). The joined brand is exposed as `project.brand`.
 *
 * Reads are cached for the life of the tab (see projectsCache). The important
 * consequence is the SYNCHRONOUS seed below: once a type has been loaded, a
 * later mount starts with the data already in hand and `loading` false, so
 * returning to a page never re-shows its loading state. Seeding in an effect
 * instead would still render one frame with `loading` true — enough to flash
 * "Loading the wall…" on every return to the home page, which is the whole
 * problem this exists to fix.
 *
 * Returns { data, loading, error }, sorted by priority.
 */
const useProjects = (type) => {
  // Synchronous seed: already-cached data is present on the very first render.
  const cached = getCachedProjects(type);
  const [data, setData] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const hit = getCachedProjects(type);
    if (hit) {
      // Cache hit (including a type switch on an already-loaded type): adopt it
      // without ever entering the loading state.
      setData(hit);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    fetchProjects(type)
      .then((projects) => {
        if (!active) return;
        setData(projects);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error(`Failed to load "${type}" projects from Firestore:`, err);
        setError(err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type]);

  return { data, loading, error };
};

export default useProjects;
