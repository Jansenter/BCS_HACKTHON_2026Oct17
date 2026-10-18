import { useCallback, useEffect, useState } from 'react';

/** useState that persists to localStorage and syncs across tabs/components. */
export function usePersistentState<T>(key: string, initial: T) {
  const read = useCallback((): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : initial;
    } catch {
      return initial;
    }
  }, [key]); // `initial` is a literal default; re-reading only depends on the key

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = (e: Event) => {
      if (e instanceof StorageEvent && e.key !== key) return;
      if (e instanceof CustomEvent && e.detail !== key) return;
      setValue(read());
    };
    window.addEventListener('storage', sync);
    window.addEventListener('artwalk-storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('artwalk-storage', sync);
    };
  }, [key, read]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
          queueMicrotask(() => window.dispatchEvent(new CustomEvent('artwalk-storage', { detail: key })));
        } catch {
          /* storage full or blocked — keep in memory */
        }
        return v;
      });
    },
    [key],
  );

  return [value, update] as const;
}

/** Visited artworks are global, so visiting a work in Explore also counts toward a tour. */
export function useVisited() {
  const [visited, setVisited] = usePersistentState<number[]>('artwalk:visited', []);
  const isVisited = (id: number) => visited.includes(id);
  const toggle = (id: number) =>
    setVisited((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const markVisited = (id: number) => setVisited((v) => (v.includes(id) ? v : [...v, id]));
  const reset = (ids: number[]) => setVisited((v) => v.filter((x) => !ids.includes(x)));
  return { visited, isVisited, toggle, markVisited, reset };
}

/** Challenge answers: artworkId → correct? */
export function useChallenges() {
  const [answers, setAnswers] = usePersistentState<Record<string, boolean>>('artwalk:challenges', {});
  const record = (key: string, correct: boolean) => setAnswers((a) => ({ ...a, [key]: correct }));
  return { answers, record };
}

/** Personal likes persist on this browser; public totals need a shared backend. */
export function useLikes() {
  const [stored, setLikes] = usePersistentState<number[]>('artwalk:likes', []);
  const likes = Array.isArray(stored) ? stored.filter((id) => Number.isSafeInteger(id)) : [];
  const isLiked = (id: number) => likes.includes(id);
  const toggleLike = (id: number, visited: boolean) => setLikes((value) => {
    const current = Array.isArray(value) ? value.filter((item) => Number.isSafeInteger(item)) : [];
    if (current.includes(id)) return current.filter((item) => item !== id);
    return visited ? [...current, id] : current;
  });
  return { likes, isLiked, toggleLike };
}
