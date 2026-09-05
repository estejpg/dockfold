import { createClerkClient } from "@clerk/backend";
import { HttpError, origins } from "./http.js";

let clerk: ReturnType<typeof createClerkClient> | undefined;
function client() {
  return (clerk ??= createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }));
}

// Clerk's session token can carry the verified primary email when the instance's
// session token template includes:
//   { "email": "{{user.primary_email_address}}", "email_verified": "{{user.email_verified}}" }
// The token is signed by Clerk, so a present and verified claim avoids a user
// lookup on every authenticated request. Without the claims the lookup remains.
export function emailFromClaims(claims: unknown) {
  if (!claims || typeof claims !== "object") return undefined;
  const { email, email_verified: verified } = claims as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    verified !== true
  )
    return undefined;
  return email.toLowerCase();
}

export function isReviewer(email: string) {
  return (process.env.DOCKFOLD_REVIEWER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

export async function identity(request: Request) {
  const state = await client().authenticateRequest(request, {
    authorizedParties: origins(),
    acceptsToken: "session_token",
  });
  const auth = state.toAuth();
  if (!auth?.userId)
    throw new HttpError("Sign in with email to continue.", 401);
  let email = emailFromClaims(auth.sessionClaims);
  if (!email) {
    const user = await client().users.getUser(auth.userId);
    email = user.emailAddresses
      .find(
        (e) =>
          e.id === user.primaryEmailAddressId &&
          e.verification?.status === "verified",
      )
      ?.emailAddress.toLowerCase();
  }
  if (!email) throw new HttpError("Verify your email before continuing.", 403);
  return { userId: auth.userId, reviewer: isReviewer(email) };
}
export async function requireReviewer(request: Request) {
  const user = await identity(request);
  if (!user.reviewer)
    throw new HttpError("This review area is for DockFold’s owner.", 403);
  return user;
}
