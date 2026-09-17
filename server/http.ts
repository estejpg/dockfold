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
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3105",
          "http://127.0.0.1:3105",
        ]
      : []),
  ];
}
export function validateOrigin(request: Request) {
  const origin = request.headers.get("origin") || "";
  if (origins().includes(origin)) return;
  if (
    (!process.env.VERCEL || process.env.VERCEL_ENV === "development") &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  )
    return;
  throw new HttpError("Please submit from DockFold.", 403);
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
