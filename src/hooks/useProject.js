import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Loads a single project of a given type by its `slug`, joined with its brand.
 *
 * Mirrors useProjects (see that file for the data model). Returns
 * { data, loading, error, notFound }:
 *  - notFound is true when the query succeeds but no project matches the slug,
 *    so callers can render a 404-style state instead of an error.
 */
const useProject = (type, slug) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const snap = await getDocs(
          query(
            collection(db, 'projects'),
            where('type', '==', type),
            where('slug', '==', slug),
            limit(1)
          )
        );
        if (!active) return;

        if (snap.empty) {
          setData(null);
          setNotFound(true);
          return;
        }

        const projectDoc = snap.docs[0];
        const project = { id: projectDoc.id, ...projectDoc.data() };

        // Join the brand referenced by the project, if any.
        if (project.brandId) {
          const brandSnap = await getDoc(doc(db, 'brands', project.brandId));
          if (!active) return;
          project.brand = brandSnap.exists()
            ? { id: brandSnap.id, ...brandSnap.data() }
            : null;
        } else {
          project.brand = null;
        }

        setData(project);
      } catch (err) {
        if (!active) return;
        console.error(`Failed to load ${type} "${slug}" from Firestore:`, err);
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [type, slug]);

  return { data, loading, error, notFound };
};

export default useProject;
