export type Category = "Design" | "Development" | "Writing" | "Music";

export type DockApp = {
  name: string;
  bundleIdentifier?: string;
  iconKey?: string;
};

export type DockManifest = {
  v: 1;
  apps: DockApp[];
};

export type DockProfile = DockManifest & {
  name: string;
  role: string;
  note: string;
  category: Category;
  publishedAt?: string;
};

export type GalleryProfile = DockProfile & {
  slug: string;
  backdrop: "sky" | "night" | "paper" | "ink";
};
