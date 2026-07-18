import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Admin data access for projects and brands. Reads are open; writes require an
 * allowlisted admin (enforced by Firestore rules). All functions return plain
 * data / ids so the UI stays thin.
 */

// --- Projects ---------------------------------------------------------------

export const fetchAllProjects = async () => {
  const snap = await getDocs(collection(db, 'projects'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchProject = async (id) => {
  const snap = await getDoc(doc(db, 'projects', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Create a project (auto id). Returns the new id.
export const createProject = async (data) => {
  const ref = doc(collection(db, 'projects'));
  await setDoc(ref, sanitize(data));
  return ref.id;
};

export const saveProject = async (id, data) => {
  await updateDoc(doc(db, 'projects', id), sanitize(data));
};

export const deleteProject = async (id) => {
  await deleteDoc(doc(db, 'projects', id));
};

// --- Brands -----------------------------------------------------------------

export const fetchAllBrands = async () => {
  const snap = await getDocs(collection(db, 'brands'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Brands use a human id (e.g. "tarragon") as the doc id.
export const saveBrand = async (id, data) => {
  await setDoc(doc(db, 'brands', id), sanitize(data), { merge: true });
};

export const deleteBrand = async (id) => {
  await deleteDoc(doc(db, 'brands', id));
};

// Strip the client-only `id` and `brand` (joined) fields, and drop `undefined`
// values (Firestore rejects undefined).
function sanitize(data) {
  const { id, brand, ...rest } = data;
  const out = {};
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}
