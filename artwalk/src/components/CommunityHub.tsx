import { useMemo, useState, type FormEvent } from 'react';
import { ARTWORKS, categoryOf, CATEGORIES } from '../lib/data';
import { usePersistentState, useVisited } from '../lib/storage';
import { href } from '../lib/router';
import { useLanguage } from '../lib/language';

type Profile = { name: string; interests: string[]; access: { stepFree: boolean; avoidStairs: boolean; lowSensory: boolean } };
type Suggestion = { title: string; location: string; details: string };
const PROFILE_KEY = 'artwalk:profile';
const SUGGESTIONS_KEY = 'artwalk:suggestions';
const emptyProfile: Profile = { name: '', interests: [], access: { stepFree: false, avoidStairs: false, lowSensory: false } };

export default function CommunityHub() {
  const { t } = useLanguage();
  const [profile, setProfile] = usePersistentState<Profile>(PROFILE_KEY, emptyProfile);
  const [suggestions, setSuggestions] = usePersistentState<Suggestion[]>(SUGGESTIONS_KEY, []);
  const { visited } = useVisited();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [saved, setSaved] = useState(false);
  const [signedIn, setSignedIn] = useState(!!profile.name);
  const [name, setName] = useState(profile.name);

  const recommendations = useMemo(() => {
    const counts = new Map<string, number>();
    ARTWORKS.filter((art) => visited.includes(art.id)).forEach((art) => {
      const cat = categoryOf(art.type);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    });
    const favored = profile.interests.length ? profile.interests : [...counts].sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
    const pool = ARTWORKS.filter((art) => !visited.includes(art.id) && (!favored.length || favored.includes(categoryOf(art.type))));
    return (pool.length ? pool : ARTWORKS.filter((art) => !visited.includes(art.id))).slice(0, 3);
  }, [profile.interests, visited]);

  const toggleInterest = (key: string) => setProfile((p) => ({ ...p, interests: p.interests.includes(key) ? p.interests.filter((k) => k !== key) : [...p.interests, key] }));
  const setAccess = (key: keyof Profile['access']) => setProfile((p) => ({ ...p, access: { ...p.access, [key]: !p.access[key] } }));
  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const next = { ...profile, name: name.trim() };
    setProfile(next);
    setSignedIn(!!next.name);
  };
  const addSuggestion = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !location.trim()) return;
    setSuggestions((items) => [{ title: title.trim(), location: location.trim(), details: details.trim() }, ...items]);
    setTitle(''); setLocation(''); setDetails(''); setSaved(true);
  };
  const section = 'rounded-3xl border border-line bg-card p-5';
  return <section className="mt-14 grid gap-5 md:grid-cols-2" aria-label="Your ArtWalk community and preferences">
    <div className={section}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vermilion">Your guide</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">{signedIn ? `${t('Welcome')}, ${profile.name}` : t('Make it yours')}</h2>
      <p className="mt-1 text-sm text-ink-2">{t('A local demo profile personalizes suggestions and keeps your preferences on this device.')}</p>
      <form onSubmit={saveProfile} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="profile-name">{t('Your name')}</label>
        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Your name')} className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2" />
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper">{signedIn ? t('Update') : t('Create profile')}</button>
      </form>
      <h3 className="mt-5 text-sm font-semibold">{t('Recommend more of')}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => <button key={c.key} type="button" onClick={() => toggleInterest(c.key)} aria-pressed={profile.interests.includes(c.key)} className={`rounded-full border px-3 py-1.5 text-xs ${profile.interests.includes(c.key) ? 'border-ink bg-ink text-paper' : 'border-line'}`}>{c.label}</button>)}</div>
      <h3 className="mt-5 text-sm font-semibold">{t('Accessibility route preferences')}</h3>
      <div className="mt-2 grid gap-2 text-sm">{([["stepFree", "Prefer step-free paths"], ["avoidStairs", "Avoid stairs"], ["lowSensory", "Prefer quieter, less crowded stops"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={profile.access[key]} onChange={() => setAccess(key)} />{label}</label>)}</div>
      <p className="mt-3 text-xs leading-relaxed text-ink-3">Preferences are saved for planning. This prototype does not yet have verified curb, elevator, surface, or crowd data, so map paths cannot guarantee an accessible route.</p>
    </div>
    <div className="space-y-5">
      <div className={section}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vermilion">{t('Picked for you')}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t('A few more to find')}</h2>
        <p className="mt-1 text-sm text-ink-2">Based on your chosen interests and the art you have visited.</p>
        <ul className="mt-3 divide-y divide-line">{recommendations.map((art) => <li key={art.id}><a href={href({ view: 'explore', art: art.id })} className="flex items-center justify-between gap-3 py-3"><span><strong className="block text-sm">{art.title}</strong><span className="text-xs text-ink-3">{art.type} · {art.site ?? art.address}</span></span><span aria-hidden>→</span></a></li>)}</ul>
      </div>
      <div className={section}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vermilion">{t('Community')}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t('Suggest an artwork')}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('Share a public artwork or a correction for the team to review.')}</p>
        <form onSubmit={addSuggestion} className="mt-3 grid gap-2">
          <label className="sr-only" htmlFor="suggest-title">{t('Artwork name')}</label><input id="suggest-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Artwork name')} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          <label className="sr-only" htmlFor="suggest-location">{t('Location')}</label><input id="suggest-location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('Location or address')} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          <label className="sr-only" htmlFor="suggest-details">{t('Details')}</label><textarea id="suggest-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('What should we know?')} rows={2} className="resize-y rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          <button className="justify-self-start rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">{t('Submit suggestion')}</button>
          {saved && <p role="status" className="text-xs text-good">Suggestion saved on this device for review.</p>}
        </form>
        {suggestions.length > 0 && <p className="mt-3 text-xs text-ink-3">{suggestions.length} local suggestion{suggestions.length === 1 ? '' : 's'} saved.</p>}
      </div>
    </div>
  </section>;
}
