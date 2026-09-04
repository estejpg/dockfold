import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/how-it-works", "/share"].map((path) => ({ url: `https://dockfold.vercel.app${path}`, lastModified: new Date() }));
}
