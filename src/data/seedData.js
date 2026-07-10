/*
 * Shared seed data for the brands + projects Firestore model.
 *
 * Source of truth: Notion "Nik's Blocks" (Projects + Experience DBs). Where a
 * description is verbatim/derived from Notion it's real; anything marked
 * TODO(content) needs Nik to supply real copy.
 *
 * Consumed by scripts/seedFirestore.js (Node, firebase-admin) to seed a fresh
 * environment, and by the update script to sync into an existing DB.
 *
 * Images are PUBLIC PATHS served from /public/assets. A brand can span multiple
 * project types — Tarragon spans agents (LIRA, Tallie), the mobile app, and the
 * web platform; Mooslix is Nik's studio, with apps published under it.
 */

export const brands = {
  tarragon: {
    name: 'Tarragon Systems',
    logo: '/assets/icons/tarragonlogo.jpg',
    url: 'https://app.tarragonsystems.com',
  },
  mooslix: {
    name: 'Mooslix',
    logo: '/assets/icons/mooslixlogo.svg',
    url: 'https://mooslix.com',
  },
  nourished: {
    name: 'Nourished Cereal',
    logo: '',
    url: 'https://nourishedcereal.com',
  },
};

export const projects = [
  // ---- Agents (Tarragon Systems) ----------------------------------------
  {
    type: 'agent',
    brandId: 'tarragon',
    order: 0,
    slug: 'lira',
    featured: true,
    professional: true,
    status: 'Production',
    title: 'LIRA',
    description:
      'An AI-powered invoice processing service built at Tarragon Systems. LIRA ingests vendor invoices through a webhook API inbox, reads and structures them with OCR and LLM parsing, and matches line items against the product catalog — turning a slow manual entry workflow into an automated one.',
    caseStudy: {
      dek:
        'An AI invoice-processing service at Tarragon Systems that reads vendor invoices from a webhook API inbox and matches line items to the catalog — replacing manual entry with confidence-scored automation.',
      role: 'Junior Software Developer — Tarragon Systems',
      featuredImage: '',
      stats: [
        { value: 'Ruby', unit: '', label: 'Backend' },
        { value: 'OCR', unit: '+ LLM', label: 'Invoice parsing' },
        { value: 'Webhook', unit: 'API', label: 'Inbox ingestion' },
      ],
      sections: [
        {
          id: 'overview',
          heading: 'Overview',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Restaurant groups process a steady stream of vendor invoices, and each one had to be keyed in and reconciled against the product catalog by hand. LIRA automates that: invoices arrive through a webhook API inbox, get read and structured automatically, and their line items are matched back to the catalog.',
            },
          ],
        },
        {
          id: 'problem',
          heading: 'The problem',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Manual invoice entry is slow and error-prone, and the hard part isn’t reading the numbers — it’s reconciling them. Product names on an invoice rarely match the catalog exactly, so staff spent most of their time resolving ambiguity rather than typing.',
            },
          ],
        },
        {
          id: 'approach',
          heading: 'The approach',
          blocks: [
            {
              type: 'paragraph',
              text:
                'LIRA pairs OCR with LLM-based parsing to pull structured line items out of each invoice, then matches them against the catalog. It’s integrated with a webhook API inbox so invoices flow in automatically, and it fits into broader automation pipelines for fetching, creating, and archiving menu items.',
            },
          ],
        },
        {
          id: 'architecture',
          heading: 'Architecture',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Built in Ruby on the Tarragon Systems backend. The webhook inbox receives invoices, LIRA processes and structures them, and the results feed the catalog and downstream automation — reducing the manual intervention the workflow used to require.',
            },
          ],
        },
        {
          id: 'results',
          heading: 'Results',
          blocks: [
            {
              type: 'paragraph',
              text:
                'LIRA turned a manual, per-invoice reconciliation task into an automated pipeline, streamlining operational workflows and cutting the hands-on effort each invoice used to demand.',
            },
          ],
        },
      ],
    },
  },
  {
    type: 'agent',
    brandId: 'tarragon',
    order: 1,
    slug: 'menu-forecasting',
    featured: true,
    professional: true,
    status: 'Production',
    title: 'Menu Forecasting Engine',
    description:
      'A multimodal machine-learning engine for restaurant menu-item demand forecasting at Tarragon Systems. Hyperparameter tuning improved forecasting accuracy (R²) by 53%, translating to over $100,000 in annual savings for customers, with conditional training that updates models based on data patterns.',
    caseStudy: {
      dek:
        'A multimodal ML forecasting engine at Tarragon Systems: a 53% improvement in menu-item prediction accuracy that translated to over $100,000 in annual customer savings.',
      role: 'Junior Software Developer — Tarragon Systems',
      featuredImage: '',
      stats: [
        { value: '53', unit: '%', label: 'Accuracy gain (R²)' },
        { value: '$100', unit: 'K+', label: 'Annual savings' },
        { value: 'Multi', unit: 'modal', label: 'ML engine' },
      ],
      sections: [
        {
          id: 'overview',
          heading: 'Overview',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Restaurants live or die by how well they predict demand. This engine forecasts menu-item demand from multimodal inputs, and tuning it meaningfully improved how accurately the platform could anticipate what each restaurant would sell.',
            },
          ],
        },
        {
          id: 'problem',
          heading: 'The problem',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Inaccurate demand forecasts lead directly to waste and lost sales. The existing model left accuracy on the table, and models needed to stay current as each restaurant’s patterns shifted.',
            },
          ],
        },
        {
          id: 'approach',
          heading: 'The approach',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Tuned hyperparameters on the multimodal engine to lift forecasting accuracy (R²) by 53%, and implemented conditional training so models update intelligently based on data patterns rather than on a fixed schedule.',
            },
          ],
        },
        {
          id: 'results',
          heading: 'Results',
          blocks: [
            {
              type: 'paragraph',
              text:
                'The accuracy improvement translated into over $100,000 in annual savings for customers — better forecasts meaning less waste and fewer missed sales — with context-aware retraining keeping the models current.',
            },
          ],
        },
      ],
    },
  },

  // ---- Apps -------------------------------------------------------------
  {
    type: 'app',
    brandId: 'tarragon',
    order: 0,
    slug: 'tarragon-mobile',
    featured: true,
    professional: true,
    status: 'Active - Maintained',
    title: 'Tarragon Systems',
    description:
      'The Tarragon Systems mobile app for iOS and Android, built from the ground up. Extends the Tarragon platform to mobile, bringing its operational tooling to phones and tablets.',
    platform: 'iOS & Android',
    screenshots: [],
    features: [
      'Built from the ground up for iOS and Android',
      'Extends the Tarragon platform to mobile',
      'Published on the App Store and Google Play',
    ],
    technologies: [],
    appStoreUrl: 'https://apps.apple.com/app/tarragon-systems',
    playStoreUrl: '',
    icon: '/assets/icons/tarragonapp.png',
  },
  {
    type: 'app',
    brandId: 'mooslix',
    order: 1,
    slug: 'middapp',
    featured: false,
    professional: false,
    status: 'Active - Maintained',
    title: 'MiddApp',
    description:
      'An iOS app published under the Mooslix studio. TODO(content): add a real description.',
    platform: 'iOS',
    screenshots: [],
    features: [],
    technologies: [],
    appStoreUrl: 'https://apps.apple.com/app/midd-app',
    playStoreUrl: '',
    icon: '/assets/icons/middapp.png',
  },
  {
    type: 'app',
    brandId: 'mooslix',
    order: 2,
    slug: 'dailypaws',
    featured: false,
    professional: false,
    status: 'Not Active',
    endDate: '2026-03-16',
    title: 'DailyPaws',
    description:
      'A preventive pet-health monitoring app that turns everyday owner observations into early-warning signals. Short daily check-ins feed an algorithm trained on each pet’s personal baseline — adjusted for breed, age, and context — so it flags meaningful deviations instead of noisy one-off changes, helping owners decide when a vet visit is warranted.',
    platform: 'iOS',
    screenshots: [],
    features: [
      'Short daily check-ins that build a personal health baseline',
      'Baseline adjusted for breed, age, and context',
      'Flags meaningful deviations, not noisy one-off changes',
      'Vet-ready reports to arrive prepared',
      'Decision support — not diagnosis',
    ],
    technologies: [],
    appStoreUrl: '',
    playStoreUrl: '',
    icon: '/assets/icons/dailypaws.png',
  },

  // ---- Web --------------------------------------------------------------
  {
    type: 'site',
    brandId: 'tarragon',
    order: 0,
    slug: 'tarragon-web',
    featured: true,
    professional: true,
    title: 'Tarragon Systems Platform',
    description:
      'The Tarragon Systems web platform. Established and refined the application’s design philosophy — a cohesive, modern interface extending consistently across navigation, editing, updating, and creating actions.',
    url: 'https://app.tarragonsystems.com',
    repositoryUrl: '',
    image: '/assets/images/web/tarragon2.png',
    features: [
      'Cohesive design philosophy across the whole app',
      'Consistent editing, updating, and creating flows',
      'Modern, sleek interface',
    ],
    technologies: [],
    category: 'Web Platform',
    status: 'Live',
  },
  {
    type: 'site',
    brandId: 'mooslix',
    order: 1,
    slug: 'mooslix-biometrics',
    featured: false,
    professional: false,
    title: 'Mooslix Biometrics',
    description:
      'A web application focused on biometric solutions, providing secure and efficient biometric authentication. Built to address the growing need for reliable identity verification, with integration capabilities for organizations enhancing their security infrastructure.',
    url: 'https://mooslix.com',
    repositoryUrl: '',
    image: '/assets/images/web/mooslix1.png',
    features: [
      'Secure biometric authentication',
      'Reliable identity verification',
      'Integration capabilities for organizations',
    ],
    technologies: [],
    category: 'Security',
    status: 'Idea',
  },
  {
    type: 'site',
    brandId: 'nourished',
    order: 2,
    slug: 'nourished',
    featured: false,
    professional: false,
    title: 'Nourished Cereal',
    description:
      'TODO(content): add a real description for Nourished Cereal from Notion / Nik.',
    url: 'https://nourishedcereal.com',
    repositoryUrl: '',
    image: '/assets/images/web/nourished1.png',
    features: [],
    technologies: [],
    category: 'Web',
    status: 'Live',
  },
];
