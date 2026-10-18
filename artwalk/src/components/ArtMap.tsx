import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { categoryOf, type Artwork } from '../lib/data';
import { neighbourhoodColor, type Neighbourhood } from '../lib/neighbourhoods';
import type { LatLon } from '../lib/geo';

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

/** Broad areas render first so smaller neighbourhoods remain clickable on top. */
function AreaLayer({ area, selected, onSelect }: { area: Neighbourhood; selected: boolean; onSelect?: (name: string) => void }) {
  const color = neighbourhoodColor(area.properties.name);
  const style = {
    color, fillColor: color, weight: selected ? 4 : 2,
    opacity: selected ? 1 : 0.8, fillOpacity: selected ? 0.25 : 0.08,
    dashArray: area.properties.approximate ? '6 5' : undefined,
  };
  return (
    <GeoJSON data={area} style={style} bubblingMouseEvents={false} eventHandlers={{
      click: () => onSelect?.(area.properties.name),
      mouseover: (event) => { (event.target as L.GeoJSON).setStyle({ weight: 4, fillOpacity: 0.32 }); },
      mouseout: (event) => { (event.target as L.GeoJSON).setStyle(style); },
    }}>
      <Tooltip sticky>
        <span>{area.properties.name}{area.properties.approximate ? ' (approximate)' : ''}{selected ? ' · selected' : ' · click to explore'}</span>
      </Tooltip>
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
  boundary,
  areas,
  onAreaSelect,
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
  boundary?: Neighbourhood;
  areas?: Neighbourhood[];
  onAreaSelect?: (name: string) => void;
}) {
  const bounds = useMemo(() => {
    if (boundary) {
      const b = L.geoJSON(boundary).getBounds();
      return [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]] as [number, number][];
    }
    if (areas?.length) {
      const b = L.geoJSON(areas).getBounds();
      return [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]] as [number, number][];
    }
    return points.map((p) => [p.art.lat, p.art.lon] as [number, number]);
  }, [points, boundary, areas]);
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={20}
      />
      {areas && [...areas].sort((a, b) => Number(!!a.properties.approximate) - Number(!!b.properties.approximate)).map((area) => (
        <AreaLayer key={area.properties.name} area={area} selected={area.properties.name === boundary?.properties.name} onSelect={onAreaSelect} />
      ))}
      {!areas && boundary && <GeoJSON key={boundary.properties.name} data={boundary} interactive={false} style={{ color: '#0e6e6a', weight: 3, fillOpacity: 0.06, dashArray: boundary.properties.approximate ? '6 5' : undefined }} />}
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
