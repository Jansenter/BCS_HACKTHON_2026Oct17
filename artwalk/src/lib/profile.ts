import type { Tour } from '../data/tours';
import { artworkById } from './data';
import { usePersistentState } from './storage';

export type Profile = { name: string; interests: string[]; access: { stepFree: boolean; avoidStairs: boolean; lowSensory: boolean } };
const EMPTY_PROFILE: Profile = { name: '', interests: [], access: { stepFree: false, avoidStairs: false, lowSensory: false } };
export function useProfile() {
  return usePersistentState<Profile>('artwalk:profile', EMPTY_PROFILE);
}
export type PersonalWalk = { id: string; title: string; artworkIds: number[]; updatedAt: string };
export function useCollection() {
  const [stored, setStored] = usePersistentState<number[]>('artwalk:collection', []);
  const ids = Array.isArray(stored) ? stored.filter((id) => Number.isSafeInteger(id) && artworkById(id)) : [];
  const toggle = (id: number) => setStored((current) => {
    const items = Array.isArray(current) ? current : [];
    return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  });
  return { ids, toggle };
}
export function usePersonalWalks() {
  return usePersistentState<PersonalWalk[]>('artwalk:walks', []);
}
export function personalTour(walk: PersonalWalk): Tour {
  return {
    id: walk.id, title: walk.title, tagline: 'Your own art walk', theme: 'Your collection, your route',
    minutes: walk.artworkIds.length * 5, accent: '#0E6E6A', accentSoft: '#D6EBE8',
    stops: walk.artworkIds.filter((id) => artworkById(id)).map((id) => ({ id, prompt: 'What detail catches your eye in this artwork?' })),
  };
}
