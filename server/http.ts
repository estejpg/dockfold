export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
export function origins() {
  return [
    "https://dockfold.vercel.app",
    ...[
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]
      .filter(Boolean)
      .map((host) => `https://${host}`),
    ...(!process.env.VERCEL || process.env.VERCEL_ENV === "development"
      ? ["http://localhost:3105", "http://127.0.0.1:3105"]
      : []),
  ];
}
export function validateOrigin(request: Request) {
  if (!origins().includes(request.headers.get("origin") || ""))
    throw new HttpError("Please submit from DockFold.", 403);
}
export function textField(
  value: unknown,
  label: string,
  max: number,
  required = true,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim()) ||
    [...value].some(
      (char) =>
        (char.charCodeAt(0) < 32 &&
          ![9, 10, 13].includes(char.charCodeAt(0))) ||
        char.charCodeAt(0) === 127,
    )
  )
    throw new HttpError(`Check the ${label} and try again.`);
  return value.trim();
}
export function requestFields(value: Record<string, unknown>) {
  const name = textField(value.name, "app name", 80);
  const website = textField(value.website, "website", 500);
  const notes = textField(value.notes ?? "", "notes", 1000, false);
  if (value.company) throw new HttpError("Please leave the empty field blank.");
  let url: URL;
  try {
    url = new URL(website);
  } catch {
    throw new HttpError("Enter the app’s complete official website address.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new HttpError(
      "Use an http or https address without sign-in details.",
    );
  url.hash = "";
  const canonical =
    `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`.toLowerCase();
  return {
    name,
    website: url.href,
    notes,
    matchKey: `${name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ")}|${canonical}`,
  };
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new HttpError("That request could not be found.");
  return value;
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError("Send this request using the DockFold form.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("The form was empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new HttpError("The form is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError("The form couldn’t be read.");
  }
}
export const privateHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
