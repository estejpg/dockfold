import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  createSubmissionHandler,
  type InboxStore,
} from "../server/icon-submissions";
import { ICON_SOURCES, MAX_ICON_BYTES } from "../src/lib/icon-upload";

const origin = "https://dockfold.vercel.app";
const png = await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#5481ba80" },
})
  .png()
  .toBuffer();
function request(change?: (form: FormData) => void) {
  const form = new FormData();
  form.set("appName", "Test App");
  form.set("website", "https://example.com/");
  form.set("source", ICON_SOURCES[0]);
  form.set("notes", "Exported for this test.");
  form.set(
    "icon",
    new File([new Uint8Array(png)], "test.png", { type: "image/png" }),
  );
  change?.(form);
  return new Request(`${origin}/api/icon-submissions`, {
    method: "POST",
    headers: { origin },
    body: form,
  });
}
function setup(configured = true) {
  const files = new Map<string, Buffer | string>();
  const store: InboxStore = {
    async exists(path) {
      return files.has(path);
    },
    async save(path, body) {
      files.set(path, body);
    },
  };
  return {
    files,
    store,
    handler: createSubmissionHandler(store, {
      origins: [origin],
      prefix: "test/submissions",
      configured: () => configured,
    }),
  };
}

test("a valid PNG is saved with private review metadata and a receipt; retry is deduplicated", async () => {
  const { files, handler } = setup();
  const response = await handler(request());
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const result = await response.json();
  assert.deepEqual(Object.keys(result), ["receipt"]);
  assert.match(result.receipt, /^[a-f0-9]{12}$/);
  assert.equal(files.size, 2);
  const metadata = JSON.parse(
    [...files].find(([path]) => path.endsWith("details.json"))![1] as string,
  );
  assert.equal(metadata.appName, "Test App");
  assert.equal(metadata.status, "pending-review");
  const saved = [...files].find(([path]) =>
    path.endsWith("icon.png"),
  )![1] as Buffer;
  const image = await sharp(saved).metadata();
  assert.equal(image.hasAlpha, true);
  assert.equal(image.width, 512);
  assert.equal(image.exif, undefined);
  const retry = await handler(request());
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), result);
  assert.equal(files.size, 2);
});

test("a database failure after the files are stored remains retryable and never reports success early", async () => {
  const { files, store } = setup();
  let fail = true,
    attempts = 0;
  const handler = createSubmissionHandler(store, {
    origins: [origin],
    prefix: "test/submissions",
    configured: () => true,
    record: async (icon) => {
      attempts++;
      assert.match(icon.digest, /^[a-f0-9]{64}$/);
      assert.ok(files.has(icon.path));
      if (fail) throw new Error("Database unavailable");
    },
  });
  assert.equal((await handler(request())).status, 503);
  assert.equal(files.size, 2);
  fail = false;
  assert.equal((await handler(request())).status, 200);
  assert.equal(attempts, 2);
  assert.equal(files.size, 2);
});

test("methods, origins and unconfigured storage cannot upload or list the inbox", async () => {
  const { handler, files } = setup();
  assert.equal(
    (await handler(new Request(`${origin}/api/icon-submissions`))).status,
    405,
  );
  const crossOrigin = request();
  crossOrigin.headers.set("origin", "https://other.example");
  assert.equal((await handler(crossOrigin)).status, 403);
  const noOrigin = request();
  noOrigin.headers.delete("origin");
  assert.equal((await handler(noOrigin)).status, 403);
  assert.equal((await setup(false).handler(request())).status, 503);
  assert.equal(files.size, 0);
});

test("rejects missing, duplicate, oversized and invalid fields before saving", async () => {
  const { handler, files } = setup();
  const badFields = [
    (form: FormData) => form.delete("appName"),
    (form: FormData) => form.set("appName", "a".repeat(81)),
    (form: FormData) => form.append("appName", "Duplicate"),
    (form: FormData) => form.set("website", "javascript:alert(1)"),
    (form: FormData) => form.set("website", "https://user:secret@example.com"),
    (form: FormData) => form.set("source", "Invalid"),
    (form: FormData) => form.set("notes", "x".repeat(1001)),
    (form: FormData) => form.set("company", "Filled by a bot"),
  ];
  for (const mutate of badFields)
    assert.equal((await handler(request(mutate))).status, 400);
  assert.equal(files.size, 0);
});

test("rejects spoofed, corrupt, empty, oversized and multiple files", async () => {
  const { handler, files } = setup();
  for (const body of [
    Buffer.from("<svg onload='alert(1)'/>"),
    Buffer.concat([png.subarray(0, 33), Buffer.from("broken")]),
    Buffer.alloc(0),
  ]) {
    const response = await handler(
      request((form) =>
        form.set("icon", new File([body], "fake.png", { type: "image/png" })),
      ),
    );
    assert.ok([400, 413].includes(response.status));
  }
  assert.equal(
    (
      await handler(
        request((form) =>
          form.set(
            "icon",
            new File([Buffer.alloc(MAX_ICON_BYTES + 1)], "large.png", {
              type: "image/png",
            }),
          ),
        ),
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await handler(
        request((form) =>
          form.append(
            "icon",
            new File([png], "second.png", { type: "image/png" }),
          ),
        ),
      )
    ).status,
    400,
  );
  assert.equal(files.size, 0);
});

test("rejects non-square, tiny and excessive dimensions", async () => {
  const { handler, files } = setup();
  for (const [width, height] of [
    [512, 256],
    [128, 128],
    [2049, 2049],
  ]) {
    const image = await sharp({
      create: { width, height, channels: 4, background: "transparent" },
    })
      .png()
      .toBuffer();
    assert.equal(
      (
        await handler(
          request((form) =>
            form.set(
              "icon",
              new File([image], "shape.png", { type: "image/png" }),
            ),
          ),
        )
      ).status,
      400,
    );
  }
  assert.equal(files.size, 0);
});

test("body limits also apply without a content-length header", async () => {
  const { handler, files } = setup();
  const response = await handler(
    new Request(`${origin}/api/icon-submissions`, {
      method: "POST",
      headers: { origin, "content-type": "multipart/form-data; boundary=test" },
      body: Buffer.alloc(MAX_ICON_BYTES + 17000),
    }),
  );
  assert.equal(response.status, 413);
  assert.equal(files.size, 0);
});

test("metadata failure never reports success; retry completes the same submission", async () => {
  const { files, store, handler } = setup();
  const save = store.save;
  let fail = true;
  store.save = async (path, body, type) => {
    if (path.endsWith("details.json") && fail) {
      fail = false;
      throw new Error("Simulated storage failure");
    }
    return save(path, body, type);
  };
  assert.equal((await handler(request())).status, 503);
  assert.equal(files.size, 1);
  assert.equal((await handler(request())).status, 201);
  assert.equal(files.size, 2);
});
