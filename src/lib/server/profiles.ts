import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { DockProfile } from '../types';
import { readJSON, writeJSON, deleteBlob } from './storage';

export const validId = (id: string) => /^[a-f0-9]{32}$/.test(id);
export const validToken = (token: string) => /^[a-f0-9]{64}$/.test(token);
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export type StoredProfile = { profile: DockProfile; deletionHash: string };
export const profilePath = (id: string) => `profiles/v1/${id}.json`;

export async function readProfile(id: string) {
  return validId(id) ? readJSON<StoredProfile>(profilePath(id)) : null;
}
export function ownsProfile(record: StoredProfile, token: string) {
  return validToken(token) && timingSafeEqual(Buffer.from(record.deletionHash, 'hex'), Buffer.from(digest(token), 'hex'));
}
export async function createProfile(id: string, token: string, profile: DockProfile) {
  await writeJSON(profilePath(id), { profile, deletionHash: digest(token) });
}
export async function deleteProfile(id: string) { await deleteBlob(profilePath(id)); }
