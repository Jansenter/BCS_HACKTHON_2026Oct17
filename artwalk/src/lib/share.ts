import { href } from './router';

/** Share the artwork itself, independently of the current tour or map filters. */
export function artworkShareLinks(id: number, title: string, pageUrl: string) {
  const page = new URL(pageUrl);
  page.search = '';
  page.hash = href({ view: 'explore', art: id });
  const url = page.toString();
  const text = `Discover “${title}” on Public ArtWalk - Paw.`;
  return {
    url,
    email: `mailto:?subject=${encodeURIComponent(`${title} — Public ArtWalk - Paw`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`,
    x: `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url })}`,
  };
}
