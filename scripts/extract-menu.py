"""Extract factual dish names, portions and prices from the source restaurant menu.

Descriptions are deliberately not reproduced. The downloaded reference HTML
and text are kept outside the deployed application.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
lines = json.loads((ROOT / 'reference/menu-text.json').read_text(encoding='utf-8'))
html = (ROOT / 'reference/menu.html').read_text(encoding='utf-8')
categories = re.findall(r'<h[234][^>]*>(.*?)</h[234]>', html)
categories = categories[1:categories.index('SHOTS') + 1]
labels = {'MO: MO':'Mo:mo', 'NON-VEG CURRY':'Meat curries', 'VEG-CURRY':'Vegetable curries',
          'PRAWN CURRY':'Prawn curries', 'Extras and SIDE SAUCE':'Sides & sauces', 'STARTER':'Starters',
          'LIQUORS 40ML':'Spirits', 'THALI SET':'Thali sets', 'COMBO SET':'Combo sets'}
items, category, block, previous = [], None, [], ''
for line in lines:
    if line == 'Opening Hours': break
    if line in categories:
        category, block, previous = line, [], ''
        continue
    if not category: continue
    price = re.fullmatch(r'(\d+(?:[.,]\d+)?)\s*RON', line)
    if not price:
        block.append(line)
        continue
    if category == 'HOOKAH':
        block = []
        continue
    name = block[0]
    portion = ''
    if re.fullmatch(r'\(?\d+\s*(?:ML|G)\)?', name, re.I) or name.startswith('BY ') or name in ['Small', 'Large']:
        portion, name = name, previous
    else:
        match = re.search(r'\s*\(?(\d+\s*(?:ML|G))\)?$', name, re.I)
        if match:
            portion, name = match[1], name[:match.start()].strip()
        elif len(block)>1 and (re.fullmatch(r'\(?\d+\s*(?:ML|G)\)?', block[1], re.I) or block[1].startswith('BY ')):
            portion = block[1]
        elif len(block)>1 and block[1] in ['Small', 'Large']:
            portion = block[1]
        elif category == 'LIQUORS 40ML':
            portion = '40ML'
        previous = name
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    items.append({'id':f'{slug}-{len(items)+1}', 'name':name.title().replace('Mo:Mo','Mo:mo'),
                  'category':labels.get(category, category.title()), 'portion':portion.lower().replace('by glass','glass').replace('by bottle','bottle').replace('(', '').replace(')', ''),
                  'price':float(price[1].replace(',','.'))})
    block = []

assert len(items) > 140
assert len({i['id'] for i in items}) == len(items)
assert all(i['price'] > 0 and i['name'] for i in items)
output = ROOT / 'app/data/menu.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Extracted {len(items)} food and drink entries, {len(set(i["category"] for i in items))} categories.')
