/*
 * One-off updater: syncs each app project's `screenshots` array from seedData
 * into the matching Firestore `projects` doc (matched by title), so the Apps
 * phone-wheel has real screenshots to render.
 *
 * Uses the browser/anon Firebase SDK + your .env.local config. Works only while
 * Firestore rules allow client writes (they do until the test rule expires).
 *
 * Run:  node scripts/updateAppScreenshots.js
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

function loadSeed() {
  const seedPath = path.join(__dirname, '..', 'src', 'data', 'seedData.js');
  const src = fs.readFileSync(seedPath, 'utf8');
  const cjs = src
    .replace(/export const brands/g, 'const brands')
    .replace(/export const projects/g, 'const projects')
    .concat('\nmodule.exports = { brands, projects };');
  const m = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', cjs)(m, m.exports);
  return m.exports;
}

function sameArray(a = [], b = []) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

async function main() {
  const { projects: seedProjects } = loadSeed();
  const byTitle = {};
  seedProjects.forEach((p) => {
    if (p.type === 'app') byTitle[p.title] = p;
  });

  const snap = await getDocs(collection(db, 'projects'));
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.type !== 'app') continue;
    const seed = byTitle[data.title];
    if (!seed) {
      console.warn(`No app seed match for "${data.title}" — skipping.`);
      continue;
    }
    const seedShots = seed.screenshots || [];
    if (sameArray(seedShots, data.screenshots)) {
      console.log(`"${data.title}" screenshots already up to date.`);
      continue;
    }
    await updateDoc(doc(db, 'projects', d.id), { screenshots: seedShots });
    updated += 1;
    console.log(
      `Updated "${data.title}" screenshots (${seedShots.length} image${
        seedShots.length === 1 ? '' : 's'
      }).`
    );
  }

  console.log(`\nDone. Updated ${updated} app project(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
