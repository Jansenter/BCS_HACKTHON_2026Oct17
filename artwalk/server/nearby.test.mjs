import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createNearbyService, createNearbyHandler, normalizePlaces, validateRequest, validateSelection } from './nearby.mjs';

const input = { artworkId: 24, category: 'coffee', radius: 800 };
const { art } = validateRequest(input);
const elements = [
  { type: 'node', id: 10, lat: art.lat, lon: art.lon, tags: { name: 'Mapped café', amenity: 'cafe', 'diet:vegetarian': 'yes', cuisine: 'coffee_shop' } },
  { type: 'way', id: 11, center: { lat: art.lat + .001, lon: art.lon }, tags: { name: 'Second café', amenity: 'cafe', website: 'javascript:bad' } },
  { type: 'node', id: 12, lat: 0, lon: 0, tags: { name: 'Outside radius' } },
  { type: 'node', id: 13, lat: art.lat, lon: art.lon, tags: {} },
];
const json = (value, status = 200) => ({ ok: status === 200, status, json: async () => value });
const aiResponse = (placeIds) => json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ placeIds }) }] }] });

test('validates artwork IDs, bounded radius, categories and preferences before provider calls', () => {
  for (const value of [null, {}, { ...input, artworkId: '24' }, { ...input, artworkId: -1 }, { ...input, category: '__proto__' }, { ...input, radius: 50000 }, { ...input, preferences: 'a'.repeat(201) }]) assert.throws(() => validateRequest(value));
});
test('normalizes nodes and polygon centres, excludes unnamed/far places, generates trusted links', () => {
  const result = normalizePlaces(elements, art, 800);
  assert.equal(result.length, 2);
  assert.equal(result[0].vegetarian, true);
  assert.equal(result[1].vegan, false);
  assert.equal(result[1].sourceUrl, 'https://www.openstreetmap.org/way/11');
  assert.equal(new URL(result[1].directionsUrl).searchParams.get('travelmode'), 'walking');
});
test('real place-only mode works without an OpenAI key and caches duplicate searches', async () => {
  let calls = 0;
  const service = createNearbyService({ env: {}, fetchImpl: async () => { calls++; return json({ elements }); } });
  const [a, b] = await Promise.all([service(input), service(input)]);
  assert.equal(calls, 1);
  assert.equal(a.mode, 'distance');
  assert.equal(a.places.length, 2);
  assert.match(b.message, /not enabled/);
});
test('AI may reorder only known places; data facts remain provider facts', async () => {
  let calls = 0;
  const service = createNearbyService({ env: { OPENAI_API_KEY: 'test-key' }, fetchImpl: async (url, init) => {
    calls++;
    if (url.includes('overpass')) return json({ elements });
    const payload = JSON.parse(init.body);
    assert.equal(payload.store, false);
    assert.equal(payload.text.format.type, 'json_schema');
    assert.equal(payload.text.format.strict, true);
    return aiResponse(['way/11', 'node/10']);
  } });
  const result = await service({ ...input, preferences: 'outdoor seating' });
  assert.equal(calls, 2);
  assert.equal(result.mode, 'ai');
  assert.equal(result.places[0].id, 'way/11');
  assert.equal(result.places[0].outdoorSeating, false);
});
test('hallucinated, duplicate and oversized AI selections are rejected', () => {
  const candidates = normalizePlaces(elements, art, 800);
  for (const placeIds of [['invented/123'], ['node/10', 'node/10'], [], ['node/10', 'way/11', 'bad', 'extra']]) assert.throws(() => validateSelection({ placeIds }, candidates));
});
test('invalid AI output and provider failures fall back honestly to mapped places', async () => {
  for (const fail of ['invented', 'unavailable']) {
    const service = createNearbyService({ env: { OPENAI_API_KEY: 'test-key' }, fetchImpl: async (url) => url.includes('overpass') ? json({ elements }) : fail === 'invented' ? aiResponse(['fake']) : json({}, 429) });
    const result = await service(input);
    assert.equal(result.mode, 'distance');
    assert.equal(result.places[0].id, 'node/10');
    assert.match(result.message, /temporarily unavailable/);
  }
});
test('empty and incomplete map results do not produce fabricated recommendations', async () => {
  const empty = createNearbyService({ env: {}, fetchImpl: async () => json({ elements: [] }) });
  assert.deepEqual((await empty(input)).places, []);
  const incomplete = createNearbyService({ env: {}, fetchImpl: async () => json({ elements, remark: 'runtime error' }) });
  await assert.rejects(incomplete(input), { status: 503 });
});
async function invoke(handler, { method = 'POST', body = JSON.stringify(input), contentType = 'application/json', site = 'same-origin' } = {}) {
  const req = Readable.from([Buffer.from(body)]);
  req.url = '/api/nearby'; req.method = method; req.headers = { 'content-type': contentType, 'sec-fetch-site': site }; req.socket = { remoteAddress: '127.0.0.1' };
  let status, data;
  const res = { headersSent: false, setHeader() {}, writeHead(s) { status = s; this.headersSent = true; }, end(value) { data = JSON.parse(value); } };
  await handler(req, res, () => assert.fail('API request fell through'));
  return { status, data };
}
test('HTTP handler rejects invalid bodies/methods, cross-site requests and rate excess', async () => {
  let calls = 0;
  const handler = createNearbyHandler({ env: {}, fetchImpl: async () => { calls++; return json({ elements }); } });
  assert.equal((await invoke(handler, { method: 'GET' })).status, 405);
  assert.equal((await invoke(handler, { contentType: 'text/plain' })).status, 415);
  assert.equal((await invoke(handler, { site: 'cross-site' })).status, 403);
  assert.equal((await invoke(handler, { body: 'oops' })).status, 400);
  assert.equal((await invoke(handler, { body: 'x'.repeat(5000) })).status, 413);
  for (let i = 0; i < 10; i++) assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler)).status, 429);
  assert.equal(calls, 1);
});

test('uses a fallback map provider after upstream errors, and respects a configured provider', async () => {
  const calls = [];
  const service = createNearbyService({ env: {}, fetchImpl: async (url) => {
    calls.push(url);
    return calls.length === 1 ? json({}, 500) : json({ elements });
  } });
  assert.equal((await service(input)).places.length, 2);
  assert.equal(calls.length, 2);
  const custom = createNearbyService({ env: { OVERPASS_URL: 'https://example.test/map' }, fetchImpl: async (url) => {
    assert.equal(url, 'https://example.test/map'); return json({ elements });
  } });
  assert.equal((await custom(input)).places.length, 2);
});

test('first results return without waiting for AI, even with an AI key configured', async () => {
  let calls = 0;
  const service = createNearbyService({ env: { OPENAI_API_KEY: 'test-key' }, fetchImpl: async (url) => {
    calls++;
    assert.ok(url.includes('overpass'));
    return json({ elements });
  } });
  const result = await service({ ...input, rankWithAI: false });
  assert.equal(result.aiAvailable, true);
  assert.equal(result.mode, 'distance');
  assert.equal(result.places.length, 2);
  assert.equal(calls, 1);
});
test('a stalled first provider cannot block a responsive fallback', async () => {
  let count = 0;
  const service = createNearbyService({ env: {}, fetchImpl: async (_url, init) => {
    if (++count === 1) return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }));
    return json({ elements });
  } });
  const started = Date.now();
  const result = await service(input);
  assert.equal(result.places.length, 2);
  assert.ok(Date.now() - started < 2000, 'Fallback should start without waiting for primary timeout');
});

test('independent Photon fallback restores searches when both Overpass providers fail', async () => {
  for (const [category, key, value] of [['coffee', 'amenity', 'cafe'], ['food', 'amenity', 'restaurant'], ['explore', 'tourism', 'museum']]) {
    let photonCalls = 0;
    const service = createNearbyService({ env: {}, fetchImpl: async (url) => {
      if (url.includes('overpass')) return json({}, 503);
      photonCalls++;
      const params = new URL(url).searchParams;
      assert.equal(params.getAll('include').length, 1);
      assert.ok(params.get('include').split(',').includes(`osm.${key}.${value}`));
      assert.ok(params.has('bbox'));
      const feature = (id, osmValue, lat = art.lat) => ({
        properties: { osm_type: 'W', osm_id: id, name: 'Mapped place', osm_key: key, osm_value: osmValue, housenumber: '10', street: 'Main Street' },
        geometry: { type: 'Point', coordinates: [art.lon, lat] },
      });
      return json({ features: [feature(42, value), feature(43, 'unrelated'), feature(44, value, 0)] });
    } });
    const result = await service({ ...input, category });
    assert.equal(result.places.length, 1);
    assert.equal(result.places[0].id, 'way/42');
    assert.equal(result.places[0].address, '10 Main Street');
    assert.equal(result.places[0].vegetarian, false);
    await service({ ...input, category });
    assert.equal(photonCalls, 1);
  }
});
