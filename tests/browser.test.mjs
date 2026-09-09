// Browser regressions for the Paper → Tailwind v4 skill.
//
// Every assertion here runs against the pinned Chromium and pinned Tailwind
// compiler, with all external requests blocked. A number that depends on this
// environment (a raster pixel count, a font width) is asserted by direction,
// never by a historical constant.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { computed, fixture, withBrowser } from './support/browser.mjs';
import { replaceGenerated } from './support/region.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const TEMPLATE = path.join(root, 'skills/paper-tailwind-tokens/assets/paper-tokens.css');

const template = () => readFile(TEMPLATE, 'utf8');

/** `#RRGGBB` → the `rgb(r, g, b)` string a computed style reports. */
function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

// ── V1 — record what actually resolved ───────────────────────────────────────

test('records the resolved toolchain in the test output', async t => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const pinned = manifest.devDependencies;

  const version = await withBrowser({}, async ({ browserVersion }) => browserVersion);

  t.diagnostic(`node ${process.version} · ${process.platform}/${process.arch}`);
  t.diagnostic(`chromium ${version} (playwright ${pinned.playwright})`);
  t.diagnostic(`tailwind ${pinned['@tailwindcss/browser']} browser / ${pinned['@tailwindcss/cli']} cli`);
  t.diagnostic(`fonts: caprasimo ${pinned['@fontsource/caprasimo']}, syne ${pinned['@fontsource/syne']}, meow-script ${pinned['@fontsource/meow-script']}`);

  // Pins are exact on purpose: a caret here turns a raster comparison into a
  // flake the next time a dependency ships.
  for (const [name, range] of Object.entries(pinned)) {
    assert.match(range, /^\d+\.\d+\.\d+$/, `${name} must be pinned to an exact version`);
  }
});

// ── C6 / V3.1 — ownership survives regeneration ──────────────────────────────

test('shipped template compiles: owned regions win over the generated region', async () => {
  const pages = new Map([['t', fixture({
    theme: await template(),
    body: `<div id="sm" class="sm:hidden">sm</div>
           <div id="md" class="md:hidden">md</div>
           <div id="type" class="font-display text-lg">Display</div>
           <div id="box" class="p-13 shadow-raised bg-surface text-content">box</div>`,
  })]]);

  await withBrowser({ pages, viewport: 1000 }, async ({ page, open, pageErrors }) => {
    await open('/dynamic/t');
    assert.deepEqual(pageErrors, []);

    // Region 3 fallback stack replaced the bare family name from the export.
    const family = await computed(page, '#type', 'font-family');
    assert.match(family, /^Caprasimo, ui-serif, Georgia, serif$/);

    // Paired modifiers exist only in the owned region: 28 × 1.2 and 28 × -0.01em.
    assert.equal(await computed(page, '#type', 'font-size'), '28px');
    assert.equal(await computed(page, '#type', 'line-height'), '33.6px');
    assert.equal(await computed(page, '#type', 'letter-spacing'), '-0.28px');

    // Derived spacing base, not an enumerated step: 13 × 4px.
    assert.equal(await computed(page, '#box', 'padding-top'), '52px');
    assert.match(await computed(page, '#box', 'box-shadow'), /rgba\(36, 19, 10, 0\.06\)/);

    // Semantic colors resolve through the palette region.
    assert.equal(await computed(page, '#box', 'background-color'), rgb('#F5E9DB'));
    assert.equal(await computed(page, '#box', 'color'), rgb('#24130A'));

    // The namespace reset declared *after* the generated region removed the
    // default scale: `sm` no longer generates, `md` still does.
    assert.equal(await computed(page, '#sm', 'display'), 'block', 'sm: should not exist after the reset');
    assert.equal(await computed(page, '#md', 'display'), 'none', 'md: is declared and must apply at 1000px');
  });
});

test('two consecutive regenerations preserve application-owned declarations', async () => {
  const original = await template();

  const exportV2 = `@theme inline {
  --color-surface: var(--palette-ground);
  --color-content: var(--palette-ink);
  --font-display: "Caprasimo";
  --text-lg: 32px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1200px;
  --radius-button: 15px;
}`;
  const exportV3 = exportV2.replace('--text-lg: 32px;', '--text-lg: 44px;\n  --color-alert: #C75759;');

  const v2 = replaceGenerated(original, exportV2, 'contentHash.tokens: aaaa1111');
  const v3 = replaceGenerated(v2, exportV3, 'contentHash.tokens: bbbb2222');

  // The second replacement operates on the already-regenerated file, which is
  // the case that loses hand edits when the whole file is overwritten.
  const pages = new Map([
    ['v2', fixture({ theme: v2, body: '<div id="type" class="font-display text-lg">A</div>' })],
    ['v3', fixture({ theme: v3, body: '<div id="type" class="font-display text-lg">A</div><div id="alert" class="bg-alert">B</div>' })],
  ]);

  await withBrowser({ pages, viewport: 1000 }, async ({ page, open }) => {
    await open('/dynamic/v2');
    assert.equal(await computed(page, '#type', 'font-size'), '32px', 'new export value must render');
    assert.match(await computed(page, '#type', 'font-family'), /ui-serif/, 'owned fallback stack must survive');
    assert.equal(await computed(page, '#type', 'line-height'), '38.4px', 'owned pair must survive (32 × 1.2)');

    await open('/dynamic/v3');
    assert.equal(await computed(page, '#type', 'font-size'), '44px');
    assert.equal(await computed(page, '#alert', 'background-color'), rgb('#C75759'), 'token added by the export');
    assert.match(await computed(page, '#type', 'font-family'), /ui-serif/, 'owned fallback stack survives twice');
    assert.equal(await computed(page, '#type', 'line-height'), '52.8px', 'owned pair survives twice (44 × 1.2)');
  });

  // The installed skill asset is a template, never an export target.
  assert.equal(await template(), original, 'regeneration must not touch the installed asset');
});

// ── V1.2 — the harness fails loudly ──────────────────────────────────────────

test('an external request is blocked rather than silently substituted', async () => {
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    </head><body><div id="probe" class="p-4">probe</div></body></html>`;
  const pages = new Map([['cdn', html]]);

  await withBrowser({ pages }, async ({ page, origin, blocked }) => {
    await page.goto(`${origin}/dynamic/cdn`, { waitUntil: 'load' });
    assert.ok(blocked.some(url => url.includes('cdn.jsdelivr.net')), 'the CDN request must be recorded as blocked');
    // No compiler reached the page, so no utility was generated.
    assert.equal(await computed(page, '#probe', 'padding-top'), '0px');
  });
});

test('a missing local resource fails the readiness wait instead of passing', async () => {
  const pages = new Map([['broken', fixture({ theme: '' }).replace('/vendor/tailwind.js', '/vendor/absent.js')]]);

  await assert.rejects(
    withBrowser({ pages, readyTimeout: 2_000 }, async ({ open }) => { await open(`/dynamic/broken`); }),
    /Timeout|timeout/,
    'a 404 on the pinned compiler must surface as a failure',
  );
});
