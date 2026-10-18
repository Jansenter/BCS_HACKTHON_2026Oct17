"""Import a downloaded City public-art-artists JSON export without rewriting artworks.
Usage: python3 scripts/build-artists.py /path/to/public-art-artists.json
Source: https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-art-artists/exports/json
"""
import html
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parent.parent

def clean(value):
    if not value:
        return None
    text = html.unescape(str(value))
    text = re.sub(r'<br\s*/?>|</p>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', '', text).replace('\r', '')
    return text.strip() or None

def safe_url(value):
    value = clean(value)
    return value if value and value.startswith(('https://', 'http://')) else None

ids = {str(i) for filename in ['artworks.json', 'city-artworks.json']
       for art in json.loads((root / 'src/data' / filename).read_text()) for i in art['artistIds']}
profiles = []
for artist in json.loads(Path(sys.argv[1]).read_text()):
    if str(artist['artistid']) not in ids:
        continue
    profiles.append({
        'id': str(artist['artistid']),
        'name': ' '.join(filter(None, [clean(artist['firstname']), clean(artist['lastname'])])),
        'biography': clean(artist['biography']),
        'country': clean(artist['country']),
        'website': safe_url(artist['website']),
        'source': safe_url(artist['artisturl']),
    })
profiles.sort(key=lambda artist: int(artist['id']))
(root / 'src/data/artists.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {len(profiles)} artist profiles; {sum(bool(a["biography"]) for a in profiles)} biographies.')
