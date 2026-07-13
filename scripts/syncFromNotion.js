/*
 * Upserts the real project + brand data (sourced from Notion "Nik's Blocks")
 * into Firestore, keyed by slug. Screenshots/images point at the public Firebase
 * Storage URLs produced by scripts/uploadImages.js.
 *
 * Idempotent: matches existing docs by slug and updates them; creates any that
 * are missing. Does NOT delete docs not listed here (safe to re-run).
 *
 * Language note: descriptions are written to be factual and brand-safe — no
 * betting/gambling framing, no overstated claims, no confidential specifics.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/syncFromNotion.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const BUCKET_BASE =
  'https://storage.googleapis.com/nikolaslarsondotcom.firebasestorage.app/projects';
const S = (slug, n) => `${BUCKET_BASE}/${slug}/screenshot-${n}.png`;
const ICON = (slug) => `${BUCKET_BASE}/${slug}/icon.png`;

// --- Brands -----------------------------------------------------------------
const brands = {
  tarragon: {
    name: 'Tarragon Systems',
    logo: '/assets/icons/tarragonlogo.jpg',
    url: 'https://app.tarragonsystems.com',
  },
  mooslix: { name: 'Mooslix', logo: '/assets/icons/mooslixlogo.svg', url: 'https://mooslix.com' },
  nourished: { name: 'Nourished Cereal', logo: '', url: 'https://nourishedcereal.com' },
  personal: { name: 'Nikolas Larson', logo: '', url: 'https://nikolaslarson.com' },
};

// --- Projects (keyed by slug) ----------------------------------------------
// type: 'agent' | 'app' | 'site' ; screenshots/image => Firebase Storage URLs.
const projects = [
  // ===== APPS ==============================================================
  {
    slug: 'tarragon-mobile',
    type: 'app',
    brandId: 'tarragon',
    order: 0,
    featured: true,
    professional: true,
    status: 'Active - Maintained',
    title: 'Tarragon Systems',
    description:
      'The Tarragon Systems mobile app for iOS and Android, built from the ground up. It brings the platform’s restaurant-operations tooling — inventory, catering, ordering, and reporting — to phones and tablets.',
    platform: 'iOS & Android',
    screenshots: [S('tarragon-mobile', 1), S('tarragon-mobile', 2), S('tarragon-mobile', 3)],
    features: [
      'Built from the ground up for iOS and Android',
      'Extends the Tarragon platform to mobile',
      'Inventory, catering, ordering, and reporting on the go',
    ],
    technologies: ['React Native'],
    appStoreUrl: 'https://apps.apple.com/app/tarragon-systems',
    playStoreUrl: '',
    icon: ICON('tarragon-mobile'),
  },
  {
    slug: 'middapp',
    type: 'app',
    brandId: 'mooslix',
    order: 1,
    featured: true,
    professional: false,
    status: 'Active - Maintained',
    title: 'MiddApp',
    description:
      'An all-in-one Middlebury campus app — dining menus, athletics, events, box office, the club directory, course info, and chat, in one place. Published under the Mooslix studio.',
    platform: 'iOS',
    screenshots: [S('middapp', 1), S('middapp', 2), S('middapp', 3), S('middapp', 4)],
    features: [
      'Dining menus, athletics, and campus events',
      'Box office, club directory, and course info',
      'Home-screen widgets and in-app chat',
    ],
    technologies: ['React Native', 'iOS Widgets', 'Native Modules'],
    appStoreUrl: 'https://apps.apple.com/app/midd-app',
    playStoreUrl: '',
    icon: ICON('middapp'),
  },
  {
    slug: 'breakpoint',
    type: 'app',
    brandId: 'mooslix',
    order: 2,
    featured: true,
    professional: false,
    status: 'Active - Maintained',
    startDate: '2026-06-01',
    title: 'BreakPoint',
    description:
      'A social app for competitive racket sports — primarily tennis. Players track matches and ladders, run tournaments, follow live scores, and climb an ELO-based rating that reflects real results.',
    platform: 'iOS',
    screenshots: [S('breakpoint', 1), S('breakpoint', 2), S('breakpoint', 3), S('breakpoint', 4)],
    features: [
      'ELO ratings from real match results',
      'Ladders, tournaments, and live match tracking',
      'Apple HealthKit — logs matches as workouts',
      'Maps and live activities',
    ],
    technologies: ['React Native', 'Expo', 'Supabase', 'HealthKit', 'Mapbox'],
    appStoreUrl: '',
    playStoreUrl: '',
    icon: ICON('breakpoint'),
  },
  {
    slug: 'dailypaws',
    type: 'app',
    brandId: 'mooslix',
    order: 3,
    featured: false,
    professional: false,
    status: 'Not Active',
    startDate: '2026-01-19',
    endDate: '2026-03-16',
    title: 'DailyPaws',
    description:
      'A preventive pet-health app that turns everyday owner observations into early-warning signals. Short daily check-ins feed an algorithm trained on each pet’s personal baseline — adjusted for breed, age, and context — so it flags meaningful deviations instead of noisy one-off changes. It’s built as decision support to help owners decide when a vet visit is warranted and arrive prepared — not as a diagnosis.',
    platform: 'iOS',
    screenshots: [S('dailypaws', 1), S('dailypaws', 2)],
    features: [
      'Short daily check-ins that build a personal health baseline',
      'Baseline adjusted for breed, age, and context',
      'Flags meaningful deviations, not noisy one-off changes',
      'Vet-ready reports to arrive prepared',
      'Decision support — not diagnosis',
    ],
    technologies: ['React Native', 'Expo', 'Supabase'],
    appStoreUrl: '',
    playStoreUrl: '',
    icon: '/assets/icons/dailypaws.png',
  },
  {
    slug: 'venice',
    type: 'app',
    brandId: 'mooslix',
    order: 4,
    featured: false,
    professional: false,
    status: 'Idea',
    title: 'Venice',
    description:
      'A social discovery app for meeting people at events — a bubble- and feed-based experience with a masquerade theme. Earliest-stage of the Mooslix mobile apps, built on the shared Mooslix app scaffold.',
    platform: 'iOS',
    screenshots: [S('venice', 1), S('venice', 2)],
    features: [
      'Bubble- and feed-based discovery',
      'Event-centered matchmaking',
      'Glass UI, dotted-grid backgrounds, animated transitions',
    ],
    technologies: ['React Native', 'Gesture Handling'],
    appStoreUrl: '',
    playStoreUrl: '',
    icon: '',
  },
  {
    slug: 'marble',
    type: 'app',
    brandId: 'mooslix',
    order: 5,
    featured: false,
    professional: false,
    status: 'Not Active',
    title: 'Marble',
    description:
      'A jobs-board product under the Mooslix studio — a clean way to browse and post internship and job listings.',
    platform: 'iOS',
    screenshots: [S('marble', 1)],
    features: [],
    technologies: ['React Native'],
    appStoreUrl: '',
    playStoreUrl: '',
    icon: ICON('marble'),
  },

  // ===== SITES =============================================================
  {
    slug: 'tarragon-web',
    type: 'site',
    brandId: 'tarragon',
    order: 0,
    featured: true,
    professional: true,
    title: 'Tarragon Systems Platform',
    description:
      'The Tarragon Systems web platform. Established and refined the application’s design language — a cohesive, modern interface that carries consistently across navigating, editing, updating, and creating.',
    url: 'https://app.tarragonsystems.com',
    repositoryUrl: '',
    image: S('tarragon-web', 1),
    features: [
      'Cohesive design language across the whole app',
      'Consistent editing, updating, and creating flows',
      'Modern, sleek interface',
    ],
    technologies: [],
    category: 'Web Platform',
    status: 'Live',
  },
  {
    slug: 'nikolaslarson',
    type: 'site',
    brandId: 'personal',
    order: 1,
    featured: true,
    professional: false,
    title: 'NikolasLarson.com',
    description:
      'This portfolio — a revamped showcase of Nik’s work under the Mooslix studio, pulling brand and project data live from Firestore, with GSAP-driven motion and CI deploys.',
    url: 'https://nikolaslarson.com',
    repositoryUrl: '',
    image: S('nikolaslarson', 1),
    features: [
      'Live brand/project data from Firestore',
      'GSAP-driven motion and 3D galleries',
      'Continuous deploys',
    ],
    technologies: ['React', 'GSAP', 'Firebase/Firestore', 'CSS'],
    category: 'Portfolio',
    status: 'Live',
  },
  {
    slug: 'mooslix-biometrics',
    type: 'site',
    brandId: 'mooslix',
    order: 2,
    featured: false,
    professional: false,
    title: 'Mooslix Biometrics',
    description:
      'A web application concept focused on biometric identity verification — secure, efficient authentication with integration paths for organizations strengthening their security. Currently at the concept and pitch stage.',
    url: 'https://mooslix.com',
    repositoryUrl: '',
    image: S('mooslix-biometrics', 1),
    features: [
      'Secure biometric authentication',
      'Reliable identity verification',
      'Integration paths for organizations',
    ],
    technologies: [],
    category: 'Security',
    status: 'Idea',
  },
  {
    slug: 'nourished',
    type: 'site',
    brandId: 'nourished',
    order: 3,
    featured: false,
    professional: false,
    title: 'Nourished Cereal',
    description:
      'A brand and storefront site for Nourished Cereal.',
    url: 'https://nourishedcereal.com',
    repositoryUrl: '',
    image: S('nourished', 1),
    features: [],
    technologies: [],
    category: 'Web',
    status: 'Live',
  },
];

async function upsertBrands() {
  for (const [id, data] of Object.entries(brands)) {
    // eslint-disable-next-line no-await-in-loop
    await db.collection('brands').doc(id).set(data, { merge: true });
    console.log(`brand: ${id}`);
  }
}

async function upsertProjects() {
  const snap = await db.collection('projects').get();
  const bySlug = {};
  snap.docs.forEach((d) => {
    const s = d.data().slug;
    if (s) bySlug[s] = d.id;
  });

  for (const p of projects) {
    const { slug } = p;
    const data = { ...p, updatedAt: FieldValue.serverTimestamp() };
    const existingId = bySlug[slug];
    if (existingId) {
      // eslint-disable-next-line no-await-in-loop
      await db.collection('projects').doc(existingId).set(data, { merge: true });
      console.log(`update: ${p.type}/${slug}`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      const ref = await db.collection('projects').add(data);
      console.log(`create: ${p.type}/${slug} (${ref.id})`);
    }
  }
}

async function main() {
  await upsertBrands();
  await upsertProjects();
  console.log('\nSync complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
