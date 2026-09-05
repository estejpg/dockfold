import { BlobNotFoundError, head, put } from "@vercel/blob";
import { createSubmissionHandler } from "../server/icon-submissions.js";
import { limitWrites, recordIcon } from "../server/community-service.js";
import { origins } from "../server/http.js";

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
    origins: origins(),
    before: limitWrites,
    record: recordIcon,
    prefix:
      process.env.VERCEL_ENV === "production"
        ? "submissions"
        : "preview/submissions",
    configured: () =>
      !!(
        storeId &&
        process.env.DATABASE_URL &&
        process.env.CLERK_SECRET_KEY &&
        (process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN)
      ),
  },
);

export default { fetch: handler };
