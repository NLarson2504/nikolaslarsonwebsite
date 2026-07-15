import React, { useEffect, useRef, useState } from 'react';

/**
 * The "agent at work" render on the right of the Agents page. No chrome, no
 * window — just the agent's output on the page, sized large so it reads as the
 * hero (the way the wheel is the hero on the Web/Apps pages).
 *
 * Each agent (lira / tallie / kidd) streams illustrative log lines so it reads
 * as a live backend service. Lines are generic by design — no real data;
 * nothing here calls a real backend.
 */

// Illustrative, deliberately vague activity — evokes an agent working through a
// request (receive → understand → gather → analyze → respond) without exposing
// real tools, models, counts, or architecture.
const LOGS = {
  lira: [
    { dim: '$', text: 'lira · listening' },
    { ts: true, text: 'new document received' },
    { ts: true, text: 'reading…' },
    { ts: true, text: 'extracting the details that matter' },
    { ts: true, ok: true, text: 'reconciled against records' },
    { ts: true, ok: true, text: 'done' },
    { ts: true, text: 'waiting for the next one' },
  ],
  tallie: [
    { dim: '›', text: 'asked about recent cost changes' },
    { ts: true, text: 'understanding the question' },
    { ts: true, text: 'gathering the relevant figures…' },
    { ts: true, text: 'analyzing' },
    { ts: true, ok: true, text: 'found what matters' },
    { ts: true, ok: true, text: 'answered' },
  ],
  kidd: [
    { dim: '›', text: 'asked about campus' },
    { ts: true, text: 'understanding the question' },
    { ts: true, text: 'checking a few sources…' },
    { ts: true, ok: true, text: 'pulled the latest' },
    { ts: true, text: 'putting the answer together' },
    { ts: true, ok: true, text: 'answered' },
  ],
};

const stamp = (i) => {
  const base = 10 * 3600 + 42 * 60 + 1 + i;
  const hh = String(Math.floor(base / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(base / 60) % 60).padStart(2, '0');
  const ss = String(base % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

/* ---- log-streaming agents ------------------------------------------------- */
function LogRun({ slug, reduceMotion }) {
  const script = LOGS[slug] || [];
  const [n, setN] = useState(reduceMotion ? script.length : 0);
  const timers = useRef([]);

  useEffect(() => {
    setN(reduceMotion ? script.length : 0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reduceMotion) return undefined;
    script.forEach((_, i) => {
      timers.current.push(setTimeout(() => setN(i + 1), 260 + i * 620));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [slug, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="agt-log">
      {script.slice(0, n).map((line, i) => (
        <div className="agt-line" key={i}>
          {line.dim && <span className="agt-dim">{line.dim} </span>}
          {line.ts && <span className="agt-dim">[{stamp(i)}] </span>}
          {line.ok && <span className="agt-ok">✓ </span>}
          <span className={line.dim ? 'agt-cmd' : 'agt-txt'}>{line.text}</span>
        </div>
      ))}
      <div className="agt-line">
        <span className="agt-dim">$</span> <span className="agt-cursor">▋</span>
      </div>
    </div>
  );
}

const AgentTerminal = ({ agent }) => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slug = agent?.slug || '';

  return (
    <div className="agt-render">
      <LogRun key={slug} slug={slug} reduceMotion={reduceMotion} />
    </div>
  );
};

export default AgentTerminal;
