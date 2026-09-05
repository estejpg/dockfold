export const REPOSITORY = "estejpg/dockfold";
export const REQUEST_URL = `https://github.com/${REPOSITORY}/issues/new?template=app-request.yml`;
export const BOARD_URL = `https://github.com/${REPOSITORY}/issues?q=is%3Aissue+is%3Aopen+label%3Aapp-request+sort%3Areactions-%2B1-desc`;
export type AppRequest = {
  number: number;
  name: string;
  votes: number;
  createdAt: string;
};
export type RequestBoard = {
  requests: AppRequest[];
  fetchedAt: number;
  truncated: boolean;
};
const CACHE_KEY = "dockfold:requests:v1";
const CACHE_MS = 5 * 60 * 1000;
export function parseIssues(value: unknown): AppRequest[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("Unexpected request list.");
  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      item.pull_request ||
      !Number.isSafeInteger(item.number) ||
      item.number <= 0 ||
      typeof item.title !== "string" ||
      !Array.isArray(item.labels) ||
      !item.labels.some(
        (label: unknown) =>
          typeof label === "object" &&
          label !== null &&
          "name" in label &&
          label.name === "app-request",
      )
    )
      return [];
    const votes = item.reactions?.["+1"];
    return [
      {
        number: item.number,
        name:
          item.title.replace(/^\[app request\]\s*/i, "").slice(0, 160) ||
          `Request #${item.number}`,
        votes: Number.isSafeInteger(votes) && votes >= 0 ? votes : 0,
        createdAt: typeof item.created_at === "string" ? item.created_at : "",
      },
    ];
  });
}
export function rankRequests(requests: AppRequest[]) {
  return [...requests].sort((a, b) => b.votes - a.votes || a.number - b.number);
}
let memory: RequestBoard | undefined;
export function cachedBoard(): RequestBoard | undefined {
  if (memory) return memory;
  try {
    const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
    if (
      raw &&
      Array.isArray(raw.requests) &&
      raw.requests.length <= 500 &&
      raw.requests.every(
        (r: AppRequest) =>
          Number.isSafeInteger(r.number) &&
          r.number > 0 &&
          typeof r.name === "string" &&
          r.name.length <= 160 &&
          Number.isSafeInteger(r.votes) &&
          r.votes >= 0 &&
          typeof r.createdAt === "string",
      ) &&
      typeof raw.fetchedAt === "number" &&
      typeof raw.truncated === "boolean"
    )
      memory = raw;
  } catch {
    /* cache is optional */
  }
  return memory;
}
export async function fetchBoard(
  signal: AbortSignal,
  force = false,
): Promise<RequestBoard> {
  const cached = cachedBoard();
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MS)
    return cached;
  const requests: AppRequest[] = [];
  let truncated = false;
  for (let page = 1; page <= 5; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${REPOSITORY}/issues?labels=app-request&state=open&sort=created&direction=asc&per_page=100&page=${page}`,
      {
        signal,
        headers: { Accept: "application/vnd.github+json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
      },
    );
    if (!response.ok)
      throw new Error(
        response.status === 403 || response.status === 429
          ? "GitHub’s request limit was reached. Try later, or open the board on GitHub."
          : "The request board is unavailable right now. You can still open it on GitHub.",
      );
    const json: unknown = await response.json();
    requests.push(...parseIssues(json));
    if (!response.headers.get("link")?.includes('rel="next"')) break;
    if (page === 5) truncated = true;
  }
  const board = {
    requests: rankRequests(requests),
    fetchedAt: Date.now(),
    truncated,
  };
  memory = board;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(board));
  } catch {
    /* requests still display without storage */
  }
  return board;
}
