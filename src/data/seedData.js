/*
 * Shared seed data for the brands + projects Firestore model.
 *
 * Consumed by scripts/seedFirestore.js (Node, firebase-admin) to seed a fresh
 * environment. The initial data has already been written to Firestore.
 *
 * Images are PUBLIC PATHS served from /public/assets. A brand can span multiple
 * project types — Tarragon owns the Lira/Tallie agents, the app, and the site.
 */

export const brands = {
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

export const projects = [
  // Agents — both under the Tarragon brand
  {
    type: 'agent',
    brandId: 'tarragon',
    order: 0,
    slug: 'lira',
    title: 'Lira',
    description:
      'An intelligent multi-agent invoice processing system that automates vendor invoice handling for restaurant groups. Combining OCR, LLM-based parsing, and algorithmic matching, LIRA transforms manual invoice entry workflows—reducing processing time from 15-30 minutes to under 60 seconds per invoice.',
    caseStudy: {
      dek:
        'A multi-agent system that reads, understands, and matches vendor invoices for restaurant groups — replacing a slow manual workflow with OCR, LLM parsing, and confidence-scored product matching.',
      role: 'AI / Backend Engineer',
      featuredImage: '',
      stats: [
        { value: '30', unit: '→ 60s', label: 'Per-invoice time' },
        { value: '7', unit: 'svc', label: 'Specialized agents' },
        { value: '3', unit: 'tier', label: 'Match strategy' },
      ],
      sections: [
        {
          id: 'overview',
          heading: 'Overview',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Restaurant groups process hundreds of vendor invoices a week. Each one arrived as a PDF or a photo, and someone had to key it in line by line — matching every product to the right catalog entry before it could hit the books. Lira automates that end to end.',
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
                'Manual invoice entry took 15 to 30 minutes per invoice and was the kind of work that’s both tedious and error-prone. Product names never matched the catalog exactly — "tomatoes, roma 25lb" versus "Roma Tomato (case)" — so staff spent most of their time not typing numbers but resolving ambiguity.',
            },
            {
              type: 'quote',
              text:
                'The hard part was never OCR. It was deciding, confidently, which of 4,000 catalog items a smudged line on a fax actually refers to.',
              cite: 'Design note, matching pipeline',
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
                'Rather than one giant prompt, Lira uses a multi-agent orchestration: each stage is a specialized service. Cloud Vision handles OCR, a GPT-4o-mini agent extracts structured line items, and a hybrid matcher resolves each item — exact, then fuzzy, then an intelligent GPT-4 fallback for the genuinely ambiguous cases. Every match carries a confidence score and an audit trail, so a human only reviews what the system is unsure about.',
            },
            {
              type: 'image',
              src: '',
              caption:
                'The processing pipeline, from inbound email to a confidence-scored, matched invoice.',
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
                'Invoices arrive by email through wildcard routing — vendors just send to a per-account address. From there the orchestrator fans the work out to the OCR, extraction, and matching agents, then reassembles the result. The three-tier matching strategy keeps cost down: most lines resolve algorithmically, and only the edge cases pay for a large-model call.',
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
                'Processing dropped from 15–30 minutes to under 60 seconds per invoice, with a full audit trail behind every automated decision. The confidence scoring meant the team could trust the automation without giving up oversight — they review exceptions, not everything.',
            },
          ],
        },
      ],
    },
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
    slug: 'tallie',
    title: 'Tallie',
    description:
      'A conversational AI analytics agent for restaurant operations that provides intelligent query routing and real-time insights. Using a multi-agent orchestration pattern, Tallie routes user queries to specialized agents—combining GPT-based intent classification with action and reasoning agents for comprehensive data analysis.',
    caseStudy: {
      dek:
        'A conversational analytics agent that routes natural-language questions about restaurant operations to specialized reasoning and action agents, streaming answers back in real time.',
      role: 'AI / Backend Engineer',
      featuredImage: '',
      stats: [
        { value: '3', unit: 'agents', label: 'Orchestrated roles' },
        { value: 'SSE', unit: '', label: 'Streaming responses' },
        { value: 'PDF', unit: '', label: 'Invoice analysis' },
      ],
      sections: [
        {
          id: 'overview',
          heading: 'Overview',
          blocks: [
            {
              type: 'paragraph',
              text:
                'Operators had the data but not the answers — getting a number meant knowing which report to open. Tallie turns that into a conversation: ask a question in plain language and get an answer, with the reasoning streamed back as it works.',
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
                'Operational data was locked behind dashboards and exports. A single "how did food cost trend last month?" required navigating multiple screens, and the answer wasn’t conversational — you couldn’t follow up.',
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
                'Tallie uses a multi-agent pattern: a GPT-3.5 classifier routes intent, an action agent retrieves and navigates data, and a GPT-4 reasoning agent produces the analysis. Responses stream over Server-Sent Events so the interface feels immediate, and invoice PDFs can be pulled into the conversation for context.',
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
                'The orchestrator classifies each query, dispatches to the right specialized agent, and streams partial results back to the client. Keeping intent classification on a smaller model and reserving GPT-4 for reasoning balances latency and cost.',
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
                'A natural-language interface to operational data that answers complex, multi-step questions in one place — with the analysis streamed live rather than delivered as a static report.',
            },
          ],
        },
      ],
    },
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
    slug: 'tarragon',
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
    slug: 'campuslm',
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
    slug: 'mooslix',
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
    slug: 'tarragon-web',
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
    slug: 'nourished',
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
