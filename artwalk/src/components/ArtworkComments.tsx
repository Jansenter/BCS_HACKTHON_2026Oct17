import { useState, type FormEvent } from 'react';
import type { Artwork } from '../lib/data';
import { useProfile } from '../lib/profile';
import { usePersistentState } from '../lib/storage';

type Comment = { id: string; author: string; text: string; createdAt: string };

export default function ArtworkComments({ art }: { art: Artwork }) {
  const [profile] = useProfile();
  const [comments, setComments] = usePersistentState<Comment[]>(`artwalk:comments:${art.id}`, []);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body) { setMessage('Write a comment before posting.'); return; }
    const comment: Comment = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: profile.name.trim() || 'Visitor', text: body.slice(0, 1000), createdAt: new Date().toISOString(),
    };
    setComments((current) => [comment, ...current]);
    setText('');
    setMessage('Comment saved on this device.');
  };
  return <section className="rounded-2xl border border-line bg-card p-4" aria-labelledby={`comments-heading-${art.id}`}>
    <h3 id={`comments-heading-${art.id}`} className="font-semibold">Comments</h3>
    <p id={`comments-hint-${art.id}`} className="mt-1 text-xs text-ink-3">What do you think of this artwork? Comments are saved in this browser and are only visible on this device.</p>
    <form onSubmit={submit} className="mt-3 space-y-2">
      <label htmlFor={`comment-${art.id}`} className="block text-sm font-semibold">Your comment</label>
      <textarea id={`comment-${art.id}`} value={text} onChange={(event) => { setText(event.target.value); setMessage(''); }} maxLength={1000} required rows={3} placeholder="Share a detail you noticed or how this artwork made you feel…" aria-describedby={`comments-hint-${art.id}`} className="block w-full resize-y rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-3">Posting as {profile.name.trim() || 'Visitor'} · {text.length}/1000</p>
        <button type="submit" disabled={!text.trim()} className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50">Post comment</button>
      </div>
    </form>
    <p role="status" className="mt-2 text-xs text-ink-3">{message}</p>
    {!comments.length && <p className="mt-3 text-sm text-ink-3">No comments yet. Add your first impression.</p>}
    <ul className="mt-3 divide-y divide-line">{comments.map((comment) => <li key={comment.id} className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold">{comment.author}</p><time dateTime={comment.createdAt} className="text-xs text-ink-3">{new Date(comment.createdAt).toLocaleString()}</time></div>
        <button type="button" onClick={() => { setComments((current) => current.filter((item) => item.id !== comment.id)); setMessage('Comment deleted.'); }} className="min-h-11 px-2 text-xs font-semibold text-ink-3 underline" aria-label={`Delete comment by ${comment.author}`}>Delete</button>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-2">{comment.text}</p>
    </li>)}</ul>
  </section>;
}
