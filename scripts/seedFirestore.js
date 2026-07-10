/*
 * One-time seed script: pushes local project data into Firestore using the
 * brands + projects data model.
 *
 * Data model:
 *   brands/{brandId}     -> { name, logo, url }
 *   projects/{projectId} -> { type: 'agent'|'app'|'site', brandId, order, ... }
 *
 * A brand can span multiple project types. Tarragon, for example, owns the
 * Lira and Tallie agents, the mobile app, and the web platform — all four
 * reference brandId: 'tarragon'.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/seedFirestore.js
 *
 * Get a service account key from:
 *   Firebase console > Project settings > Service accounts > Generate new private key
 *
 * Images are PUBLIC PATHS served from /public (copied into public/assets/...).
 * Adjust any paths/URLs to match your real hosting.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

// --- Brands -----------------------------------------------------------------
// Keyed by the brandId used below. Edit name/logo/url to taste.

const brands = {
  tarragon: {
    name: 'Tarragon',
    logo: '/assets/icons/tarragonlogo.jpg',
    url: 'https://app.tarragonsystems.com',
  },
  mooslix: {
    name: 'Mooslix',
    logo: '/assets/icons/mooslixlogo.svg',
    url: 'https://mooslix.com',
  },
  campuslm: {
    name: 'CampusLM',
    logo: '/assets/icons/campuslmlogo.png',
    url: '',
  },
  nourished: {
    name: 'Nourished Cereal',
    logo: '',
    url: 'https://nourishedcereal.com',
  },
};

// --- Projects ---------------------------------------------------------------
// `type` drives which page shows it. `order` controls display order per type.
// `brandId` ties related work together across pages.

const projects = [
  // Agents — both under the Tarragon brand
  {
    type: 'agent',
    brandId: 'tarragon',
    order: 0,
    title: 'Lira',
    description:
      'An intelligent multi-agent invoice processing system that automates vendor invoice handling for restaurant groups. Combining OCR, LLM-based parsing, and algorithmic matching, LIRA transforms manual invoice entry workflows—reducing processing time from 15-30 minutes to under 60 seconds per invoice.',
    features: [
      'Multi-agent orchestration with specialized processing services',
      'GPT-4o-mini powered structured data extraction',
      'Intelligent product matching with GPT-4 fallback for edge cases',
      'Google Cloud Vision API for OCR processing',
      'Hybrid algorithmic + AI matching (exact, fuzzy, and intelligent)',
      'Email-to-invoice automation with wildcard routing',
      'Confidence scoring and audit trail for transparency',
    ],
    technologies: [
      'Ruby on Rails',
      'OpenAI GPT-4o-mini',
      'OpenAI GPT-4',
      'Google Cloud Vision API',
      'Google Cloud Storage',
      'PostgreSQL',
      'SendGrid',
    ],
    status: 'Production',
    icon: '/assets/icons/liralogo.svg',
  },
  {
    type: 'agent',
    brandId: 'tarragon',
    order: 1,
    title: 'Tallie',
    description:
      'A conversational AI analytics agent for restaurant operations that provides intelligent query routing and real-time insights. Using a multi-agent orchestration pattern, Tallie routes user queries to specialized agents—combining GPT-based intent classification with action and reasoning agents for comprehensive data analysis.',
    features: [
      'GPT-3.5 powered intent classification and query routing',
      'GPT-4 reasoning agent for analysis and insights',
      'Specialized action agent for data retrieval and navigation',
      'Server-Sent Events (SSE) for real-time streaming responses',
      'Invoice PDF analysis in conversational context',
      'Multi-agent orchestration for complex queries',
      'Natural language interface to operational data',
    ],
    technologies: [
      'Ruby on Rails',
      'OpenAI GPT-3.5',
      'OpenAI GPT-4',
      'Server-Sent Events (SSE)',
      'PostgreSQL',
      'Active Storage',
    ],
    status: 'Production',
    icon: '/assets/icons/tallielogo.svg',
  },

  // Apps
  {
    type: 'app',
    brandId: 'tarragon',
    order: 0,
    title: 'Tarragon',
    description:
      'A comprehensive product ecosystem mobile application that connects users with curated products, reviews, and recommendations. Tarragon provides a seamless shopping experience with AI-powered product discovery and personalized recommendations.',
    platform: 'iOS & Android',
    screenshots: [
      '/assets/images/mobile/tarragon1.png',
      '/assets/images/mobile/tarragon2.png',
      '/assets/images/mobile/tarragon3.png',
    ],
    features: [
      'AI-powered product recommendations',
      'Augmented reality product preview',
      'Social shopping and reviews',
      'One-click checkout with multiple payment options',
      'Real-time inventory tracking',
      'Personalized wishlist and favorites',
    ],
    technologies: [
      'React Native',
      'TypeScript',
      'Redux Toolkit',
      'Firebase',
      'Stripe API',
      'ARKit/ARCore',
      'Node.js Backend',
    ],
    appStoreUrl: 'https://apps.apple.com/app/tarragon',
    playStoreUrl: 'https://play.google.com/store/apps/tarragon',
    icon: '/assets/icons/tarragonlogo.jpg',
  },
  {
    type: 'app',
    brandId: 'campuslm',
    order: 1,
    title: 'CampusLM',
    description:
      'An AI-powered study companion designed specifically for college students. CampusLM offers personalized study plans, intelligent note-taking, and collaborative learning tools to help students succeed academically.',
    platform: 'iOS & Android',
    screenshots: [
      '/assets/images/mobile/campuslm1.png',
      '/assets/images/mobile/campuslm2.png',
      '/assets/images/mobile/campuslm3.png',
      '/assets/images/mobile/campuslm4.png',
    ],
    features: [
      'AI-generated study plans and schedules',
      'Smart note-taking with OCR recognition',
      'Collaborative study groups and chat',
      'Grade tracking and GPA calculator',
      'Assignment and deadline reminders',
      'Integration with popular LMS platforms',
    ],
    technologies: [
      'Flutter',
      'Dart',
      'SQLite',
      'Firebase Auth',
      'Google Cloud ML',
      'Canvas API',
      'Push Notifications',
    ],
    appStoreUrl: 'https://apps.apple.com/app/campuslm',
    playStoreUrl: 'https://play.google.com/store/apps/campuslm',
    icon: '/assets/icons/campuslmlogo.png',
  },

  // Sites
  {
    type: 'site',
    brandId: 'mooslix',
    order: 0,
    title: 'Mooslix',
    description:
      'A cutting-edge biometric authentication platform that provides secure, passwordless login solutions for enterprise applications. Mooslix combines facial recognition, fingerprint scanning, and voice authentication to create a seamless and highly secure user experience.',
    url: 'https://mooslix.com',
    repositoryUrl: 'https://github.com/mooslix/platform',
    image: '/assets/images/web/mooslix1.png',
    features: [
      'Multi-factor biometric authentication',
      'Real-time fraud detection and prevention',
      'Enterprise-grade security compliance',
      'Seamless API integration',
      'Advanced analytics dashboard',
      'Cross-platform compatibility',
    ],
    technologies: [
      'React',
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'WebRTC',
      'TensorFlow.js',
      'AWS Lambda',
      'Docker',
    ],
    category: 'Enterprise Security',
    status: 'Live',
  },
  {
    type: 'site',
    brandId: 'tarragon',
    order: 1,
    title: 'Tarragon Web Platform',
    description:
      'The web companion to the Tarragon mobile application, featuring a comprehensive product catalog, advanced search capabilities, and seamless cross-platform synchronization. The platform provides merchants with powerful tools to manage their products and analytics.',
    url: 'https://app.tarragonsystems.com',
    repositoryUrl: 'https://github.com/tarragon/web-platform',
    image: '/assets/images/web/tarragon2.png',
    features: [
      'Dynamic product catalog with advanced filtering',
      'Real-time inventory management',
      'Merchant dashboard and analytics',
      'Cross-platform synchronization',
      'Advanced search with AI recommendations',
      'Responsive design for all devices',
    ],
    technologies: [
      'Next.js',
      'React',
      'TypeScript',
      'Prisma',
      'PostgreSQL',
      'Redis',
      'Vercel',
      'Stripe',
    ],
    category: 'E-commerce Platform',
    status: 'Live',
  },
  {
    type: 'site',
    brandId: 'nourished',
    order: 2,
    title: 'Nourished Cereal',
    description:
      'A holistic wellness platform that connects users with certified nutritionists, fitness trainers, and wellness coaches. The platform features personalized meal planning, workout routines, and progress tracking to help users achieve their health goals.',
    url: 'https://nourishedcereal.com',
    repositoryUrl: '',
    image: '/assets/images/web/nourished1.png',
    features: [
      'Personalized nutrition and fitness plans',
      'Video consultations with certified professionals',
      'Progress tracking and analytics',
      'Social community features',
      'Meal planning and shopping lists',
      'Integration with fitness wearables',
    ],
    technologies: [
      'Vue.js',
      'Nuxt.js',
      'Node.js',
      'MongoDB',
      'Socket.io',
      'Stripe',
      'WebRTC',
      'AWS S3',
    ],
    category: 'Health & Wellness',
    status: 'Live',
  },
];

// --- Writer -----------------------------------------------------------------

async function seed() {
  const batch = db.batch();

  Object.entries(brands).forEach(([brandId, brand]) => {
    batch.set(db.collection('brands').doc(brandId), brand);
  });

  projects.forEach((project) => {
    batch.set(db.collection('projects').doc(), project); // auto id
  });

  await batch.commit();
  console.log(
    `Seeded ${Object.keys(brands).length} brand(s) and ${projects.length} project(s).`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
