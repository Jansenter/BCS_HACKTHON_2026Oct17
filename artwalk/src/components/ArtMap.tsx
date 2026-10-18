import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { categoryOf, type Artwork } from '../lib/data';
import { NEIGHBOURHOODS, neighbourhoodColor, type Neighbourhood } from '../lib/neighbourhoods';
import type { LatLon } from '../lib/geo';

const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;

export interface MapPoint {
  art: Artwork;
  label?: string; // stop number for tours
  visited?: boolean;
}

const CAT_COLORS: Record<string, string> = {
  sculpture: '#e2512f',
  site: '#0e6e6a',
  memorial: '#5a4a3a',
  water: '#2a7fb0',
  wall: '#9b3c74',
  indigenous: '#7a1f1f',
  media: '#4b4bb0',
};
export const categoryColor = (type: string) => CAT_COLORS[categoryOf(type)] ?? '#1c1a17';

function pinIcon(label: string, color: string, active: boolean, visited: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    html: `<div class="aw-pin ${active ? 'is-active' : ''}" style="background:${visited ? '#2f7d4f' : color}"><span>${visited ? '✓' : label}</span></div>`,
  });
}
function dotIcon(color: string, active: boolean, visited: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div class="aw-dot ${active ? 'is-active' : ''}" style="background:${color};${visited ? 'box-shadow:0 0 0 3px #2f7d4f' : ''}"></div>`,
  });
}
const meIcon = L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: '<div class="aw-me"></div>' });

function FitBounds({ points, fitKey }: { points: [number, number][]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 17 });
    // Refit only when the set of points (fitKey) changes, not on every render.
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FlyTo({ target }: { target?: LatLon }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [target?.lat, target?.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Leaflet measures its container on mount; re-measure when the layout around it changes. */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function NeighbourhoodLayer({ area }: { area: Neighbourhood }) {
  const color = neighbourhoodColor(area.properties.name);
  return (
    <GeoJSON
      data={area}
      style={{ color, fillColor: color, weight: 2, opacity: 0.82, fillOpacity: 0.14 }}
      bubblingMouseEvents={false}
      eventHandlers={{
        mouseover: (event) => (event.target as L.GeoJSON).setStyle({ weight: 3, fillOpacity: 0.24 }),
        mouseout: (event) => (event.target as L.GeoJSON).setStyle({ weight: 2, fillOpacity: 0.14 }),
      }}
    >
      <Tooltip sticky>{area.properties.name}</Tooltip>
    </GeoJSON>
  );
}

export default function ArtMap({
  points,
  mode,
  activeId,
  onSelect,
  path,
  accent = '#e2512f',
  me,
  fitKey,
  focusId,
}: {
  points: MapPoint[];
  mode: 'tour' | 'explore';
  activeId?: number;
  onSelect: (id: number) => void;
  path?: [number, number][];
  accent?: string;
  me?: LatLon | null;
  fitKey: string;
  /** Only this id moves the camera (e.g. the open story); activeId just highlights. */
  focusId?: number;
}) {
  const bounds = useMemo(() => {
    if (mode === 'explore') {
      const areaBounds = L.geoJSON(NEIGHBOURHOODS).getBounds();
      if (areaBounds.isValid()) {
        return [
          [areaBounds.getSouth(), areaBounds.getWest()],
          [areaBounds.getNorth(), areaBounds.getEast()],
        ] as [number, number][];
      }
    }
    return points.map((p) => [p.art.lat, p.art.lon] as [number, number]);
  }, [mode, points]);
  const focus = points.find((p) => p.art.id === focusId)?.art;

  return (
    <MapContainer
      center={[49.2827, -123.1207]}
      zoom={15}
      zoomControl={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_API_KEY ?? '')}`}
        subdomains="abcd"
        maxZoom={20}
      />
      {mode === 'explore' && NEIGHBOURHOODS.map((area) => (
        <NeighbourhoodLayer key={area.properties.name} area={area} />
      ))}
      <FitBounds points={bounds} fitKey={fitKey} />
      <FlyTo target={focus ? { lat: focus.lat, lon: focus.lon } : undefined} />
      <InvalidateOnResize />

      {path && path.length > 1 && (
        <>
          <Polyline positions={path} pathOptions={{ color: '#fffdf8', weight: 8, opacity: 0.9 }} />
          <Polyline positions={path} pathOptions={{ color: accent, weight: 4, dashArray: '2 9', lineCap: 'round' }} />
        </>
      )}

      {points.map(({ art, label, visited }) => (
        <Marker
          key={art.id}
          position={[art.lat, art.lon]}
          zIndexOffset={art.id === activeId ? 1000 : 0}
          icon={
            mode === 'tour'
              ? pinIcon(label ?? '•', accent, art.id === activeId, !!visited)
              : dotIcon(categoryColor(art.type), art.id === activeId, !!visited)
          }
          eventHandlers={{ click: () => onSelect(art.id) }}
          keyboard
          title={art.title}
        >
          {mode === 'explore' && (
            <Tooltip direction="top" offset={[0, -8]}>
              {art.title}
            </Tooltip>
          )}
        </Marker>
      ))}

      {me && <Marker position={[me.lat, me.lon]} icon={meIcon} interactive={false} />}
    </MapContainer>
  );
}
