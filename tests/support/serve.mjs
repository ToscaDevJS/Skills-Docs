// Open the visual probes by hand, with the same pinned assets the tests use.
//
//   npm run probes   →  http://127.0.0.1:8117/token-sweep.html
//
// The fixtures reference /vendor/* paths, so they need this server; opening the
// files directly from disk leaves them without a compiler and without fonts.

import { startServer } from './server.mjs';

const { origin } = await startServer();
console.log(`Fixtures served at ${origin}`);
for (const page of [
  'f01-leading-inheritance.html',
  'roundtrip-final-cta.html',
  'token-sweep.html',
  'unverified-claims.html',
]) console.log(`  ${origin}/${page}`);
console.log('\nCtrl-C to stop.');
