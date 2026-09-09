// Pinned browser lane.
//
// One Chromium, downloaded by the pinned Playwright version — never the system
// Chrome. Every request that is not the loopback fixture server is aborted and
// recorded, so a fixture that reaches for a CDN fails loudly instead of quietly
// rendering with something else.

import { chromium } from 'playwright';
import { startServer } from './server.mjs';

/** Boilerplate every generated fixture shares: pinned compiler, pinned fonts. */
export function fixture({ theme = '', body = '', head = '', width = 1000 }) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/vendor/fonts.css">
<script src="/vendor/tailwind.js"></script>
<style type="text/tailwindcss">${theme}</style>
<style>body{margin:0;width:${width}px;font-family:system-ui}</style>
${head}
</head><body>${body}</body></html>`;
}

async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    throw new Error(
      'Pinned Chromium is unavailable. Run `npx playwright install chromium` ' +
      `with the version pinned in package.json. Original error: ${error.message}`,
    );
  }
}

/**
 * Run `body(page, context)` against the fixture server with a pinned browser.
 *
 * @param {object} options
 * @param {Map<string,string>} [options.pages] in-memory fixtures, keyed by name
 * @param {number} [options.viewport] viewport width in CSS pixels
 * @param {number} [options.readyTimeout] ms to wait for compiled CSS
 * @param {(api: object) => Promise<any>} body
 */
export async function withBrowser({ pages = new Map(), viewport = 1000, readyTimeout = 15_000 } = {}, body) {
  const server = await startServer(pages);
  const browser = await launch();
  const blocked = [];
  const pageErrors = [];

  try {
    const context = await browser.newContext({
      viewport: { width: viewport, height: 900 },
      deviceScaleFactor: 1,
    });

    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(server.origin) || url.startsWith('data:') || url.startsWith('blob:')) {
        return route.continue();
      }
      blocked.push(url);
      return route.abort('blockedbyclient');
    });

    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));

    return await body({
      page,
      context,
      origin: server.origin,
      blocked,
      pageErrors,
      browserVersion: browser.version(),
      /**
       * Navigate and wait until Tailwind has produced CSS and the fonts are in.
       *
       * The readiness signal is the compiler's own layer statement, not "some
       * inline stylesheet exists" — every fixture ships a hand-written
       * `<style>`, so the looser predicate reported success on a page where the
       * compiler never loaded.
       */
      open: async pathname => {
        await page.goto(`${server.origin}${pathname}`, { waitUntil: 'load' });
        await page.waitForFunction(
          () => [...document.styleSheets].some(sheet => {
            try {
              return [...sheet.cssRules].some(rule =>
                rule instanceof CSSLayerStatementRule && rule.nameList.includes('utilities'));
            } catch { return false; }
          }),
          undefined,
          { timeout: readyTimeout },
        );
        await page.evaluate(() => document.fonts.ready);
      },
    });
  } finally {
    await browser.close();
    await server.close();
  }
}

/** Computed style of one property, as a string. */
export const computed = (page, selector, property) =>
  page.evaluate(
    ([sel, prop]) => getComputedStyle(document.querySelector(sel)).getPropertyValue(prop),
    [selector, property],
  );

/** Rounded width of an element's first text rectangle. */
export const textWidth = (page, selector) =>
  page.evaluate(sel => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(sel));
    return Math.round(range.getBoundingClientRect().width * 100) / 100;
  }, selector);
