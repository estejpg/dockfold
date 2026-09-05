import { BlobNotFoundError, head, put } from "@vercel/blob";
import { createSubmissionHandler } from "../server/icon-submissions.js";

const storeId = process.env.ICON_INBOX_STORE_ID;
const handler = createSubmissionHandler(
  {
    async exists(path) {
      try {
        await head(path, { storeId });
        return true;
      } catch (error) {
        if (error instanceof BlobNotFoundError) return false;
        throw error;
      }
    },
    async save(path, body, contentType) {
      // Content-addressed paths make retries safe, including a partially completed upload.
      await put(path, body, {
        access: "private",
        storeId,
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
  },
  {
    origins: [
      "https://dockfold.vercel.app",
      ...[
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
      ]
        .filter(Boolean)
        .map((host) => `https://${host}`),
      ...(process.env.VERCEL_ENV === "development" || !process.env.VERCEL
        ? ["http://localhost:3105", "http://127.0.0.1:3105"]
        : []),
    ],
    prefix:
      process.env.VERCEL_ENV === "production"
        ? "submissions"
        : "preview/submissions",
    configured: () =>
      !!(
        storeId &&
        (process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN)
      ),
  },
);

export default { fetch: handler };
