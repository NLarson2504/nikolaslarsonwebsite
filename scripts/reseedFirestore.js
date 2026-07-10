/*
 * Clears the `projects` and `brands` collections and reseeds them from
 * src/data/seedData.js. Use when the dataset changed shape (renames, removals,
 * new projects) rather than a field-level patch.
 *
 * Uses the browser/anon Firebase SDK + .env.local. Works only while Firestore
 * rules allow client writes (the test rule does, until it expires).
 *
 * Run:  node scripts/reseedFirestore.js
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} = require('firebase/firestore');

// --- env from .env.local (no dotenv dependency) ---
const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n')
  .forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });

const app = initializeApp({
  apiKey: env.REACT_APP_FIREBASE_API_KEY,
  authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: env.REACT_APP_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// --- load brands/projects from seedData.js (ESM → eval shim) ---
function loadSeed() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', 'seedData.js'),
    'utf8'
  );
  const cjs = src
    .replace(/export const brands/g, 'const brands')
    .replace(/export const projects/g, 'const projects')
    .concat('\nmodule.exports = { brands, projects };');
  const m = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', cjs)(m, m.exports);
  return m.exports;
}

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, name, d.id))));
  return snap.size;
}

async function main() {
  const { brands, projects } = loadSeed();

  const removedProjects = await clearCollection('projects');
  const removedBrands = await clearCollection('brands');
  console.log(`Cleared ${removedProjects} project(s), ${removedBrands} brand(s).`);

  for (const [brandId, brand] of Object.entries(brands)) {
    await setDoc(doc(db, 'brands', brandId), brand);
  }
  for (const project of projects) {
    await setDoc(doc(collection(db, 'projects')), project); // auto id
  }

  console.log(
    `Seeded ${Object.keys(brands).length} brand(s) and ${projects.length} project(s).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
