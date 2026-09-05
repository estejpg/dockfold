import { byId, type Dock } from "./dock";
export type Collection = {
  id: string;
  title: string;
  description: string;
  group: string;
  addedOn: string;
  apps: string[];
  rationale: string;
};
export const groups = [
  {
    id: "everyday",
    name: "Everyday Docks",
    description: "A few good essentials.",
  },
  {
    id: "design",
    name: "For the design desk",
    description: "From the first sketch to the handoff.",
  },
  {
    id: "photo-video",
    name: "Photo & video",
    description: "Make room for the next edit.",
  },
  {
    id: "development",
    name: "Build & ship",
    description: "Tools for making software.",
  },
  {
    id: "research",
    name: "Read, write & research",
    description: "Follow an idea a little further.",
  },
  {
    id: "together",
    name: "Working together",
    description: "Keep the conversation close.",
  },
];
export const collections: Collection[] = [
  {
    id: "apple-essentials",
    title: "Apple essentials",
    description: "The familiar things, all in one place.",
    group: "everyday",
    addedOn: "2026-09-04",
    apps: ["finder", "calendar", "notes", "mail", "messages", "music"],
    rationale:
      "A starting point for an ordinary day: files, plans, notes, messages, and something to listen to.",
  },
  {
    id: "less-but-enough",
    title: "Less, but enough",
    description: "Four icons. A little more breathing room.",
    group: "everyday",
    addedOn: "2026-09-04",
    apps: ["finder", "notes", "mail", "calendar"],
    rationale:
      "Keep only the daily essentials in view. Add the apps your current project needs when you make this Dock your own.",
  },
  {
    id: "after-hours",
    title: "After hours",
    description: "Close the work tabs. Open something good.",
    group: "everyday",
    addedOn: "2026-09-04",
    apps: ["finder", "books", "music", "messages"],
    rationale:
      "A smaller evening Dock for reading, listening, and staying in touch.",
  },
  {
    id: "interface-workshop",
    title: "Interface workshop",
    description: "Sketch, prototype, and put it on the web.",
    group: "design",
    addedOn: "2026-09-04",
    apps: ["figma", "paper", "framer", "arc", "resurf"],
    rationale:
      "An interface-focused set that puts design tools beside a browser and a place to keep visual references.",
  },
  {
    id: "brand-studio",
    title: "Brand studio",
    description: "Type, color, images, and the bigger picture.",
    group: "design",
    addedOn: "2026-09-04",
    apps: ["illustrator", "photoshop", "figma", "finder", "resurf"],
    rationale:
      "Move between vector work, image editing, layout, files, and the references that tie a visual identity together.",
  },
  {
    id: "design-handoff",
    title: "Design handoff",
    description: "Share the details that make the difference.",
    group: "design",
    addedOn: "2026-09-04",
    apps: ["figma", "shotbase", "notion", "slack", "mail"],
    rationale:
      "A collaborative design Dock for the moment a design needs context, a screenshot, and a conversation.",
  },
  {
    id: "photo-desk",
    title: "Photo desk",
    description: "From a first selection to the final image.",
    group: "photo-video",
    addedOn: "2026-09-04",
    apps: ["lightroom", "photoshop", "finder", "calendar", "mail"],
    rationale:
      "Editing sits beside file organization and the practical work of planning shoots and delivering photographs.",
  },
  {
    id: "edit-suite",
    title: "Edit suite",
    description: "A focused home for moving images.",
    group: "photo-video",
    addedOn: "2026-09-04",
    apps: ["premiere", "photoshop", "finder", "music", "notes"],
    rationale:
      "Keep the edit, supporting graphics, source files, and notes within reach without filling every spot in the Dock.",
  },
  {
    id: "short-form-studio",
    title: "Short-form studio",
    description: "Small videos, considered from start to finish.",
    group: "photo-video",
    addedOn: "2026-09-04",
    apps: ["capcut", "lightroom", "notion", "finder", "spotify"],
    rationale:
      "A compact set for assembling short videos, working on images, and keeping track of the next idea.",
  },
  {
    id: "native-workbench",
    title: "Native workbench",
    description: "An app idea, a project, and a place to start.",
    group: "development",
    addedOn: "2026-09-04",
    apps: ["xcode", "github", "finder", "notes"],
    rationale:
      "A deliberately small starting point for native app work, with code, repositories, project files, and notes together.",
  },
  {
    id: "ship-a-website",
    title: "Ship a website",
    description: "From a blank canvas to a browser tab.",
    group: "development",
    addedOn: "2026-09-04",
    apps: ["figma", "framer", "github", "arc", "notion"],
    rationale:
      "Bring design, publishing, repositories, browser checks, and project notes into the same workspace.",
  },
  {
    id: "agent-workshop",
    title: "Agent workshop",
    description: "Code, compare, and keep a human in the loop.",
    group: "development",
    addedOn: "2026-09-04",
    apps: ["antigravity-ide", "opencode", "claude", "github", "notes"],
    rationale:
      "A place for trying assisted coding workflows while keeping project history and your own notes close.",
  },
  {
    id: "read-write-cite",
    title: "Read, write, cite",
    description: "For the long paper and the interesting footnote.",
    group: "research",
    addedOn: "2026-09-04",
    apps: ["zotero", "books", "notes", "notion", "resurf"],
    rationale:
      "A research-minded Dock that keeps reading, references, saved material, and writing in one view.",
  },
  {
    id: "research-trail",
    title: "Research trail",
    description: "Follow a question. Keep what you find.",
    group: "research",
    addedOn: "2026-09-04",
    apps: ["perplexity", "chatgpt-atlas", "resurf", "zotero", "notes"],
    rationale:
      "Explore sources in the browser, collect the useful ones, and keep notes alongside your reference library.",
  },
  {
    id: "quiet-writing",
    title: "Quiet writing",
    description: "An open note, a good book, a little music.",
    group: "research",
    addedOn: "2026-09-04",
    apps: ["notes", "books", "music"],
    rationale:
      "Three simple places to spend an unhurried writing session. Add your preferred editor when you customize it.",
  },
  {
    id: "team-day",
    title: "Team day",
    description: "The shared plans and everyday conversations.",
    group: "together",
    addedOn: "2026-09-04",
    apps: ["slack", "calendar", "mail", "notion", "figma"],
    rationale:
      "A workday set for shared projects, meetings, decisions, and the occasional design review.",
  },
  {
    id: "community-desk",
    title: "Community desk",
    description: "Stay in the loop without losing your place.",
    group: "together",
    addedOn: "2026-09-04",
    apps: ["discord", "messages", "calendar", "notion", "spotify"],
    rationale:
      "A casual collaboration Dock for community conversations, plans, shared notes, and background listening.",
  },
  {
    id: "capture-and-collect",
    title: "Capture & collect",
    description: "Save the thought before it disappears.",
    group: "together",
    addedOn: "2026-09-04",
    apps: ["aside", "resurf", "shotbase", "notes", "superwhisper"],
    rationale:
      "A browser, a reference library, screenshots, notes, and dictation for gathering the pieces of a new project.",
  },
];
export const collectionById = new Map(
  collections.map((item) => [item.id, item]),
);
export function collectionDock(item: Collection): Dock {
  return { v: 2, n: item.title, t: item.description, a: [...item.apps] };
}
export function matchesCollection(item: Collection, query: string) {
  const text = [
    item.title,
    item.description,
    groups.find((g) => g.id === item.group)?.name,
    ...item.apps.map((id) => byId.get(id)?.name ?? ""),
  ]
    .join(" ")
    .toLocaleLowerCase();
  return text.includes(query.trim().toLocaleLowerCase());
}
export function latestCollections() {
  return [...collections].sort(
    (a, b) =>
      b.addedOn.localeCompare(a.addedOn) ||
      collections.indexOf(a) - collections.indexOf(b),
  );
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
