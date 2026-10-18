import { useEffect } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { NearbyPlace } from '../lib/nearby';
import type { LatLon } from '../lib/geo';

export function NearbyMarkers({ places, selectedId, onSelect }: { places: NearbyPlace[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <>{places.map((place, index) => <Marker key={place.id} position={[place.lat, place.lon]}
    title={`Nearby stop ${index + 1}: ${place.name}`} zIndexOffset={selectedId === place.id ? 2500 : 1500}
    icon={L.divIcon({ className: '', iconSize: [36, 36], iconAnchor: [18, 18], html: `<div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:${selectedId === place.id ? '#1c1a17' : '#0e6e6a'};color:white;font-weight:700;border:3px solid white;box-shadow:0 0 0 ${selectedId === place.id ? '4px #e2512f' : '1px #0e6e6a'}">${index + 1}</div>` })}
    eventHandlers={{ click: () => onSelect(place.id) }}>
    <Tooltip key={`${place.id}:${selectedId === place.id}`} direction="top" offset={[0, -20]} permanent={selectedId === place.id}>{place.name}</Tooltip>
  </Marker>)}</>;
}
export function NearbyCamera({ origin, places, selectedId }: { origin: LatLon; places: NearbyPlace[]; selectedId?: string }) {
  const map = useMap();
  const key = places.map((p) => `${p.id}:${p.lat}:${p.lon}`).join('|');
  useEffect(() => {
    if (places.length) map.fitBounds(L.latLngBounds([[origin.lat, origin.lon], ...places.map((p) => [p.lat, p.lon] as [number, number])]), { padding: [45, 45], maxZoom: 17, animate: false });
  }, [map, origin.lat, origin.lon, key]);
  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (place) map.panTo([place.lat, place.lon], { animate: false });
  }, [map, selectedId, key]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export default function NearbyMap({ origin, places, selectedId, onSelect }: { origin: LatLon; places: NearbyPlace[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <div className="mt-3 h-56 overflow-hidden rounded-xl border border-line" aria-label="Map of nearby places">
    <MapContainer center={[origin.lat, origin.lon]} zoom={16} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <CircleMarker center={[origin.lat, origin.lon]} radius={7} pathOptions={{ color: '#fff', fillColor: '#e2512f', fillOpacity: 1, weight: 2 }}><Tooltip>Artwork</Tooltip></CircleMarker>
      <NearbyMarkers places={places} selectedId={selectedId} onSelect={onSelect} />
      <NearbyCamera origin={origin} places={places} selectedId={selectedId} />
    </MapContainer>
  </div>;
}
