import { useEffect, useState } from 'react';

/* Fetches a public GitHub profile straight from the browser via GitHub's REST
 * API — it's CORS-enabled and needs no token for public, unauthenticated reads.
 * Returns real avatar / name / bio / follower + repo counts. Falls back to
 * `fallback` (baked-in static info) if the request fails or is rate-limited, so
 * the card always has something to show. */
export default function useGithubProfile(username, fallback = null) {
  const [profile, setProfile] = useState(fallback);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'

  useEffect(() => {
    if (!username) return undefined;
    let alive = true;
    setStatus('loading');
    fetch(`https://api.github.com/users/${username}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!alive) return;
        setProfile({
          login: d.login,
          name: d.name || d.login,
          bio: d.bio || '',
          avatar: d.avatar_url,
          followers: d.followers,
          following: d.following,
          repos: d.public_repos,
          location: d.location || '',
          url: d.html_url,
        });
        setStatus('ok');
      })
      .catch(() => {
        if (!alive) return;
        setProfile(fallback);
        setStatus('error');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return { profile, status };
}
