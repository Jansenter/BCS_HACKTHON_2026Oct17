import { useEffect, useState } from 'react';
import { walkingEstimate, type LatLon } from './geo';

export interface WalkRoute {
  path: [number, number][]; // [lat, lon]
  metres: number;
  source: 'openrouteservice' | 'estimate';
}

const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined;

function estimate(points: LatLon[]): WalkRoute {
  return {
    path: points.map((p) => [p.lat, p.lon]),
    metres: walkingEstimate(points),
    source: 'estimate',
  };
}

/**
 * Real walking geometry from openrouteservice when VITE_ORS_API_KEY is set (cached in
 * localStorage so the demo works offline after the first load); otherwise a straight-line
 * estimate so the app never depends on a network call.
 */
export function useWalkRoute(cacheKey: string, points: LatLon[]): WalkRoute {
  const [route, setRoute] = useState<WalkRoute>(() => {
    try {
      const cached = localStorage.getItem(`artwalk:route:${cacheKey}`);
      if (cached) return JSON.parse(cached) as WalkRoute;
    } catch {
      /* ignore */
    }
    return estimate(points);
  });

  useEffect(() => {
    if (!ORS_KEY || route.source === 'openrouteservice' || points.length < 2) return;
    const ctrl = new AbortController();
    fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: points.map((p) => [p.lon, p.lat]) }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((geo) => {
        const f = geo.features?.[0];
        if (!f) return;
        const next: WalkRoute = {
          path: f.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
          metres: f.properties.summary.distance,
          source: 'openrouteservice',
        };
        localStorage.setItem(`artwalk:route:${cacheKey}`, JSON.stringify(next));
        setRoute(next);
      })
      .catch(() => {
        /* keep the estimate */
      });
    return () => ctrl.abort();
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return route;
}

/** Live position via the Geolocation API (only starts when `enabled`). */
export function useGeolocation(enabled: boolean) {
  const [pos, setPos] = useState<LatLon | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setError('Location is not available in this browser.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError(null);
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude });
      },
      (e) => setError(e.code === 1 ? 'Location permission was denied.' : 'Could not find your location.'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);
  return { pos, error };
}
