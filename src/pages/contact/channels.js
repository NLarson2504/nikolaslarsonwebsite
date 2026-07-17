/* The rotating contact "channels" that drive the Contact page deck. Each entry
 * is one way to reach me. The deck (left) cycles between these; the detail panel
 * (right) renders a bespoke view per `kind`:
 *   - github → the classic green contribution grid
 *   - linkedin → a profile-style card
 *   - email → the EmailJS contact form (auto-rotate stops while it's focused)
 *   - link → a generic "visit" card (resume, etc.)
 *
 * `tint` is the footlight color raised from the bottom of the stage when this
 * channel is focused — the brand color, tuned to sit as a deep glow rather than
 * a bright wash (same spirit as the Agents/Apps icon-sampled footlight).
 */
const CHANNELS = [
  {
    slug: 'linkedin',
    kind: 'linkedin',
    name: 'LinkedIn',
    handle: 'in/nikolaslarson',
    headline:
      'Applied Technology @ Fidelity Investments, Math + CS @ Middlebury College, AI @ Tarragon Systems',
    blurb:
      'Where I keep the professional story — roles, projects, and the people I build with.',
    url: 'https://www.linkedin.com/in/nikolaslarson/',
    cta: 'Open LinkedIn',
    tint: '#0a66c2',
  },
  {
    slug: 'github',
    kind: 'github',
    name: 'GitHub',
    handle: '@NLarson2504',
    // Live profile is pulled from the GitHub API at runtime; this is the
    // fallback shown if that request fails or is rate-limited.
    github: {
      username: 'NLarson2504',
      fallback: {
        login: 'NLarson2504',
        name: 'Nikolas Larson',
        bio: 'I take advanced computer science courses and pursue personal coding projects.',
        avatar: 'https://avatars.githubusercontent.com/u/76064681?v=4',
        followers: 3,
        following: 1,
        repos: 3,
        location: 'Durham, NC',
        url: 'https://github.com/NLarson2504',
      },
    },
    blurb:
      'Code, commits, and the occasional weekend experiment. The green wall is the real rhythm of it.',
    url: 'https://github.com/NLarson2504',
    cta: 'Open GitHub',
    tint: '#3fb950',
  },
  {
    slug: 'email',
    kind: 'email',
    name: 'Email',
    handle: 'nlarson@middlebury.edu',
    blurb: 'The most direct line. Send a note and I’ll get back to you.',
    address: 'nlarson@middlebury.edu',
    cta: 'Send a message',
    tint: '#c9a24b',
  },
];

export default CHANNELS;
