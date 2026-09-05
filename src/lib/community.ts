export const APP_CATEGORIES = [
  "Essentials",
  "Design",
  "Photo & video",
  "Development",
  "Research & writing",
  "Music",
  "Communication",
  "Browsers",
  "Utilities",
  "AI",
  "Gaming",
  "Productivity",
] as const;
export type RequestStatus =
  | "pending"
  | "open"
  | "included"
  | "declined"
  | "merged";
export type PublicRequest = {
  id: string;
  name: string;
  website: string;
  status: "open" | "included";
  votes: number;
  createdAt: string;
};
export type ReviewRequest = Omit<PublicRequest, "status" | "votes"> & {
  status: RequestStatus;
  notes: string;
  revision: number;
};
export type ReviewIcon = {
  id: string;
  requestId: string;
  source: string;
  notes: string;
  width: number;
  status: "pending" | "approved" | "declined";
};
export type CatalogApp = {
  id: string;
  name: string;
  category: string;
  icon: string;
  active: boolean;
};
export type ReviewInbox = {
  requests: ReviewRequest[];
  icons: ReviewIcon[];
  catalog: CatalogApp[];
  more: boolean;
};

export async function communityFetch<T>(
  action: string,
  body?: object,
  token?: string | null,
  query: Record<string, string> = {},
): Promise<T> {
  const response = await fetch(
    `/api/community?${new URLSearchParams({ action, ...query })}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    },
  );
  const value = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      value?.error ||
        (response.status === 429
          ? "Too many attempts. Please try again later."
          : "We couldn’t complete that request. Please try again."),
    );
  if (!value || typeof value !== "object")
    throw new Error(
      "The server returned an incomplete response. Please try again.",
    );
  return value as T;
}
