export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  metres: number;
  kind: string;
  cuisine: string | null;
  vegetarian: boolean;
  vegan: boolean;
  outdoorSeating: boolean;
  address: string | null;
  sourceUrl: string;
  directionsUrl: string;
}
export interface NearbySelection {
  artworkId: number;
  places: NearbyPlace[];
  selectedId?: string;
}
