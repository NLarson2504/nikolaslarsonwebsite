import liraLogo from '../assets/icons/liralogo.svg';
import tallieLogo from '../assets/icons/tallielogo.svg';
import tarragonLogo from '../assets/icons/tarragonlogo.jpg';
import campusLMLogo from '../assets/icons/campuslmlogo.png';
import mooslixLogo from '../assets/icons/mooslixlogo.svg';

import tarragonMobile1 from "../assets/images/mobile/tarragon1.png"
import tarragonMobile2 from "../assets/images/mobile/tarragon2.png"
import tarragonMobile3 from "../assets/images/mobile/tarragon3.png"
import campusLMMobile1 from "../assets/images/mobile/campuslm1.png"
import campusLMMobile2 from "../assets/images/mobile/campuslm2.png"
import campusLMMobile3 from "../assets/images/mobile/campuslm3.png"
import campusLMMobile4 from "../assets/images/mobile/campuslm4.png"
import mooslixMobile1 from "../assets/images/mobile/mooslixmobile1.png"

import nourishedWebImage from '../assets/images/web/nourished1.png';
import tarragonWebImage from '../assets/images/web/tarragon2.png';
import mooslixWebImage from '../assets/images/web/mooslix1.png';

export const agentsData = [
  {
    title: "Lira",
    description: "An intelligent multi-agent invoice processing system that automates vendor invoice handling for restaurant groups. Combining OCR, LLM-based parsing, and algorithmic matching, LIRA transforms manual invoice entry workflows—reducing processing time from 15-30 minutes to under 60 seconds per invoice.",
    features: [
      "Multi-agent orchestration with specialized processing services",
      "GPT-4o-mini powered structured data extraction",
      "Intelligent product matching with GPT-4 fallback for edge cases",
      "Google Cloud Vision API for OCR processing",
      "Hybrid algorithmic + AI matching (exact, fuzzy, and intelligent)",
      "Email-to-invoice automation with wildcard routing",
      "Confidence scoring and audit trail for transparency"
    ],
    technologies: [
      "Ruby on Rails",
      "OpenAI GPT-4o-mini",
      "OpenAI GPT-4",
      "Google Cloud Vision API",
      "Google Cloud Storage",
      "PostgreSQL",
      "SendGrid"
    ],
    status: "Production",
    icon: liraLogo
  },
  {
    title: "Tallie",
    description: "A conversational AI analytics agent for restaurant operations that provides intelligent query routing and real-time insights. Using a multi-agent orchestration pattern, Tallie routes user queries to specialized agents—combining GPT-based intent classification with action and reasoning agents for comprehensive data analysis.",
    features: [
      "GPT-3.5 powered intent classification and query routing",
      "GPT-4 reasoning agent for analysis and insights",
      "Specialized action agent for data retrieval and navigation",
      "Server-Sent Events (SSE) for real-time streaming responses",
      "Invoice PDF analysis in conversational context",
      "Multi-agent orchestration for complex queries",
      "Natural language interface to operational data"
    ],
    technologies: [
      "Ruby on Rails",
      "OpenAI GPT-3.5",
      "OpenAI GPT-4",
      "Server-Sent Events (SSE)",
      "PostgreSQL",
      "Active Storage"
    ],
    status: "Production",
    icon: tallieLogo
  }
];

export const mobileAppsData = [
  {
    title: "Tarragon",
    description: "A comprehensive product ecosystem mobile application that connects users with curated products, reviews, and recommendations. Tarragon provides a seamless shopping experience with AI-powered product discovery and personalized recommendations.",
    platform: "iOS & Android",
    screenshots: [
      tarragonMobile1,
      tarragonMobile2,
      tarragonMobile3
    ],
    features: [
      "AI-powered product recommendations",
      "Augmented reality product preview",
      "Social shopping and reviews",
      "One-click checkout with multiple payment options",
      "Real-time inventory tracking",
      "Personalized wishlist and favorites"
    ],
    technologies: [
      "React Native",
      "TypeScript",
      "Redux Toolkit",
      "Firebase",
      "Stripe API",
      "ARKit/ARCore",
      "Node.js Backend"
    ],
    appStoreUrl: "https://apps.apple.com/app/tarragon",
    playStoreUrl: "https://play.google.com/store/apps/tarragon",
    icon: tarragonLogo
  },
  {
    title: "CampusLM",
    description: "An AI-powered study companion designed specifically for college students. CampusLM offers personalized study plans, intelligent note-taking, and collaborative learning tools to help students succeed academically.",
    platform: "iOS & Android",
    screenshots: [
      campusLMMobile1,
      campusLMMobile2,
      campusLMMobile3,
      campusLMMobile4,
    ],
    features: [
      "AI-generated study plans and schedules",
      "Smart note-taking with OCR recognition",
      "Collaborative study groups and chat",
      "Grade tracking and GPA calculator",
      "Assignment and deadline reminders",
      "Integration with popular LMS platforms"
    ],
    technologies: [
      "Flutter",
      "Dart",
      "SQLite",
      "Firebase Auth",
      "Google Cloud ML",
      "Canvas API",
      "Push Notifications"
    ],
    appStoreUrl: "https://apps.apple.com/app/campuslm",
    playStoreUrl: "https://play.google.com/store/apps/campuslm",
    icon: campusLMLogo
  }
];

export const sitesData = [
  {
    title: "Mooslix",
    description: "A cutting-edge biometric authentication platform that provides secure, passwordless login solutions for enterprise applications. Mooslix combines facial recognition, fingerprint scanning, and voice authentication to create a seamless and highly secure user experience.",
    url: "https://mooslix.com",
    repositoryUrl: "https://github.com/mooslix/platform",
    image: mooslixWebImage,
    features: [
      "Multi-factor biometric authentication",
      "Real-time fraud detection and prevention",
      "Enterprise-grade security compliance",
      "Seamless API integration",
      "Advanced analytics dashboard",
      "Cross-platform compatibility"
    ],
    technologies: [
      "React",
      "Node.js",
      "TypeScript",
      "PostgreSQL",
      "WebRTC",
      "TensorFlow.js",
      "AWS Lambda",
      "Docker"
    ],
    category: "Enterprise Security",
    status: "Live"
  },
  {
    title: "Tarragon Web Platform",
    description: "The web companion to the Tarragon mobile application, featuring a comprehensive product catalog, advanced search capabilities, and seamless cross-platform synchronization. The platform provides merchants with powerful tools to manage their products and analytics.",
    url: "https://app.tarragonsystems.com",
    repositoryUrl: "https://github.com/tarragon/web-platform",
    image: tarragonWebImage,
    features: [
      "Dynamic product catalog with advanced filtering",
      "Real-time inventory management",
      "Merchant dashboard and analytics",
      "Cross-platform synchronization",
      "Advanced search with AI recommendations",
      "Responsive design for all devices"
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Redis",
      "Vercel",
      "Stripe"
    ],
    category: "E-commerce Platform",
    status: "Live"
  },
  {
    title: "Nourished Cereal",
    description: "A holistic wellness platform that connects users with certified nutritionists, fitness trainers, and wellness coaches. The platform features personalized meal planning, workout routines, and progress tracking to help users achieve their health goals.",
    url: "https://nourishedcereal.com",
    repositoryUrl: "https://github.com/",
    image: nourishedWebImage,
    features: [
      "Personalized nutrition and fitness plans",
      "Video consultations with certified professionals",
      "Progress tracking and analytics",
      "Social community features",
      "Meal planning and shopping lists",
      "Integration with fitness wearables"
    ],
    technologies: [
      "Vue.js",
      "Nuxt.js",
      "Node.js",
      "MongoDB",
      "Socket.io",
      "Stripe",
      "WebRTC",
      "AWS S3"
    ],
    category: "Health & Wellness",
    status: "Live"
  }
];