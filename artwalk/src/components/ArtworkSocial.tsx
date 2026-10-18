import { useState } from 'react';
import type { Artwork } from '../lib/data';
import { artworkShareLinks } from '../lib/share';
import { useLikes } from '../lib/storage';

export default function ArtworkSocial({ art, visited }: { art: Artwork; visited: boolean }) {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(art.id);
  const [message, setMessage] = useState('');
  const links = artworkShareLinks(art.id, art.title, window.location.href);
  const buttonClass = 'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-card transition hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

  const copy = async (instagram = false) => {
    try {
      await navigator.clipboard.writeText(links.url);
      setMessage(instagram ? 'Link copied! Paste it into an Instagram message or story link.' : 'Link copied!');
    } catch {
      setMessage('Copy isn’t available here. Select and copy the link below.');
    }
  };

  return (
    <section aria-label="Like and share this artwork" className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleLike(art.id, visited)}
          disabled={!visited && !liked}
          title={liked ? 'Unlike' : 'Like'}
          aria-pressed={liked}
          aria-label={`${liked ? 'Unlike' : 'Like'} ${art.title}`}
          aria-describedby={`like-hint-${art.id}`}
          className={`${buttonClass} gap-2 disabled:cursor-not-allowed disabled:opacity-45 ${liked ? 'border-rose-300 bg-rose-50 text-rose-700' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
        <p id={`like-hint-${art.id}`} className="text-xs text-ink-3">
          {liked ? 'Saved to your likes on this device.' : visited ? 'Enjoyed this artwork? Give it a heart.' : 'Mark as visited to like this artwork.'}
        </p>
      </div>

      <details className="rounded-2xl border border-line bg-card p-3">
        <summary className="cursor-pointer py-1 text-sm font-semibold">Share artwork</summary>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Share options">
          <button type="button" onClick={() => copy()} className={buttonClass} title="Copy link" aria-label="Copy artwork link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)" /></svg>
          </button>
          <a href={links.email} className={buttonClass} title="Email" aria-label="Share artwork by email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
          </a>
          <a href="https://www.instagram.com/" onClick={() => { void copy(true); }} target="_blank" rel="noopener noreferrer" className={buttonClass} title="Copy link and open Instagram" aria-label="Copy artwork link and open Instagram in a new tab">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
          </a>
          <a href={links.facebook} target="_blank" rel="noopener noreferrer" className={buttonClass} title="Facebook" aria-label="Share on Facebook (opens a new tab)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9Z" /></svg>
          </a>
          <a href={links.x} target="_blank" rel="noopener noreferrer" className={buttonClass} title="X" aria-label="Share on X (opens a new tab)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l5.6 7.4L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" /></svg>
          </a>
        </div>
        <label className="mt-3 block text-xs text-ink-3">
          Artwork link
          <input readOnly value={links.url} onFocus={(event) => event.currentTarget.select()} className="mt-1 h-10 w-full rounded-lg border border-line bg-paper px-2 text-sm text-ink" />
        </label>
        <p role="status" className="mt-2 text-xs text-ink-3">{message}</p>
      </details>
    </section>
  );
}
