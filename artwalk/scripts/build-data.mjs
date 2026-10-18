// Turns the raw City of Vancouver Public Art Registry export (data/public-art.json)
// into a small, clean JSON file the app loads (src/data/artworks.json).
//
// Usage:  npm run data
//
// Scope for the hackathon MVP: artworks in the "Downtown" local area that are
// currently "In place" and have coordinates. Change NEIGHBOURHOOD to try another area.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CITY = process.argv.includes('--city');
const NEIGHBOURHOOD = CITY ? null : 'Downtown';

// The open-data export only carries artist IDs. These names are taken from text
// that appears inside the registry records themselves (descriptions / statements /
// credits), so every name is traceable to the source data. Add more as you verify them
// (e.g. from the companion "public-art-artists" dataset on opendata.vancouver.ca).
const ARTIST_NAMES = {
  '3': 'Ken Lum', //            records 414, 506, 624
  '41': 'Gerhard Class', //     record 297 ("created by Gerhard Class")
  '76': 'Paul Huba', //         records 41, 42
  '77': 'Alan Chung Hung', //   records 110, 113
  '79': 'Elek Imredy', //       record 97
  '95': 'Liz Magor', //         record 404
  '98': 'Charles Marega', //    records 1, 45, 87, 101, 103
  '122': 'Bill Reid', //        records 93, 391
  '140': 'Alan Storey', //      records 144, 340
  '168': 'Debra Sparrow', //    records 221, 915
  '226': 'Gathie Falk', //      records 288, 826-828
  '241': 'Jack Harman', //      record 332 (horse "by the late Jack Harman", record 40)
  '267': 'Joe Fafard', //       records 40, 332
  '300': 'Susan Point', //      record 626
  '316': 'Rodney Graham', //    records 430, 445, 823
  '344': 'Paul Wong', //        records 786, 833, 905
  '382': 'Cameron Kerr', //     records 528, 541, 737
  '389': 'Rhonda Weppler', //   record 614
  '391': 'Douglas Coupland', // record 526
  '395': 'Germaine Koh', //     records 531, 798, 804
  '508': 'Trevor Mahovsky', //  record 614
  '591': 'Brady Cranfield', //  record 865
  '642': 'Jag Nagra', //        records 843, 926
  '538': 'Lees + Associates', //record 559 ("designed by Lees + Associates")
  '72': 'G.L. Thornton Sharp', //record 61 ("designed by Major G.L. Thornton Sharp")
  '530': 'Babak Golkar', //     record 755 (credit "Studio Babak Golkar")
};

const ENTITIES = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…',
  eacute: 'é', egrave: 'è', aacute: 'á', agrave: 'à', uacute: 'ú', iacute: 'í', oacute: 'ó',
  icirc: 'î', acirc: 'â', ecirc: 'ê', ocirc: 'ô', ccedil: 'ç', ouml: 'ö', uuml: 'ü',
  auml: 'ä', scaron: 'š', theta: 'θ', ntilde: 'ñ',
};

function clean(text) {
  if (!text) return null;
  let t = String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\\t/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.length ? t : null;
}

const raw = JSON.parse(readFileSync(join(root, 'data/public-art.json'), 'utf8'));

const artworks = raw
  .filter((r) => r.status === 'In place' && r.geo_point_2d && Number.isFinite(r.geo_point_2d.lat) && Number.isFinite(r.geo_point_2d.lon) && (!NEIGHBOURHOOD || r.geo_local_area === NEIGHBOURHOOD))
  .map((r) => {
    const ids = r.artists ?? [];
    return {
      id: r.registryid,
      // Registry export has a damaged character; confirmed by artwork #808's statement and City registry.
      title: r.registryid === 808 ? '聚 Gathering' : clean(r.title_of_work) ?? 'Untitled',
      type: r.type ?? 'Artwork',
      year: r.yearofinstallation ? Number(r.yearofinstallation) : null,
      material: clean(r.primarymaterial),
      site: clean(r.sitename),
      address: clean(r.siteaddress),
      locationOnSite: clean(r.locationonsite),
      lat: r.geo_point_2d.lat,
      lon: r.geo_point_2d.lon,
      description: clean(r.descriptionofwork),
      statement: clean(r.artistprojectstatement),
      artistIds: ids,
      artists: ids.map((id) => ARTIST_NAMES[id]).filter(Boolean),
      ownership: clean(r.ownership),
      photoCredit: clean(r.photocredits),
      url: r.url,
    };
  })
  .sort((a, b) => a.id - b.id);

writeFileSync(join(root, CITY ? 'src/data/city-artworks.json' : 'src/data/artworks.json'), JSON.stringify(artworks, null, 1));

const named = artworks.filter((a) => a.artists.length).length;
console.log(`✔ ${artworks.length} artworks → ${CITY ? 'city-artworks.json' : 'artworks.json'} (${named} with artist names)`);
