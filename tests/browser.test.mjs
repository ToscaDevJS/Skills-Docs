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

import { computed, fixture, textWidth, withBrowser } from './support/browser.mjs';
import { replaceGenerated } from './support/region.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const TEMPLATE = path.join(root, 'skills/paper-tailwind-tokens/assets/paper-tokens.css');

const template = () => readFile(TEMPLATE, 'utf8');

/** `#RRGGBB` → the `rgb(r, g, b)` string a computed style reports. */
function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** Pull `--name: value;` declarations out of a stylesheet's @theme block. */
function declared(css, prefix) {
  const pattern = new RegExp(`--${prefix}-([\\w-]+):\\s*([^;]+);`, 'g');
  return new Map([...css.matchAll(pattern)].map(m => [m[1], m[2].trim()]));
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

// ── C5 / V3.1 — safe migration ───────────────────────────────────────────────

test('rename: the naive protocol breaks, the corrected one preserves the value', async () => {
  const naive = `@theme inline {
  --color-old: #B45844;
  --color-new: var(--color-old);
}`;
  const naiveAfterDelete = `@theme inline {
  --color-new: var(--color-old);
}`;
  const correctedAfterDelete = `@theme inline {
  --color-new: #B45844;
}`;

  const body = '<div id="probe" class="text-new">migrated</div>';
  const pages = new Map([
    ['before', fixture({ theme: naive, body })],
    ['naive', fixture({ theme: naiveAfterDelete, body })],
    ['corrected', fixture({ theme: correctedAfterDelete, body })],
  ]);

  await withBrowser({ pages }, async ({ page, open }) => {
    await open('/dynamic/before');
    assert.equal(await computed(page, '#probe', 'color'), rgb('#B45844'), 'both names resolve mid-migration');

    // Control: `--new: var(--old)` then deleting `--old` leaves a dangling
    // reference. The custom property resolves to nothing and the element falls
    // back to inherited ink — silently.
    await open('/dynamic/naive');
    assert.notEqual(await computed(page, '#probe', 'color'), rgb('#B45844'),
      'deleting the aliased-from token must be observably broken');

    // Corrected: the new token holds the canonical value, so removing the
    // compatibility alias changes nothing.
    await open('/dynamic/corrected');
    assert.equal(await computed(page, '#probe', 'color'), rgb('#B45844'),
      'canonical value must survive alias removal');
  });
});

// ── C7 / V3.2 — theming scope ────────────────────────────────────────────────

test('@theme inline resolves nested overrides; plain @theme does not', async () => {
  const theme = `@theme {
  --color-plain: var(--palette-brand);
}
@theme inline {
  --color-inline: var(--palette-brand);
}`;
  const head = `<style>
  :root { --palette-brand: #ffffff; }
  #panel { --palette-brand: #000000; }
</style>`;
  const body = `<div id="panel">
     <span id="plain" class="text-plain">plain</span>
     <span id="inline" class="text-inline">inline</span>
   </div>`;

  const pages = new Map([['t', fixture({ theme, head, body })]]);
  await withBrowser({ pages }, async ({ page, open }) => {
    await open('/dynamic/t');
    assert.equal(await computed(page, '#plain', 'color'), rgb('#ffffff'),
      'plain @theme resolved at :root and ignores the nested scope');
    assert.equal(await computed(page, '#inline', 'color'), rgb('#000000'),
      '@theme inline substitutes the var and picks up the nested value');
  });
});

// ── C4 / V3.2 — leading units ────────────────────────────────────────────────

test('F-01: the fixture parent is 16px, and only unitless leading recomputes', async () => {
  await withBrowser({ viewport: 1000 }, async ({ page, open }) => {
    await open('/f01-leading-inheritance.html');

    // Assert the precondition before the finding: the original fixture claimed
    // 18px while rendering 16px, which made 19.2px look like the wrong number.
    assert.equal(await computed(page, '#a', 'font-size'), '16px');
    assert.equal(await computed(page, '#b', 'font-size'), '16px');

    assert.equal(await computed(page, '#a-child', 'font-size'), '40px');
    assert.equal(await computed(page, '#a-child', 'line-height'), '19.2px', '120% inherits 16 × 1.2 as px');
    assert.equal(await computed(page, '#b-child', 'line-height'), '48px', '1.2 recomputes against 40px');
  });
});

test('leading unit matrix: %, em and px inherit a computed px; a dangling alias is unresolved', async () => {
  const theme = `@theme {
  --leading-ratio: 1.2;
  --leading-percent: 120%;
  --leading-em: 1.2em;
  --leading-px: 24px;
  --leading-dangling: var(--leading-missing);
}`;
  const cell = key => `<div id="${key}" class="text-[16px] leading-${key}">
      <span id="${key}-child" class="text-[40px]">child</span></div>`;
  const body = ['ratio', 'percent', 'em', 'px', 'dangling'].map(cell).join('');

  const pages = new Map([['t', fixture({ theme, body })]]);
  await withBrowser({ pages }, async ({ page, open }) => {
    await open('/dynamic/t');

    // Only the ratio survives the 16px → 40px boundary.
    assert.equal(await computed(page, '#ratio-child', 'line-height'), '48px');

    // The other three all collapse to a fixed px value computed at the parent.
    assert.equal(await computed(page, '#percent-child', 'line-height'), '19.2px');
    assert.equal(await computed(page, '#em-child', 'line-height'), '19.2px', '1.2em resolves against the 16px parent');
    assert.equal(await computed(page, '#px-child', 'line-height'), '24px');

    // A leading token pointing at a token that does not exist produces no
    // declaration at all — the child falls back to `normal`, not to a ratio.
    const dangling = await computed(page, '#dangling-child', 'line-height');
    assert.notEqual(dangling, '48px');
    assert.notEqual(dangling, '19.2px');
  });
});

// ── C7 / V3.1 — paired typography ────────────────────────────────────────────

test('paired modifiers apply together and em tracking scales with font size', async () => {
  const theme = `@theme {
  --text-sm: 10px;
  --text-huge: 100px;
  --text-huge--line-height: 1.1;
  --text-huge--letter-spacing: 0.213em;
  --tracking-wide: 0.1em;
}`;
  const body = `<span id="huge" class="text-huge">x</span>
                <span id="small" class="text-sm tracking-wide">x</span>
                <span id="big" class="text-huge tracking-wide">x</span>`;

  const pages = new Map([['t', fixture({ theme, body })]]);
  await withBrowser({ pages }, async ({ page, open }) => {
    await open('/dynamic/t');
    assert.equal(await computed(page, '#huge', 'font-size'), '100px');
    assert.equal(await computed(page, '#huge', 'line-height'), '110px', 'paired leading applied');
    assert.equal(await computed(page, '#huge', 'letter-spacing'), '21.3px', 'paired tracking applied');

    // The same em token resolves to different px at different sizes — which is
    // exactly why a bare number coerced to px is wrong.
    assert.equal(await computed(page, '#small', 'letter-spacing'), '1px');
    assert.equal(await computed(page, '#big', 'letter-spacing'), '10px');
  });
});

// ── C3 / V3.2 — responsive boundaries ────────────────────────────────────────

test('viewport breakpoints switch exactly at min-width, container queries at slot width', async () => {
  const theme = `@theme {
  --breakpoint-*: initial;
  --breakpoint-md: 768px;
  --container-canvas: 1200px;
  --color-hit: #C75759;
}`;
  const body = `<div id="viewport" class="md:bg-hit">viewport</div>
                <div class="@container" style="width:1200px"><div id="wide" class="@canvas:bg-hit">wide</div></div>
                <div class="@container" style="width:1199px"><div id="narrow" class="@canvas:bg-hit">narrow</div></div>`;
  const pages = new Map([['t', fixture({ theme, body, width: 1400 })]]);

  const transparent = 'rgba(0, 0, 0, 0)';

  await withBrowser({ pages, viewport: 768 }, async ({ page, open }) => {
    await open('/dynamic/t');
    assert.equal(await computed(page, '#viewport', 'background-color'), rgb('#C75759'), 'md applies AT 768px');

    // Same page, one pixel narrower: min-width is inclusive, so 767 is out.
    await page.setViewportSize({ width: 767, height: 900 });
    assert.equal(await computed(page, '#viewport', 'background-color'), transparent, 'md must not apply at 767px');

    // Container queries ignore the viewport entirely: both slots are measured
    // at the same 767px viewport and disagree with each other.
    assert.equal(await computed(page, '#wide', 'background-color'), rgb('#C75759'), '@canvas applies at a 1200px slot');
    assert.equal(await computed(page, '#narrow', 'background-color'), transparent, '@canvas must not apply at 1199px');
  });
});

test('one --container-* token serves both max-width and the container threshold', async () => {
  // T1. The boundary test above declares its own thresholds and only ever uses
  // the @canvas: variant. This asserts the *double duty* on a real Radiant
  // Thread token: the same --container-canvas answers a width utility and a
  // container query, which is the claim that made the token worth keeping.
  await withBrowser({ viewport: 1300 }, async ({ page, open }) => {
    await open('/unverified-claims.html');

    assert.equal(await computed(page, '#t1-size', 'max-width'), '1200px',
      'max-w-canvas must resolve from the same token');

    // Both slots are measured at one viewport, so the viewport cannot explain
    // the difference between them.
    assert.equal(await computed(page, '#t1-wide-child', 'background-color'), rgb('#C75759'),
      '@canvas applies in a 1400px slot');
    assert.equal(await computed(page, '#t1-narrow-child', 'background-color'), 'rgba(0, 0, 0, 0)',
      '@canvas must not apply in an 800px slot at the same viewport');
  });
});

test('a custom breakpoint moves one step and leaves the default scale standing', async () => {
  // T3. The boundary test covers the *reset* case, where --breakpoint-*: initial
  // clears the defaults. This is the opposite case: declaring --breakpoint-lg
  // without a reset, which keeps every default and relocates one of them.
  const active = async (page, step) =>
    (await computed(page, `#t3-${step}`, 'background-color')) !== 'rgba(0, 0, 0, 0)';

  await withBrowser({ viewport: 1300 }, async ({ page, open }) => {
    await open('/unverified-claims.html');

    // 1300px: every default below it fires, and 2xl (1536) does not — so the
    // defaults were never cleared.
    assert.equal(await active(page, 'sm'), true, 'sm (640) is still the default');
    assert.equal(await active(page, 'md'), true, 'md (768) is still the default');
    assert.equal(await active(page, 'xl'), true, 'xl (1280) is still the default');
    assert.equal(await active(page, '2xl'), false, '2xl (1536) is still the default');
    assert.equal(await active(page, 'lg'), true, 'the redeclared lg fires above 1200');

    // 1100px is the discriminating width: the default lg is 1024, so a default
    // lg would fire here. It does not, which is how we know the token moved it
    // to 1200 rather than adding a new step beside it.
    await page.setViewportSize({ width: 1100, height: 900 });
    assert.equal(await active(page, 'lg'), false, 'lg moved from 1024 to 1200');
    assert.equal(await active(page, 'md'), true, 'md is unaffected by the move');
    assert.equal(await active(page, 'xl'), false, 'xl (1280) is unaffected by the move');

    // The deformation the finding names: md → lg now spans 432px while
    // lg → xl spans 80px. The scale still works; it is no longer even.
  });
});

// ── V3.1 — sweeps driven by the fixtures' own declarations ───────────────────

test('token sweep: every declared color and font size renders its declared value', async () => {
  const sweep = await readFile(path.join(root, 'tests/token-sweep.html'), 'utf8');
  const colors = declared(sweep, 'color');
  const sizes = declared(sweep, 'text');
  assert.ok(colors.size >= 9 && sizes.size >= 12, 'the fixture must still declare the full scales');

  await withBrowser({ viewport: 1000 }, async ({ page, open }) => {
    await open('/token-sweep.html');

    for (const [name, hex] of colors) {
      assert.equal(await computed(page, `[data-t="${name}"]`, 'background-color'), rgb(hex), `color ${name}`);
    }
    for (const [name, size] of sizes) {
      assert.equal(await computed(page, `[data-t="${name}"]`, 'font-size'), size, `size ${name}`);
    }

    // A custom radius token coexists with the untouched default scale.
    assert.equal(await computed(page, '#c5-button', 'border-radius'), '15px');
    assert.equal(await computed(page, '#c5-sm', 'border-radius'), '4px');
    assert.equal(await computed(page, '#c5-lg', 'border-radius'), '8px');
    assert.equal(await computed(page, '#c5-2xl', 'border-radius'), '16px');

    // `0em` tracking is `normal`, not `0px` — the distinction the C4 finding made.
    assert.equal(await computed(page, '#c4-n-100', 'letter-spacing'), 'normal');
    assert.equal(await computed(page, '#c4-w-10', 'letter-spacing'), '2.13px');
    assert.equal(await computed(page, '#c4-w-100', 'letter-spacing'), '21.3px');

    // The second tracking token, so the em-is-relative rule is shown on more
    // than one value: 0.1em is 1px at 10px and 10px at 100px.
    assert.equal(await computed(page, '#c4-d-10', 'letter-spacing'), '1px');
    assert.equal(await computed(page, '#c4-d-100', 'letter-spacing'), '10px');

    // An opacity modifier changes the colour space, not just the alpha.
    // `bg-rust` serialises as rgb(); `bg-rust/50` comes back as oklab, because
    // v4 interpolates there. Code comparing against rgba() never matches.
    const solid = await computed(page, '[data-t="rust"]', 'background-color');
    const alpha = await computed(page, '#c1-alpha', 'background-color');
    assert.match(solid, /^rgb\(/, 'the solid token serialises as rgb()');
    assert.match(alpha, /^oklab\(/, 'the /50 modifier switches to oklab');
    assert.match(alpha, /\/ 0\.5\)$/, 'the requested alpha survives the conversion');

    // `rounded-full` is calc(infinity * 1px), which this engine resolves to
    // 2^25 px. Asserted as a magnitude: the exact figure is an engine detail,
    // but any parser expecting a sane radius has to cope with it.
    const full = Number.parseFloat(await computed(page, '#c5-full', 'border-radius'));
    assert.ok(full > 1e6, `rounded-full must resolve to an effectively infinite radius, got ${full}`);
  });
});

test('spacing: the derived scale answers steps no token declares', async () => {
  await withBrowser({ viewport: 1000 }, async ({ page, open }) => {
    await open('/unverified-claims.html');
    assert.equal(await computed(page, '#t2-p4', 'padding-top'), '16px', 'declared step');
    assert.equal(await computed(page, '#t2-p5', 'padding-top'), '20px', 'undeclared step still resolves');
    assert.equal(await computed(page, '#t2-p13', 'padding-top'), '52px');
    assert.equal(await computed(page, '#t2-gap', 'gap'), '28px');
  });
});

test('round-trip CTA renders the exported geometry', async () => {
  await withBrowser({ viewport: 1200 }, async ({ page, open }) => {
    await open('/roundtrip-final-cta.html');
    const headline = await page.$eval('body > div', el => {
      const style = getComputedStyle(el.children[1]);
      return {
        height: el.getBoundingClientRect().height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      };
    });
    assert.equal(headline.fontSize, '70px');
    assert.equal(headline.lineHeight, '63px');
    // Height depends on the loaded faces; assert the band, not a historical decimal.
    assert.ok(headline.height > 480 && headline.height < 520, `unexpected section height ${headline.height}`);
  });
});

// ── V4 — font evidence ───────────────────────────────────────────────────────

test('font weight: the tokens resolve, and a real face is not a synthesised one', async () => {
  await withBrowser({ viewport: 1000 }, async ({ page, open }) => {
    await open('/unverified-claims.html');

    // The --font-weight-* namespace had no assertion at all until now, which is
    // how the T4 saga stayed unnoticed: the synthesis test never confirmed that
    // `font-semibold` had resolved to 600 in the first place.
    assert.equal(await computed(page, '#t4-reg', 'font-weight'), '400');
    assert.equal(await computed(page, '#t4-semi', 'font-weight'), '600');
    assert.equal(await computed(page, '#t4-body-semi', 'font-weight'), '600');

    // The trap in one line: the computed style reports the author's intent even
    // when synthesis is switched off and nothing can honour it.
    assert.equal(await computed(page, '#t4-semi-nosyn', 'font-weight'), '600');

    // Caprasimo ships one face, Syne ships 400 and 600. Both elements above
    // report 600; only one of them has a face to render it.
    const faces = await page.evaluate(() =>
      [...document.fonts].map(f => `${f.family.replaceAll('"', '')}@${f.weight}`));
    assert.ok(faces.includes('Syne@600'), 'the pinned Syne 600 face must be loaded');
    assert.ok(!faces.includes('Caprasimo@600'), 'Caprasimo must ship no 600 face');

    // Positive control the synthesis test lacks. Toggling synthesis on the
    // element backed by a real 600 face changes nothing, because there is
    // nothing to synthesise — which is what makes the Caprasimo difference
    // attributable to synthesis rather than to the toggle itself.
    const real = await page.$('#t4-body-semi');
    await real.evaluate(el => { el.style.fontSynthesis = 'weight'; });
    const realOn = await real.screenshot();
    await real.evaluate(el => { el.style.fontSynthesis = 'none'; });
    const realOff = await real.screenshot();
    assert.ok(realOn.equals(realOff), 'a real 600 face must render identically with synthesis off');
  });
});

test('font synthesis changes the raster of the same element, though widths match', async () => {
  await withBrowser({ viewport: 1000 }, async ({ page, open, browserVersion }) => {
    await open('/token-sweep.html');

    const target = await page.$('#c3-display');
    await target.evaluate(el => { el.classList.add('font-semibold'); el.style.fontSynthesis = 'weight'; });
    const withSynthesis = await target.screenshot();
    const control = await target.screenshot();

    await target.evaluate(el => { el.style.fontSynthesis = 'none'; });
    const withoutSynthesis = await target.screenshot();

    // Two shots of an unchanged element are identical: the harness is stable.
    assert.ok(control.equals(withSynthesis), 'the same element must screenshot identically twice');

    // Caprasimo ships only weight 400. Requesting 600 does not change the
    // advance width — and the original T4 conclusion stopped there. It does
    // change the pixels, so the "silent no-op" reading was wrong.
    assert.ok(!withoutSynthesis.equals(withSynthesis),
      `synthesis toggle must change rasterisation (browser ${browserVersion})`);

    const widthOn = await textWidth(page, '#c3-display');
    await target.evaluate(el => { el.style.fontSynthesis = 'weight'; });
    const widthOff = await textWidth(page, '#c3-display');
    assert.equal(widthOn, widthOff, 'equal widths are exactly why width alone proves nothing');
  });
});

test('missing family: the declaration survives, fonts.check lies, loaded faces do not', async () => {
  await withBrowser({ viewport: 1000 }, async ({ page, open }) => {
    await open('/token-sweep.html');

    const declaredFamily = await computed(page, '#c3-missing', 'font-family');
    assert.match(declaredFamily, /NotARealTypeface/, 'the declaration survives; nothing reports the failure');

    // Documented API behaviour, not a bug: check() returns true for a family
    // that does not exist. It cannot be used as a resolution assertion.
    const lies = await page.evaluate(() => document.fonts.check('16px NotARealTypeface'));
    assert.equal(lies, true, 'document.fonts.check() must be treated as unreliable');

    // What is load-bearing: the loaded face set.
    const loaded = await page.evaluate(() =>
      [...document.fonts].map(face => face.family.replaceAll('"', '')));
    assert.ok(loaded.includes('Caprasimo'), 'the pinned face really loaded');
    assert.ok(!loaded.includes('NotARealTypeface'), 'the missing family is absent from the face set');

    // Fallback is a separate fact from the declared family, reported separately.
    const missingWidth = await textWidth(page, '#c3-missing');
    const controlWidth = await textWidth(page, '#c3-control');
    assert.notEqual(missingWidth, controlWidth,
      'the browser default is not the system-ui control either');

    // All three declared families, not just the display one. Each must resolve
    // to its own face: four distinct widths for the same string means nothing
    // collapsed to a shared fallback. This is the cheap smoke test — it catches
    // a font that stopped loading, and it proves nothing about face identity.
    assert.equal(await computed(page, '#c3-body', 'font-family'), 'Syne');
    assert.match(await computed(page, '#c3-accent', 'font-family'), /Meow Script/);

    const widths = [
      await textWidth(page, '#c3-display'),
      await textWidth(page, '#c3-body'),
      await textWidth(page, '#c3-accent'),
      controlWidth,
    ];
    assert.equal(new Set(widths).size, widths.length,
      `all four renderings must differ, got ${widths.join(', ')}`);

    for (const family of ['Syne', 'Meow Script']) {
      assert.ok(loaded.includes(family), `${family} must be in the loaded face set`);
    }
  });
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
