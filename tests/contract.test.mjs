import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'skills/paper-tailwind-tokens');

async function withCopy(run) {
  const temp = await mkdtemp(path.join(tmpdir(), 'paper-skill-install-'));
  const installed = path.join(temp, 'paper-tailwind-tokens');
  try {
    await cp(source, installed, { recursive: true });
    await run(installed, temp);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(filename));
    else if (entry.name.endsWith('.md')) files.push(filename);
  }
  return files;
}

async function validateReferences(installed) {
  const boundary = await realpath(installed);
  for (const filename of await markdownFiles(installed)) {
    const text = await readFile(filename, 'utf8');
    const links = [...text.matchAll(/\]\(([^\s)]+)\)/g)].map(match => match[1]);
    // SKILL.md also permits backticked paths in its References section.
    const referenceSection = text.split('## References')[1] ?? '';
    links.push(...[...referenceSection.matchAll(/`((?:references|assets|\.\.)\/[^`]+)`/g)].map(match => match[1]));
    for (const link of links) {
      if (/^(?:https?:|#)/.test(link)) continue;
      const target = path.resolve(path.dirname(filename), decodeURIComponent(link.split('#')[0]));
      let actual;
      try { actual = await realpath(target); }
      catch { throw new Error(`Missing reference in ${path.relative(installed, filename)}: ${link}`); }
      const relative = path.relative(boundary, actual);
      assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
        `Reference escapes installed skill: ${link}`);
    }
  }
}

test('isolated skill resolves all runtime references without changing source', async () => {
  const before = await readFile(path.join(source, 'SKILL.md'));
  await withCopy(validateReferences);
  assert.deepEqual(await readFile(path.join(source, 'SKILL.md')), before);
});

test('missing reference is a diagnostic failure', async () => {
  await withCopy(async installed => {
    await rm(path.join(installed, 'references/docs.md'));
    await assert.rejects(validateReferences(installed), /Missing reference.*docs.md/);
  });
});

test('reference outside the installed package fails even when it exists', async () => {
  await withCopy(async (installed, temp) => {
    await writeFile(path.join(temp, 'outside.md'), '# Outside');
    await writeFile(path.join(installed, 'escape.md'), '[outside](../outside.md)');
    await assert.rejects(validateReferences(installed), /escapes installed skill/);
  });
});

test('symlink cannot disguise an external reference', async () => {
  await withCopy(async (installed, temp) => {
    await writeFile(path.join(temp, 'outside.md'), '# Outside');
    await symlink(path.join(temp, 'outside.md'), path.join(installed, 'linked.md'));
    await writeFile(path.join(installed, 'escape.md'), '[outside](linked.md)');
    await assert.rejects(validateReferences(installed), /escapes installed skill/);
  });
});

test('discovery metadata and runtime sections remain complete', async () => {
  const text = await readFile(path.join(source, 'SKILL.md'), 'utf8');
  const [, metadata, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.match(metadata, /name: paper-tailwind-tokens/);
  const description = metadata.match(/^description: "(.*)"$/m)?.[1];
  assert.ok(description?.startsWith('Trigger:') && description.length <= 250);
  for (const field of ['license', 'author', 'version']) assert.match(metadata, new RegExp(`${field}:`));
  assert.deepEqual([...body.matchAll(/^## (.+)$/gm)].map(match => match[1]),
    ['Activation Contract', 'Hard Rules', 'Decision Gates', 'Execution Steps', 'Output Contract', 'References']);
});
