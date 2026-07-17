import React from 'react';
import { FaLinkedinIn, FaGithub, FaRegEnvelope, FaLink } from 'react-icons/fa';
import useGithubProfile from './useGithubProfile';

/* The left-side vertical card deck of contact channels. Mechanics mirror the
 * Agents terminal deck (agt-deck): the focused card is centered, sharp and
 * forward; neighbours slide up/down, shrink, gray out and drop back; the offset
 * wraps so cycling past the ends stays a short vertical move.
 *
 * Each card is a full terminal-style PANEL (title bar + body), the same size and
 * treatment as the agents' log panels — not a small pill. The body is a profile
 * card per platform: GitHub pulls REAL data live from the GitHub API; LinkedIn
 * is a faux card (LinkedIn blocks any real embed/scrape), populated with static
 * profile info; Email is a compact "direct line" card.
 *
 * Cycling is driven from Contact.js (auto-rotate + wheel/keys); this component
 * just paints whatever `activeIndex` it's handed. */

const ICONS = {
  linkedin: FaLinkedinIn,
  github: FaGithub,
  email: FaRegEnvelope,
  link: FaLink,
};

/* one stat cell in the GitHub card footer */
function Stat({ value, label }) {
  return (
    <span className="ct-pcard__stat">
      <strong>{value}</strong>
      {label}
    </span>
  );
}

/* GitHub profile card — real avatar / name / bio / counts from the API. */
function GithubBody({ channel }) {
  const { username, fallback } = channel.github || {};
  const { profile } = useGithubProfile(username, fallback);
  const p = profile || fallback || {};
  return (
    <div className="ct-pcard">
      <div className="ct-pcard__head">
        {p.avatar && (
          <img className="ct-pcard__avatar" src={p.avatar} alt={p.name} />
        )}
        <div className="ct-pcard__id">
          <span className="ct-pcard__name">{p.name}</span>
          <span className="ct-pcard__login">@{p.login}</span>
        </div>
      </div>
      {p.bio && <p className="ct-pcard__bio">{p.bio}</p>}
      <div className="ct-pcard__stats">
        <Stat value={p.repos} label="repos" />
        <Stat value={p.followers} label="followers" />
        <Stat value={p.following} label="following" />
      </div>
      {p.location && <p className="ct-pcard__meta">◍ {p.location}</p>}
    </div>
  );
}

/* LinkedIn faux profile card — LinkedIn blocks real embeds/scraping, so this is
 * a styled stand-in populated with static info (brand mark, name, headline). */
function LinkedinBody({ channel }) {
  return (
    <div className="ct-pcard">
      <div className="ct-pcard__head">
        <span
          className="ct-pcard__brand"
          style={{ '--brand': channel.tint }}
          aria-hidden="true"
        >
          <FaLinkedinIn />
        </span>
        <div className="ct-pcard__id">
          <span className="ct-pcard__name">Nikolas Larson</span>
          <span className="ct-pcard__login">{channel.handle}</span>
        </div>
      </div>
      {channel.headline && <p className="ct-pcard__bio">{channel.headline}</p>}
      <p className="ct-pcard__meta">Connect · message · view experience</p>
    </div>
  );
}

/* Email card — a compact "direct line" body. */
function EmailBody({ channel }) {
  return (
    <div className="ct-pcard">
      <div className="ct-pcard__head">
        <span
          className="ct-pcard__brand"
          style={{ '--brand': channel.tint }}
          aria-hidden="true"
        >
          <FaRegEnvelope />
        </span>
        <div className="ct-pcard__id">
          <span className="ct-pcard__name">Direct line</span>
          <span className="ct-pcard__login">{channel.address || channel.handle}</span>
        </div>
      </div>
      <p className="ct-pcard__bio">
        The most direct way to reach me — the form’s on the right.
      </p>
    </div>
  );
}

const BODIES = {
  github: GithubBody,
  linkedin: LinkedinBody,
  email: EmailBody,
};

function ChannelCard({ channel }) {
  const Icon = ICONS[channel.kind] || FaLink;
  const Body = BODIES[channel.kind];
  return (
    <div className="ct-panel">
      <div className="ct-panel__bar">
        <span className="ct-panel__dot" style={{ '--brand': channel.tint }}>
          <Icon />
        </span>
        <span className="ct-panel__name">{channel.name}</span>
        <span className="ct-panel__handle">{channel.handle}</span>
      </div>
      <div className="ct-panel__body">
        {Body ? <Body channel={channel} /> : null}
      </div>
    </div>
  );
}

const ChannelDeck = ({ channels = [], activeIndex = 0, onPick }) => {
  const count = channels.length;

  // signed shortest offset of index i from the active index, wrapping the ring
  const wrappedOffset = (i) => {
    let d = i - activeIndex;
    if (count) {
      if (d > count / 2) d -= count;
      if (d < -count / 2) d += count;
    }
    return d;
  };

  return (
    <div className="ct-deck">
      {channels.map((c, i) => {
        const off = wrappedOffset(i);
        const dist = Math.abs(off);
        const active = off === 0;
        const near = dist <= 1;
        const style = {
          '--off': off,
          '--scale': (1 - Math.min(1, dist) * 0.14).toFixed(3),
          '--gray': Math.min(1, dist),
          '--depth': `${-Math.min(2, dist) * 140}px`,
          zIndex: 10 - dist,
          opacity: near ? 1 : 0,
          pointerEvents: active ? 'auto' : 'none',
        };
        return (
          <button
            type="button"
            key={c.slug}
            className={`ct-slide${active ? ' is-active' : ''}`}
            style={style}
            aria-hidden={!active}
            tabIndex={active ? 0 : -1}
            onClick={() => active && onPick && onPick(c)}
          >
            <ChannelCard channel={c} />
          </button>
        );
      })}
    </div>
  );
};

export default ChannelDeck;
