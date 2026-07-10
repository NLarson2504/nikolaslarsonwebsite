import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
 * Returns { data, loading, error }, sorted by `order` ascending.
 */
const useProjects = (type) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch brands once and index by id for an in-memory join. This avoids
        // an N+1 of per-project brand reads and keeps brand info edited in one
        // place.
        const brandsSnap = await getDocs(collection(db, 'brands'));
        const brandsById = {};
        brandsSnap.forEach((d) => {
          brandsById[d.id] = { id: d.id, ...d.data() };
        });

        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('type', '==', type))
        );
        if (!active) return;

        const projects = projectsSnap.docs
          .map((d) => {
            const project = { id: d.id, ...d.data() };
            return { ...project, brand: brandsById[project.brandId] || null };
          })
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setData(projects);
      } catch (err) {
        if (!active) return;
        console.error(`Failed to load "${type}" projects from Firestore:`, err);
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [type]);

  return { data, loading, error };
};

export default useProjects;
