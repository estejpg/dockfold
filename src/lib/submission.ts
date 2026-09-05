import { parseDock, type Dock } from "./dock";
import { REPOSITORY } from "./requests";
export function submissionURL(dock: Dock, link: string) {
  const parsed = parseDock(dock);
  const url = new URL(`https://github.com/${REPOSITORY}/issues/new`);
  url.searchParams.set("template", "dock-submission.yml");
  url.searchParams.set("title", `[Dock submission] ${parsed.n}`);
  url.searchParams.set("dock-name", parsed.n);
  url.searchParams.set("dock-link", link);
  url.searchParams.set("description", parsed.t);
  return url.toString();
}
