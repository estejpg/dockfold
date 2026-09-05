import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  ICON_SOURCES,
  MAX_ICON_BYTES,
  MAX_ICON_SIZE,
  iconSizeError,
} from "../src/lib/icon-upload.js";

export interface InboxStore {
  exists(path: string): Promise<boolean>;
  save(path: string, body: Buffer | string, contentType: string): Promise<void>;
}

class SubmissionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function field(form: FormData, name: string, max: number, required = true) {
  const values = form.getAll(name);
  if (
    values.length > 1 ||
    (values[0] !== undefined && typeof values[0] !== "string")
  )
    throw new SubmissionError("Check the form fields and try again.");
  const value = String(values[0] || "").trim();
  const hasControl = [...value].some(
    (char) =>
      char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)),
  );
  if ((required && !value) || value.length > max || hasControl)
    throw new SubmissionError(
      `Check the ${name === "appName" ? "app name" : name} field and try again.`,
    );
  return value;
}

async function readForm(request: Request) {
  const max = MAX_ICON_BYTES + 16384;
  if (Number(request.headers.get("content-length")) > max)
    throw new SubmissionError("Choose a PNG smaller than 2 MB.", 413);
  const type = request.headers.get("content-type") || "";
  if (!type.startsWith("multipart/form-data;"))
    throw new SubmissionError(
      "Send the icon using the contribution form.",
      415,
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new SubmissionError("Choose an icon and fill in the form.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new SubmissionError("Choose a PNG smaller than 2 MB.", 413);
    }
    chunks.push(value);
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { "content-type": type },
    }).formData();
  } catch {
    throw new SubmissionError(
      "This upload couldn’t be read. Choose the file again.",
    );
  }
}

export function createSubmissionHandler(
  store: InboxStore,
  options: {
    origins: string[];
    prefix: string;
    configured: () => boolean;
  },
) {
  return async (request: Request) => {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const json = (body: object, status: number) =>
      Response.json(body, { status, headers });
    if (request.method !== "POST")
      return new Response(null, {
        status: 405,
        headers: { ...headers, Allow: "POST" },
      });
    if (!options.origins.includes(request.headers.get("origin") || ""))
      return json(
        { error: "Please submit from the DockFold contribution page." },
        403,
      );
    if (!options.configured())
      return json(
        {
          error:
            "The review inbox is temporarily unavailable. Please try again later.",
        },
        503,
      );
    try {
      const form = await readForm(request);
      if (field(form, "company", 1000, false))
        throw new SubmissionError("Please leave the empty field blank.");
      const appName = field(form, "appName", 80);
      const website = field(form, "website", 500);
      const source = field(form, "source", 80);
      const notes = field(form, "notes", 1000, false);
      if (!ICON_SOURCES.some((value) => value === source))
        throw new SubmissionError("Choose where the icon came from.");
      let url: URL;
      try {
        url = new URL(website);
      } catch {
        throw new SubmissionError(
          "Enter the app’s complete official website address.",
        );
      }
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new SubmissionError(
          "Use an http or https address without sign-in details.",
        );
      // Source URLs are stored as text for review. Never fetch contributor-provided URLs.
      const file = form.get("icon");
      if (
        !(file instanceof File) ||
        form.getAll("icon").length !== 1 ||
        file.type !== "image/png"
      )
        throw new SubmissionError("Choose one PNG image.");
      if (!file.size || file.size > MAX_ICON_BYTES)
        throw new SubmissionError("Choose a PNG smaller than 2 MB.", 413);
      const bytes = Buffer.from(await file.arrayBuffer());
      if (
        !bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        throw new SubmissionError(
          "This file isn’t a valid PNG. Export it again in Preview.",
        );
      let image: Buffer, width: number, height: number;
      try {
        const pipeline = sharp(bytes, {
          limitInputPixels: MAX_ICON_SIZE ** 2,
          failOn: "warning",
        });
        const metadata = await pipeline.metadata();
        width = metadata.width;
        height = metadata.height;
        const sizeError = iconSizeError(width, height);
        if (sizeError) throw new SubmissionError(sizeError);
        if (metadata.format !== "png" || (metadata.pages || 1) !== 1)
          throw new SubmissionError(
            "Choose a still PNG icon, without animation.",
          );
        // Decode and re-encode to remove metadata and trailing content; preserve transparency.
        image = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      } catch (error) {
        if (error instanceof SubmissionError) throw error;
        throw new SubmissionError(
          "This PNG couldn’t be opened. Use a square image between 256 and 2048 pixels.",
        );
      }
      const details = {
        appName,
        website: url.href,
        source,
        notes,
        width,
        height,
      };
      const digest = createHash("sha256")
        .update(JSON.stringify(details))
        .update(image)
        .digest("hex");
      const receipt = digest.slice(0, 12);
      const slug =
        appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50) || "app";
      const folder = `${options.prefix}/${slug}-${digest}`;
      const manifest = `${folder}/details.json`;
      if (await store.exists(manifest)) return json({ receipt }, 200);
      await store.save(`${folder}/icon.png`, image, "image/png");
      await store.save(
        manifest,
        JSON.stringify(
          {
            ...details,
            receipt,
            receivedAt: new Date().toISOString(),
            status: "pending-review",
            icon: "icon.png",
          },
          null,
          2,
        ),
        "application/json",
      );
      // A receipt means both files are saved. Storage URLs and credentials never leave the server.
      return json({ receipt }, 201);
    } catch (error) {
      if (error instanceof SubmissionError)
        return json({ error: error.message }, error.status);
      console.error(
        "Icon submission storage failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      return json(
        {
          error:
            "We couldn’t confirm your upload. Please try again; retries won’t create duplicates.",
        },
        503,
      );
    }
  };
}
