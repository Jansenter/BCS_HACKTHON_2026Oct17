import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { personalTour } = await server.ssrLoadModule('/src/lib/profile.ts');
  const { ARTWORK_TAGS, matchesArtworkTags } = await server.ssrLoadModule('/src/lib/artwork-tags.ts');
  const { artworkById, tourStops } = await server.ssrLoadModule('/src/lib/data.ts');
  const { href, parseHash } = await server.ssrLoadModule('/src/lib/router.ts');
  const { default: CommunityHub } = await server.ssrLoadModule('/src/components/CommunityHub.tsx');
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null };

  assert.equal(href({ view: 'profile' }), '#/profile');
  assert.deepEqual(parseHash('#/profile'), { view: 'profile' });
  const walk = { id: 'personal-test', title: 'My weekend walk', artworkIds: [24, 826], updatedAt: '2026-10-18' };
  const tour = personalTour(walk);
  assert.deepEqual(tourStops(tour).map(({ art }) => art.id), [24, 826]);
  assert.equal(tour.title, walk.title);
  assert.deepEqual(personalTour({ ...walk, artworkIds: [826, 24, -1] }).stops.map((stop) => stop.id), [826, 24]);
  assert.deepEqual(parseHash(href({ view: 'tour', tourId: walk.id, art: 826 })), { view: 'tour', tourId: walk.id, art: 826 });

  const initial = renderToStaticMarkup(createElement(CommunityHub));
  assert.match(initial, /Create profile/);
  assert.doesNotMatch(initial, /My collection/);
  storage.set('artwalk:profile', JSON.stringify({ name: 'Lin', interests: [], access: { stepFree: false, avoidStairs: false, lowSensory: false } }));
  storage.set('artwalk:collection', JSON.stringify([24, 826]));
  storage.set('artwalk:walks', JSON.stringify([walk]));
  const returning = renderToStaticMarkup(createElement(CommunityHub));
  for (const text of ['Welcome, Lin', 'My collection', 'Angel of Victory', '10 Baseball Caps', 'My weekend walk', '#/tour/personal-test', 'Edit', 'Delete']) assert.ok(returning.includes(text), `Missing saved profile content: ${text}`);
  for (const tag of ARTWORK_TAGS) {
    const profile = JSON.parse(storage.get('artwalk:profile'));
    storage.set('artwalk:profile', JSON.stringify({ ...profile, interests: [tag.key] }));
    const tagged = renderToStaticMarkup(createElement(CommunityHub));
    assert.ok(tagged.includes(tag.label));
    assert.match(tagged, new RegExp(`aria-pressed="true"[^>]*>${tag.label}</button>`));
    const recommendations = tagged.split('A few more to find')[1].split('Community')[0];
    const ids = [...recommendations.matchAll(/#\/explore\?art=(\d+)/g)].map((match) => Number(match[1]));
    assert.ok(ids.length > 0, `Expected recommendations for ${tag.key}`);
    assert.ok(ids.every((id) => matchesArtworkTags(artworkById(id), [tag.key])), 'Recommended artworks must have verified tag evidence');
    storage.set('artwalk:visited', JSON.stringify(ids));
    const revisited = renderToStaticMarkup(createElement(CommunityHub)).split('A few more to find')[1].split('Community')[0];
    assert.ok(ids.every((id) => !revisited.includes(`art=${id}\"`)), 'Visited artworks must not be recommended again');
    storage.delete('artwalk:visited');
  }
  console.log('Profile checks passed: initial creation form, persisted profile/collection/walks, stop order, invalid artwork filtering, and custom walk links.');
} finally {
  await server.close();
  delete globalThis.localStorage;
}
