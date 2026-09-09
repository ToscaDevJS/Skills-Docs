// The generated-region contract.
//
// A regenerator finds exactly one region and replaces exactly that region.
// Everything a consumer wrote before or after it survives untouched. This is
// the mechanism Coverage §1 describes; the browser tests exercise it.

export const START = '/* paper-tokens:generated:start';
export const END = '/* paper-tokens:generated:end */';

/**
 * Replace the delimited generated region of a stylesheet.
 *
 * @param {string} stylesheet the consumer's copy of the template
 * @param {string} block the new export body, without the markers
 * @param {string} [note] provenance recorded inside the opening marker
 * @returns {string}
 */
export function replaceGenerated(stylesheet, block, note = '') {
  const open = stylesheet.indexOf(START);
  const close = stylesheet.indexOf(END);
  if (open === -1 || close === -1 || close < open) {
    throw new Error('No generated region found: the stylesheet has no paper-tokens markers.');
  }
  const header = note ? `${START}\n   ${note} */` : `${START} */`;
  return `${stylesheet.slice(0, open)}${header}\n${block.trim()}\n${END}${stylesheet.slice(close + END.length)}`;
}

/** The current contents of the generated region, markers excluded. */
export function readGenerated(stylesheet) {
  const open = stylesheet.indexOf(START);
  const close = stylesheet.indexOf(END);
  if (open === -1 || close === -1) throw new Error('No generated region found.');
  return stylesheet.slice(stylesheet.indexOf('*/', open) + 2, close).trim();
}
