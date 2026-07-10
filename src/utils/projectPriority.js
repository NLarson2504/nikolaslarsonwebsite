/*
 * Weighted project priority ("importance") scoring.
 *
 * We don't have reliable per-project durations, so priority is derived from
 * signals we actually have: lifecycle status, a manual `featured` override,
 * whether the project has a case study (a proxy for depth), and whether it's
 * professional work vs. a personal build.
 *
 * computePriority() returns a 0–100 number. Higher = ranked first. The weights
 * live here so ranking is transparent and tunable in one place.
 */

// How each Firestore `status` string maps to a 0–1 lifecycle signal.
// Unknown/blank statuses fall back to IDEA-level so nothing crashes.
const STATUS_SCORES = {
  'Active - Maintained': 1.0,
  'Active — Not Maintained': 0.75,
  'Live': 0.9,
  'Production': 1.0,
  'In Progress': 0.6,
  'Not Active': 0.4,
  'Idea': 0.2,
};

// Factor weights (sum = 1.0). Adjust these to retune the ranking.
export const PRIORITY_WEIGHTS = {
  status: 0.35,
  featured: 0.25,
  caseStudy: 0.15,
  recency: 0.15,
  professional: 0.10,
};

const statusSignal = (status) =>
  STATUS_SCORES[status] != null ? STATUS_SCORES[status] : STATUS_SCORES.Idea;

// Recency from an end/updated date if present, else a neutral 0.5 so projects
// without dates aren't unfairly buried. Scales ~0 (old) → 1 (this year).
const recencySignal = (project) => {
  const raw = project.endDate || project.date || null;
  if (!raw) return 0.5;
  const then = new Date(raw).getTime();
  if (Number.isNaN(then)) return 0.5;
  const years = (Date.now() - then) / (365.25 * 24 * 3600 * 1000);
  if (years <= 0) return 1;
  if (years >= 4) return 0;
  return 1 - years / 4;
};

// Professional work (tied to a real company/role) outranks personal builds.
// Marked explicitly via `professional`, or inferred from a known work brand.
const PROFESSIONAL_BRANDS = new Set(['tarragon']);
const professionalSignal = (project) => {
  if (typeof project.professional === 'boolean') return project.professional ? 1 : 0;
  return PROFESSIONAL_BRANDS.has(project.brandId) ? 1 : 0;
};

/**
 * Returns a 0–100 priority score for a project.
 */
export const computePriority = (project) => {
  const w = PRIORITY_WEIGHTS;
  const score =
    w.status * statusSignal(project.status) +
    w.featured * (project.featured ? 1 : 0) +
    w.caseStudy * (project.caseStudy ? 1 : 0) +
    w.recency * recencySignal(project) +
    w.professional * professionalSignal(project);
  return Math.round(score * 100);
};

/**
 * Sorts projects by computed priority (desc), falling back to the manual
 * `order` field, then title, so the result is stable and deterministic.
 * Returns a new array; does not mutate the input.
 */
export const sortByPriority = (projects = []) =>
  [...projects].sort((a, b) => {
    const pa = computePriority(a);
    const pb = computePriority(b);
    if (pb !== pa) return pb - pa;
    const oa = a.order ?? 0;
    const ob = b.order ?? 0;
    if (oa !== ob) return oa - ob;
    return (a.title || '').localeCompare(b.title || '');
  });

export default computePriority;
