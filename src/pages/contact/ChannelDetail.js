import React, { useMemo, useState } from 'react';
import emailjs from 'emailjs-com';

/* ---- GitHub-style contribution grid --------------------------------------
 * A decorative 53×7 heatmap of "commits" — the classic green wall. It's
 * seeded deterministically per render mount so it looks lived-in and stable
 * rather than random noise every frame. Level 0 = empty cell, 1–4 = greens. */
const GRID_WEEKS = 20; // keep it panel-width friendly
const GRID_DAYS = 7;

const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

// tiny deterministic PRNG so the wall is stable across re-renders
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function GithubGrid() {
  const cells = useMemo(() => {
    const rnd = mulberry32(2504);
    const out = [];
    for (let w = 0; w < GRID_WEEKS; w += 1) {
      for (let d = 0; d < GRID_DAYS; d += 1) {
        const r = rnd();
        // skew toward the low end so busy days read as highlights
        const level =
          r > 0.9 ? 4 : r > 0.78 ? 3 : r > 0.55 ? 2 : r > 0.32 ? 1 : 0;
        out.push(level);
      }
    }
    return out;
  }, []);

  return (
    <div className="ct-gh">
      <div className="ct-gh__grid" aria-hidden="true">
        {cells.map((level, i) => (
          <span
            key={i}
            className="ct-gh__cell"
            style={{ background: LEVEL_COLORS[level] }}
          />
        ))}
      </div>
      <div className="ct-gh__legend" aria-hidden="true">
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <span key={i} className="ct-gh__key" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ---- Email channel: the EmailJS contact form ----------------------------- */
function EmailForm({ onInteract }) {
  const [formData, setFormData] = useState({ email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (submitStatus) setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await emailjs.sendForm(
        'service_3amebrj',
        'template_q126lg4',
        e.target,
        'zjHsV_tywr2_0qK9O'
      );
      setSubmitStatus('success');
      setFormData({ email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="ct-form" onSubmit={handleSubmit}>
      {submitStatus === 'success' && (
        <p className="ct-form__note ct-form__note--ok">
          Message sent — I’ll get back to you soon.
        </p>
      )}
      {submitStatus === 'error' && (
        <p className="ct-form__note ct-form__note--err">
          Couldn’t send. Try again, or email me directly.
        </p>
      )}

      <div className="ct-field">
        <label className="ct-field__label" htmlFor="ct-email">
          Email Address
        </label>
        <input
          id="ct-email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          onFocus={onInteract}
          className="ct-field__input"
          placeholder="your.email@example.com"
        />
      </div>

      <div className="ct-field">
        <label className="ct-field__label" htmlFor="ct-message">
          Message
        </label>
        <textarea
          id="ct-message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          onFocus={onInteract}
          className="ct-field__input ct-field__input--area"
          placeholder="Tell me about your project…"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`ct-form__btn${isSubmitting ? ' is-busy' : ''}`}
      >
        {isSubmitting ? 'Sending…' : 'Send message'}
        {!isSubmitting && <span className="ct-arrow">→</span>}
      </button>
    </form>
  );
}

/* ---- the reactive right-side detail panel --------------------------------
 * Renders the body below the heading + blurb (which Contact.js owns): bespoke
 * per channel — the GitHub contribution grid, a LinkedIn key/value card, or the
 * EmailJS form. Contact.js fades/rises the whole detail panel in on each settle. */
const ChannelDetail = ({ channel, onEmailInteract }) => {
  if (!channel) return null;
  const { kind } = channel;

  return (
    <div className="ct-detail__body">
      {kind === 'github' && <GithubGrid />}

      {kind === 'linkedin' && (
        <div className="ct-linkedin">
          <div className="ct-linkedin__row">
            <span className="ct-linkedin__k">Profile</span>
            <span className="ct-linkedin__v">{channel.handle}</span>
          </div>
          <div className="ct-linkedin__row">
            <span className="ct-linkedin__k">Best for</span>
            <span className="ct-linkedin__v">roles · collaboration · history</span>
          </div>
        </div>
      )}

      {kind === 'email' && <EmailForm onInteract={onEmailInteract} />}

      {kind === 'link' && (
        <div className="ct-linkedin">
          <div className="ct-linkedin__row">
            <span className="ct-linkedin__k">Link</span>
            <span className="ct-linkedin__v">{channel.handle}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelDetail;
