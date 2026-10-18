import evidence from '../data/artwork-tag-evidence.json';
import type { Artwork } from './data';

export const ARTWORK_TAGS = [
  { key: 'bipoc', label: 'By BIPOC artists', color: '#7651a8' },
  { key: 'indigenous-artwork', label: 'Indigenous Artwork', color: '#a4461b' },
] as const;
export type ArtworkTag = typeof ARTWORK_TAGS[number]['key'];

/** Positive, documented matches only. No match means unknown, not a negative identity. */
export function artworkTagEvidence(art: Artwork, tag: ArtworkTag) {
  return [
    ...evidence.artistEvidence.filter((row) => art.artistIds.includes(row.artistId) && row.tags.includes(tag)),
    ...evidence.artworkEvidence.filter((row) => row.artworkId === art.id && row.tags.includes(tag)),
  ];
}
export function matchesArtworkTags(art: Artwork, tags: ArtworkTag[]) {
  return tags.every((tag) => artworkTagEvidence(art, tag).length > 0);
}
