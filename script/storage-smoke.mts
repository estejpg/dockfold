import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readJSON, writeJSON, deleteBlob, BlobPreconditionFailedError } from '../src/lib/server/storage';
const path = `checks/${randomBytes(16).toString('hex')}.json`;
try {
  await writeJSON(path, { n: 0 });
  const first = await readJSON<{ n: number }>(path); assert.equal(first?.value.n, 0);
  const results = await Promise.allSettled([writeJSON(path, { n: 1 }, first!.etag), writeJSON(path, { n: 2 }, first!.etag)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1, 'Exactly one concurrent writer may succeed');
  const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
  console.log("Concurrent rejection:", failed.reason?.name, failed.reason?.message);
  assert.ok(failed.reason instanceof BlobPreconditionFailedError);
  await deleteBlob(path); assert.equal(await readJSON(path), null);
  console.log('PASS: private storage, fresh reads, atomic conditional writes, immediate deletion.');
} finally { await deleteBlob(path); }
