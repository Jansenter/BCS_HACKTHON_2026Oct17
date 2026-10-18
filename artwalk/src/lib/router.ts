import { useEffect, useState } from 'react';

/** Tiny hash router: #/  #/explore  #/tour/:id  — with ?art=123 for the open story. */
export type Route =
  | { view: 'home' }
  | { view: 'profile' }
  | { view: 'explore'; art?: number }
  | { view: 'tour'; tourId: string; art?: number };

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const art = Number(new URLSearchParams(query).get('art')) || undefined;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'profile') return { view: 'profile' };
  if (parts[0] === 'explore') return { view: 'explore', art };
  if (parts[0] === 'tour' && parts[1]) return { view: 'tour', tourId: parts[1], art };
  return { view: 'home' };
}

export function href(route: Route): string {
  const q = 'art' in route && route.art ? `?art=${route.art}` : '';
  if (route.view === 'profile') return '#/profile';
  if (route.view === 'explore') return `#/explore${q}`;
  if (route.view === 'tour') return `#/tour/${route.tourId}${q}`;
  return '#/';
}

export const navigate = (route: Route) => {
  window.location.hash = href(route);
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
