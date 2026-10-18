import { useState, type FormEvent } from 'react';
import { artworkById } from '../lib/data';
import { useCollection, usePersonalWalks, type PersonalWalk } from '../lib/profile';
import { href } from '../lib/router';

export default function PersonalCollection() {
  const { ids, toggle } = useCollection();
  const [walks, setWalks] = usePersonalWalks();
  const [title, setTitle] = useState('');
  const [stops, setStops] = useState<number[]>([]);
  const [editing, setEditing] = useState<string>();
  const [message, setMessage] = useState('');
  const reset = () => { setTitle(''); setStops([]); setEditing(undefined); };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || stops.length < 2) { setMessage('Name your walk and choose at least two artworks.'); return; }
    const id = editing ?? `personal-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const walk: PersonalWalk = { id, title: title.trim(), artworkIds: stops, updatedAt: new Date().toISOString() };
    setWalks((current) => [walk, ...current.filter((item) => item.id !== walk.id)]);
    reset(); setMessage('Walk saved. Open it below to start exploring.');
  };
  const move = (index: number, offset: number) => setStops((current) => {
    const next = [...current];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    return next;
  });
  const button = 'min-h-11 rounded-xl border border-line px-3 py-2 text-sm font-semibold disabled:opacity-40';
  return <div className="space-y-6 md:col-span-2">
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="font-display text-2xl font-semibold">My collection</h2>
      <p className="mt-1 text-sm text-ink-2">Save favourite pieces from their artwork pages, then bring them together in a walk.</p>
      {!ids.length && <p className="mt-4 text-sm text-ink-3">Your collection is empty. <a className="font-semibold underline" href={href({ view: 'explore' })}>Explore artworks →</a></p>}
      <ul className="mt-3 divide-y divide-line">{ids.map((id) => {
        const art = artworkById(id)!;
        return <li key={id} className="flex flex-wrap items-center gap-3 py-3">
          <a className="min-w-0 flex-1 font-semibold" href={href({ view: 'explore', art: id })}>{art.title}</a>
          <button className={button} onClick={() => toggle(id)} aria-label={`Remove ${art.title} from collection`}>Remove</button>
        </li>;
      })}</ul>
    </section>
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="font-display text-2xl font-semibold">{editing ? 'Edit your walk' : 'Curate your own walk'}</h2>
      <form onSubmit={save} className="mt-4 space-y-4">
        <label className="block text-sm font-semibold">Walk name<input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My weekend art walk" className="mt-1 block w-full rounded-xl border border-line bg-paper px-3 py-3" /></label>
        <fieldset><legend className="text-sm font-semibold">Choose pieces from your collection</legend>
          {!ids.length && <p className="mt-2 text-sm text-ink-3">Save a few artworks to your collection to get started.</p>}
          <div className="mt-2 flex flex-wrap gap-2">{ids.map((id) => <button type="button" key={id} aria-pressed={stops.includes(id)} className={`${button} ${stops.includes(id) ? 'bg-ink text-paper' : ''}`} onClick={() => setStops((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}>{artworkById(id)!.title}</button>)}</div>
        </fieldset>
        <ol className="divide-y divide-line">{stops.map((id, index) => <li key={id} className="flex flex-wrap items-center gap-2 py-2">
          <span className="min-w-0 flex-1 text-sm">{index + 1}. {artworkById(id)?.title}</span>
          <button type="button" className={button} disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${artworkById(id)?.title} up`}>↑</button>
          <button type="button" className={button} disabled={index === stops.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${artworkById(id)?.title} down`}>↓</button>
          <button type="button" className={button} onClick={() => setStops((current) => current.filter((item) => item !== id))} aria-label={`Remove ${artworkById(id)?.title} from walk`}>Remove</button>
        </li>)}</ol>
        <p className="text-xs text-ink-3">Choose at least two stops. The map follows your chosen order.</p>
        <div className="flex gap-2"><button className="min-h-11 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper">{editing ? 'Save changes' : 'Save walk'}</button>{editing && <button type="button" className={button} onClick={reset}>Cancel</button>}</div>
        {message && <p role="status" className="text-sm text-ink-2">{message}</p>}
      </form>
      <h3 className="mt-6 text-lg font-semibold">My walks</h3>
      {!walks.length && <p className="mt-2 text-sm text-ink-3">Your saved walks will appear here.</p>}
      <ul className="mt-2 divide-y divide-line">{walks.map((walk) => <li key={walk.id} className="flex flex-wrap items-center gap-3 py-3">
        <div className="min-w-0 flex-1"><h4 className="font-semibold">{walk.title}</h4><p className="text-xs text-ink-3">{walk.artworkIds.length} stops</p></div>
        <a className={button} href={href({ view: 'tour', tourId: walk.id })}>Open walk →</a>
        <button className={button} onClick={() => { setEditing(walk.id); setTitle(walk.title); setStops(walk.artworkIds); setMessage(''); }}>Edit</button>
        <button className={button} onClick={() => { setWalks((current) => current.filter((item) => item.id !== walk.id)); if (editing === walk.id) reset(); }}>Delete</button>
      </li>)}</ul>
    </section>
  </div>;
}
