/**
 * Shared eased-scroll offset published by useGSAPScrollSmooth and read by
 * follow-sticky rails, so the rails move with the exact same smoothing (the
 * "locomotive" feel) as the content instead of snapping to raw scroll.
 *
 *  - offset: the eased vertical offset the content is translated by (px).
 *  - enabled: whether smooth scroll is currently driving (false on mobile,
 *    where the page scrolls natively).
 */
const smoothScrollState = {
  offset: 0,
  enabled: false,
};

export default smoothScrollState;
