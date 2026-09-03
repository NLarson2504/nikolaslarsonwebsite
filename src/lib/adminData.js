import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { clearProjectsCache } from '../hooks/projectsCache';

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
  clearProjectsCache();
  return ref.id;
};

export const saveProject = async (id, data) => {
  await updateDoc(doc(db, 'projects', id), sanitize(data));
  // The public pages cache projects for the life of the tab; an edit here has
  // to drop that or the site keeps serving what was read before the save.
  clearProjectsCache();
};

export const deleteProject = async (id) => {
  await deleteDoc(doc(db, 'projects', id));
  clearProjectsCache();
};

// --- Brands -----------------------------------------------------------------

export const fetchAllBrands = async () => {
  const snap = await getDocs(collection(db, 'brands'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Brands use a human id (e.g. "tarragon") as the doc id.
export const saveBrand = async (id, data) => {
  await setDoc(doc(db, 'brands', id), sanitize(data), { merge: true });
  clearProjectsCache();
};

export const deleteBrand = async (id) => {
  await deleteDoc(doc(db, 'brands', id));
  clearProjectsCache();
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

/* --- image uploads --------------------------------------------------------
 * Admin-side image upload to Firebase Storage. Files land under
 * projects/{slug}/ to match the paths the Notion sync script already writes
 * (see scripts/uploadImages.js), so cloud images share one namespace however
 * they got there.
 */

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Validates a File before upload. Returns an error string, or null if fine.
 */
export const validateImage = (file) => {
  if (!file) return 'No file selected.';
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type — use PNG, JPEG, WebP, GIF or SVG.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 8MB.`;
  }
  return null;
};

/**
 * Uploads `file` for a project and resolves to its public download URL.
 * `onProgress` receives 0–100. Returns an object with the url and storage path.
 */
export const uploadProjectImage = (file, slug, onProgress) =>
  new Promise((resolve, reject) => {
    const err = validateImage(file);
    if (err) return reject(new Error(err));

    // keep the original extension; prefix with a timestamp so re-uploading a
    // file of the same name doesn't clobber the previous one (old case studies
    // may still reference it)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `projects/${slug || 'unsorted'}/${Date.now()}-${safeName}`;
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    });

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          resolve({ url: await getDownloadURL(task.snapshot.ref), path });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
