import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { decodeManifest, decodeProfile, encodeDock, manifestSchema, profileSchema } from '../src/lib/manifest';
import { digest, ownsProfile, validId, validToken } from '../src/lib/server/profiles';
import { galleryProfiles, resolveIcon, topApps } from '../src/lib/apps';
const manifest = { v: 1 as const, apps: [{ name: 'Café 🧑🏽‍💻', bundleIdentifier: 'test.cafe' }] };
test('UTF-8 manifests round trip without losing Unicode', () => assert.deepEqual(decodeManifest(encodeDock(manifest)), manifest));
test('malformed and oversized encodings are rejected before parsing', () => {
  for (const value of ['', 'a', '////', 'not%base64', 'a'.repeat(48001), Buffer.from([255]).toString('base64url')]) assert.throws(() => decodeManifest(value));
});
test('unknown fields including local paths are stripped', () => {
  assert.deepEqual(manifestSchema.parse({ ...manifest, secret: 'private', apps: [{ ...manifest.apps[0], path: '/Users/private', icon: 'https://tracking.example' }] }), manifest);
});
test('empty, overlong, and excessive app lists are invalid', () => {
  assert.throws(() => manifestSchema.parse({ v: 1, apps: [] }));
  assert.throws(() => manifestSchema.parse({ v: 1, apps: Array(81).fill(manifest.apps[0]) }));
  assert.throws(() => manifestSchema.parse({ v: 1, apps: [{ name: 'x'.repeat(81) }] }));
  assert.throws(() => manifestSchema.parse({ v: 2, apps: manifest.apps }));
});
test('profiles enforce publication field constraints', () => {
  assert.throws(() => profileSchema.parse({ ...manifest, name: ' ', role: 'Role', note: 'Note', category: 'Design' }));
  assert.throws(() => decodeProfile(encodeDock(manifest)));
});
test('only exact, high-entropy identifiers and owner keys are accepted', () => {
  assert.ok(validId('a'.repeat(32))); assert.ok(!validId('../profiles'));
  assert.ok(validToken('b'.repeat(64))); assert.ok(!validToken('b'.repeat(63)));
  const record = { profile: galleryProfiles[0], deletionHash: digest('b'.repeat(64)) };
  assert.ok(ownsProfile(record, 'b'.repeat(64))); assert.ok(!ownsProfile(record, 'c'.repeat(64))); assert.ok(!ownsProfile(record, 'bad'));
});
test('icon catalog rejects prototype and arbitrary paths', () => {
  assert.equal(resolveIcon({ name: 'Unknown', iconKey: '__proto__' }), undefined);
  assert.equal(resolveIcon({ name: 'Unknown', iconKey: '../private' }), undefined);
});
test('visible counts reflect examples rather than invented community statistics', () => {
  assert.equal(topApps.length, 5);
  for (const [, count] of topApps) assert.ok(count > 0 && count <= galleryProfiles.length);
});
const fixture = 'macos/DockfoldCapture/.build/checks/swift-manifest.json';
test('actual Swift JSON encoder interoperates with TypeScript', { skip: !existsSync(fixture) }, () => {
  const data = readFileSync(fixture); assert.deepEqual(decodeManifest(data.toString('base64url')), manifest);
});
