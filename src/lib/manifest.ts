import { z } from "zod";
import type { DockManifest, DockProfile } from "@/lib/types";

const appSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bundleIdentifier: z.string().trim().max(160).optional(),
  iconKey: z.string().trim().max(80).optional(),
});

export const manifestSchema = z.object({
  v: z.literal(1),
  apps: z.array(appSchema).min(1).max(80),
});

export const profileSchema = manifestSchema.extend({
  name: z.string().trim().min(1).max(60),
  role: z.string().trim().min(1).max(80),
  note: z.string().trim().min(1).max(180),
  category: z.enum(["Design", "Development", "Writing", "Music"]),
  publishedAt: z.string().optional(),
});

function bytesToBase64(bytes: Uint8Array) {
  if (typeof window === "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  if (typeof window === "undefined") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = window.atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeDock(value: DockManifest | DockProfile) {
  const json = JSON.stringify(value);
  return bytesToBase64(new TextEncoder().encode(json))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

export function decodeManifest(payload: string): DockManifest {
  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (payload.length % 4)) % 4);
  const json = new TextDecoder().decode(base64ToBytes(base64));
  return manifestSchema.parse(JSON.parse(json));
}

export function decodeProfile(payload: string): DockProfile {
  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (payload.length % 4)) % 4);
  const json = new TextDecoder().decode(base64ToBytes(base64));
  return profileSchema.parse(JSON.parse(json));
}
