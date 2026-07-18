/*
 * One-off updater: adds `slug` and (where present) `caseStudy` to the existing
 * `projects` docs in Firestore, matching by title — without recreating docs.
 *
 * Uses the browser/anon Firebase SDK + your .env.local config. Works only while
 * Firestore rules allow client writes (they do until the test rule expires).
 *
 * Run:  node scripts/updateCaseStudies.js
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} = require('firebase/firestore');

// --- load env from .env.local (no dotenv dependency) ---
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

// --- pull the canonical slug/caseStudy data from seedData ---
// seedData.js uses ESM `export`; read + eval the needed exports via a tiny shim.
async function loadSeed() {
  // Lazy transpile-free import: seedData is plain data with `export const`.
  // We re-map exports by regex-free require through esm-ish interop is overkill,
  // so instead maintain the mapping here from the source of truth.
  const seedPath = path.join(__dirname, '..', 'src', 'data', 'seedData.js');
  const src = fs.readFileSync(seedPath, 'utf8');
  // Turn `export const projects = [...]` into a CommonJS module and eval it.
  const cjs = src
    .replace(/export const brands/g, 'const brands')
    .replace(/export const projects/g, 'const projects')
    .concat('\nmodule.exports = { brands, projects };');
  const m = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', cjs)(m, m.exports);
  return m.exports;
}

async function main() {
  const { projects: seedProjects } = await loadSeed();
  const byTitle = {};
  seedProjects.forEach((p) => {
    byTitle[p.title] = p;
  });

  const snap = await getDocs(collection(db, 'projects'));
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const seed = byTitle[data.title];
    if (!seed) {
      console.warn(`No seed match for "${data.title}" — skipping.`);
      continue;
    }
    const patch = {};
    if (seed.slug && seed.slug !== data.slug) patch.slug = seed.slug;
    if (seed.caseStudy && !data.caseStudy) patch.caseStudy = seed.caseStudy;

    if (Object.keys(patch).length === 0) {
      console.log(`"${data.title}" already up to date.`);
      continue;
    }
    await updateDoc(doc(db, 'projects', d.id), patch);
    updated += 1;
    console.log(`Updated "${data.title}" with: ${Object.keys(patch).join(', ')}`);
  }

  console.log(`\nDone. Updated ${updated} project(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
