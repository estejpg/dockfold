import test from "node:test";
import assert from "node:assert/strict";
import { emailFromClaims, isReviewer } from "../server/auth";

test("session claims supply the email only when present, plausible and verified", () => {
  assert.equal(
    emailFromClaims({ email: "Owner@Example.com", email_verified: true }),
    "owner@example.com",
  );
  for (const claims of [
    undefined,
    null,
    "owner@example.com",
    {},
    { email: "owner@example.com" },
    { email: "owner@example.com", email_verified: "true" },
    { email: "owner@example.com", email_verified: false },
    { email: "not an email", email_verified: true },
    { email: 42, email_verified: true },
    { email: `${"a".repeat(250)}@example.com`, email_verified: true },
  ])
    assert.equal(emailFromClaims(claims), undefined, JSON.stringify(claims));
});

test("the reviewer allowlist is server-controlled, trimmed and case-insensitive", (t) => {
  const previous = process.env.DOCKFOLD_REVIEWER_EMAILS;
  t.after(() => {
    if (previous === undefined) delete process.env.DOCKFOLD_REVIEWER_EMAILS;
    else process.env.DOCKFOLD_REVIEWER_EMAILS = previous;
  });
  process.env.DOCKFOLD_REVIEWER_EMAILS = " Owner@Example.com ,, second@example.com";
  assert.equal(isReviewer("owner@example.com"), true);
  assert.equal(isReviewer("second@example.com"), true);
  assert.equal(isReviewer("voter@example.com"), false);
  process.env.DOCKFOLD_REVIEWER_EMAILS = "";
  assert.equal(isReviewer("owner@example.com"), false);
  assert.equal(isReviewer(""), false);
});
