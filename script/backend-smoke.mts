import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const origin = process.env.TEST_ORIGIN ?? 'http://localhost:3100';
const id = randomBytes(16).toString('hex'), deletionKey = randomBytes(32).toString('hex');
const profile = { v: 1, name: 'DockFold verification', role: 'Synthetic test', note: 'Temporary profile created to verify sharing and deletion.', category: 'Development', apps: [{ name: 'Terminal', bundleIdentifier: 'com.apple.Terminal' }] };
const headers = { Origin: origin, 'Content-Type': 'application/json' };
async function remove(key: string) { return fetch(`${origin}/api/profiles/${id}`, { method: 'DELETE', headers: { ...headers, Authorization: `Bearer ${key}` } }); }
try {
  let response = await fetch(`${origin}/api/profiles`, { method: 'POST', headers, body: JSON.stringify({ id, deletionKey, profile }) });
  assert.equal(response.status, 201, await response.text());
  response = await fetch(`${origin}/api/profiles`, { method: 'POST', headers, body: JSON.stringify({ id, deletionKey, profile }) });
  assert.equal(response.status, 200, 'Retry must be idempotent');
  response = await fetch(`${origin}/p/${id}`);
  assert.equal(response.status, 200); assert.match(await response.text(), /DockFold verification/);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
  response = await remove('0'.repeat(64)); assert.equal(response.status, 403, 'Wrong key must fail');
  response = await fetch(`${origin}/api/profiles`, { method: 'POST', headers: { ...headers, Origin: 'https://elsewhere.example' }, body: JSON.stringify({ id, deletionKey, profile }) });
  assert.equal(response.status, 403, 'Cross-origin publish must fail');
  response = await fetch(`${origin}/api/profiles`, { method: 'POST', headers, body: JSON.stringify({ id, deletionKey, profile: { ...profile, apps: [] } }) });
  assert.equal(response.status, 400, 'Empty Dock must fail');
  response = await fetch(`${origin}/api/profiles`, { method: 'POST', headers, body: JSON.stringify({ junk: 'x'.repeat(40_000) }) });
  assert.equal(response.status, 413, 'Large body must fail');
  response = await remove(deletionKey); assert.equal(response.status, 200, await response.text());
  response = await fetch(`${origin}/p/${id}`); assert.equal(response.status, 404, 'Deleted link must immediately stop resolving');
  response = await remove(deletionKey); assert.equal(response.status, 200, 'Repeat deletion is safe');
  console.log('PASS: create, idempotent retry, fresh read, privacy headers, wrong-key denial, origin check, validation, body limit, deletion, repeat deletion.');
} finally { await remove(deletionKey); }
