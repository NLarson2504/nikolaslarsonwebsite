/*
 * Uploads local image files to Firebase Storage under projects/{slug}/ and
 * prints their public download URLs. Reads the staged screenshots that were
 * pulled from Notion, plus any local /public/assets images we want in the cloud.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/uploadImages.js
 *
 * The bucket is read from the service account's project (…firebasestorage.app).
 * Uploaded objects are made public (uniform bucket-level access must allow it)
 * OR served via a download token; we use makePublic() for stable, tokenless URLs.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const BUCKET = 'nikolaslarsondotcom.firebasestorage.app';

initializeApp({ credential: applicationDefault(), storageBucket: BUCKET });
const bucket = getStorage().bucket();

// slug -> ordered list of local files (staged Notion downloads + local assets)
const STAGE = process.env.STAGE_DIR;

async function uploadOne(localPath, destPath) {
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  const file = bucket.file(destPath);
  await file.makePublic();
  return `https://storage.googleapis.com/${BUCKET}/${destPath}`;
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error('Usage: node scripts/uploadImages.js <manifest.json>');
    process.exit(1);
  }
  // manifest: { "slug": ["/abs/path/a.png", ...], ... }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const out = {};

  for (const [slug, files] of Object.entries(manifest)) {
    out[slug] = [];
    for (let i = 0; i < files.length; i += 1) {
      const local = files[i];
      if (!fs.existsSync(local)) {
        console.warn(`  missing: ${local} — skipping`);
        continue;
      }
      const ext = path.extname(local) || '.png';
      const dest = `projects/${slug}/screenshot-${i + 1}${ext}`;
      // eslint-disable-next-line no-await-in-loop
      const url = await uploadOne(local, dest);
      out[slug].push(url);
      console.log(`  ${slug} #${i + 1} -> ${url}`);
    }
  }

  const outPath = path.join(path.dirname(manifestPath), 'uploaded-urls.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
