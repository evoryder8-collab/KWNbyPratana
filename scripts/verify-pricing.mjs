import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { services, travelZones } from '../src/data/site.js';

// Client-confirmed treatment prices, before travel. Keep these independent
// of the renderer so a mistaken interpretation cannot silently change totals.
const expected = {
  'kwiin-massage': [[60,165],[90,340],[120,400]],
  'sleeping-kwiin': [[60,190],[90,275],[120,360]],
  'booster-muscles-sport': [[60,155],[90,290],[120,380]],
  'flow-essence-lymph': [[60,150],[90,280],[120,370]],
  'slim-essence': [[60,280],[90,410],[120,540]],
  'back-serenity': [[60,140],[90,270],[120,350]],
  'crown-serenity-head': [[30,85],[60,140],[90,195]],
  'bata-flow-foot': [[30,85],[60,140],[90,195]],
};
assert.deepEqual(services.map(s => s.id), Object.keys(expected));
assert.deepEqual(travelZones, [{distance:15,fee:45},{distance:30,fee:100}]);
for (const service of services) {
  assert.deepEqual(service.durations.map(d => [d.minutes,d.price]), expected[service.id], service.id);
  assert.deepEqual(service.addonMinutes ?? [], ['crown-serenity-head','bata-flow-foot'].includes(service.id) ? [30] : []);
}
for (const route of ['services','mobile-spa']) {
  const html = await readFile(new URL(`../dist/${route}/index.html`, import.meta.url), 'utf8');
  for (const [id, prices] of Object.entries(expected)) {
    const card = html.match(new RegExp(`<article[^>]*data-service-id="${id}"[\\s\\S]*?</article>`))?.[0];
    assert.ok(card, `Missing ${id}`);
    for (const [minutes, base] of prices) {
      const addon = minutes === 30;
      const row = card.match(new RegExp(`<li data-price-row data-minutes="${minutes}"[\\s\\S]*?</li>`))?.[0];
      assert.ok(row?.includes(`data-base-price="${base}"`), `${id} ${minutes} base price`);
      assert.ok(row.includes(`data-price-value>${base + (addon ? 0 : 45)}</strong>`), `${id} ${minutes} initial total`);
      assert.equal(row.includes('data-addon="true"'), addon);
      assert.ok(row.includes(`data-i18n="pricing.${addon ? 'addon' : 'breakdown'}"`));
    }
  }
  const schema = JSON.parse(html.match(/<script id="kwiin-structured-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const serialized = JSON.stringify(schema);
  assert.ok(!serialized.includes('30 min'), 'Add-ons must not be advertised as standalone offers');
  if (route === 'services') {
    assert.ok(serialized.includes('"price":"385"'), 'Schema must include the confirmed KWIIN 90-min 15-km total');
    assert.ok(serialized.includes('"price":"440"'), 'Schema must include the KWIIN 90-min 30-km total');
  }
}
console.log('Verified 8 treatments, 24 duration prices, both travel fees, add-on rules, and structured offers.');
