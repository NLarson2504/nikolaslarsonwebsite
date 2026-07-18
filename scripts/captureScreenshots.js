/*
 * Auto-screenshot service: renders each web project's live URL to a fresh image
 * via the Microlink screenshot API, uploads it to Firebase Storage, and points
 * the project's `image` at it. Run on a schedule (cron / GitHub Action) or by
 * hand to keep the Web wheel's screenshots current without manual capture.
 *
 * Microlink free tier needs no key; set MICROLINK_KEY for higher limits / pro
 * features (full-page, retina, etc.).
 *
 * Only captures `type: 'site'` projects that have a `url`. Login-gated pages
 * (e.g. an app that redirects to /login) will screenshot whatever renders — set
 * `noCapture: true` on such a project (in Firestore) to skip it and keep its
 * existing hand-picked image.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/captureScreenshots.js
 */

const https = require('https');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const BUCKET = 'nikolaslarsondotcom.firebasestorage.app';
const KEY = process.env.MICROLINK_KEY || '';
// Extra settle time (ms) after the page goes idle, so entrance animations finish
// before the screenshot. Override per-run with CAPTURE_WAIT_MS.
const WAIT_MS = Number(process.env.CAPTURE_WAIT_MS) || 2500;

initializeApp({ credential: applicationDefault(), storageBucket: BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

function getJson(url) {
  return new Promise((resolve, reject) => {
    const headers = KEY ? { 'x-api-key': KEY } : {};
    https
      .get(url, { headers }, (res) => {
        let body = '';
        res.on('data', (d) => {
          body += d;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`bad JSON from microlink: ${body.slice(0, 200)}`));
          }
        });
      })
      .on('error', reject);
  });
}

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`image fetch ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function shoot(url) {
  const api =
    'https://api.microlink.io/?' +
    [
      `url=${encodeURIComponent(url)}`,
      'screenshot=true',
      'meta=false',
      'waitUntil=networkidle2',
      // Let entrance/hero animations finish settling before the shot so we don't
      // capture the page mid-transition. `waitForTimeout` pauses after the page
      // is otherwise idle; bump WAIT_MS if a site has longer intro motion.
      `waitForTimeout=${WAIT_MS}`,
      'viewport.width=1440',
      'viewport.height=900',
      'viewport.deviceScaleFactor=2',
    ].join('&');
  const res = await getJson(api);
  if (res.status !== 'success' || !res.data?.screenshot?.url) {
    throw new Error(`microlink failed for ${url}: ${res.status}`);
  }
  return getBuffer(res.data.screenshot.url);
}

async function main() {
  const snap = await db.collection('projects').where('type', '==', 'site').get();
  let done = 0;

  for (const d of snap.docs) {
    const p = d.data();
    if (!p.url || p.noCapture) {
      console.log(`skip: ${p.slug} (${p.noCapture ? 'noCapture' : 'no url'})`);
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      const buf = await shoot(p.url);
      const dest = `projects/${p.slug}/screenshot-1.png`;
      const file = bucket.file(dest);
      // eslint-disable-next-line no-await-in-loop
      await file.save(buf, {
        contentType: 'image/png',
        metadata: { cacheControl: 'public, max-age=3600' },
      });
      // eslint-disable-next-line no-await-in-loop
      await file.makePublic();
      const ver = Date.now();
      const publicUrl = `https://storage.googleapis.com/${BUCKET}/${dest}?v=${ver}`;
      // eslint-disable-next-line no-await-in-loop
      await d.ref.update({ image: publicUrl });
      done += 1;
      console.log(`captured: ${p.slug} -> ${publicUrl}`);
    } catch (e) {
      console.warn(`  FAILED ${p.slug}: ${e.message}`);
    }
  }

  console.log(`\nDone. Captured ${done} site(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
