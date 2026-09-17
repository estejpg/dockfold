import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../api/suggest";
import {
  parseSuggestion,
  SuggestionError,
  suggestionMailto,
  suggestionText,
} from "../src/lib/suggestion";

const valid = {
  title: "Quiet morning",
  description: "Notes, calendar, and a little music.",
  group: "everyday",
  apps: ["notes", "calendar", "music"],
  notes: "A starter Dock.",
  credit: "Ada",
  email: "ada@example.com",
  company: "",
};

test("suggestion parser accepts a complete Dock and strips padding", () => {
  const parsed = parseSuggestion({
    ...valid,
    title: "  Quiet morning  ",
    company: "",
  });
  assert.equal(parsed.title, "Quiet morning");
  assert.deepEqual(parsed.apps, valid.apps);
});

test("suggestion parser rejects honeypots, unknown apps, and oversized names", () => {
  assert.throws(
    () => parseSuggestion({ ...valid, company: "spam" }),
    SuggestionError,
  );
  assert.throws(
    () => parseSuggestion({ ...valid, apps: ["not-an-app"] }),
    SuggestionError,
  );
  assert.throws(
    () => parseSuggestion({ ...valid, title: "x".repeat(61) }),
    SuggestionError,
  );
  assert.throws(
    () => parseSuggestion({ ...valid, group: "ads" }),
    SuggestionError,
  );
  assert.throws(
    () => parseSuggestion({ ...valid, apps: ["notes", "notes"] }),
    SuggestionError,
  );
});

test("suggestion mailto encodes title and apps as plain text", () => {
  const parsed = parseSuggestion(valid);
  const text = suggestionText(parsed);
  assert.match(text, /Quiet morning/);
  assert.match(text, /Notes, Calendar, Music/);
  assert.equal(
    suggestionMailto("owner@example.com", parsed).startsWith("mailto:"),
    true,
  );
  assert.equal(text.includes("<script>"), false);
});

test("suggest endpoint validates origin and returns copyable text without an inbox", async () => {
  const previous = process.env.SUGGESTION_INBOX;
  delete process.env.SUGGESTION_INBOX;
  try {
  const denied = await handler(
    new Request("http://127.0.0.1/api/suggest", {
      method: "POST",
      headers: {
        origin: "https://example.com",
        "content-type": "application/json",
      },
      body: JSON.stringify(valid),
    }),
  );
  assert.equal(denied.status, 403);

  const ok = await handler(
    new Request("http://127.0.0.1/api/suggest", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:5173",
        "content-type": "application/json",
      },
      body: JSON.stringify(valid),
    }),
  );
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.delivered, "copy");
  assert.match(body.text, /Quiet morning/);
  } finally {
    if (previous === undefined) delete process.env.SUGGESTION_INBOX;
    else process.env.SUGGESTION_INBOX = previous;
  }
});

test("suggest endpoint returns mailto when an inbox is configured", async () => {
  const previous = process.env.SUGGESTION_INBOX;
  process.env.SUGGESTION_INBOX = "owner@example.com";
  try {
    const ok = await handler(
      new Request("http://127.0.0.1/api/suggest", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:5173",
          "content-type": "application/json",
        },
        body: JSON.stringify(valid),
      }),
    );
    const body = await ok.json();
    assert.equal(ok.status, 200);
    assert.equal(body.delivered, "mailto");
    assert.match(body.mailto, /^mailto:/);
  } finally {
    if (previous === undefined) delete process.env.SUGGESTION_INBOX;
    else process.env.SUGGESTION_INBOX = previous;
  }
});
