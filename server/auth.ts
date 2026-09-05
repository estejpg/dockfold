import { createClerkClient } from "@clerk/backend";
import { HttpError, origins } from "./http.js";

export async function identity(request: Request) {
  const client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  const state = await client.authenticateRequest(request, {
    authorizedParties: origins(),
    acceptsToken: "session_token",
  });
  const auth = state.toAuth();
  if (!auth?.userId)
    throw new HttpError("Sign in with email to continue.", 401);
  const user = await client.users.getUser(auth.userId);
  const email = user.emailAddresses
    .find(
      (e) =>
        e.id === user.primaryEmailAddressId &&
        e.verification?.status === "verified",
    )
    ?.emailAddress.toLowerCase();
  if (!email) throw new HttpError("Verify your email before continuing.", 403);
  const owners = (process.env.DOCKFOLD_REVIEWER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return { userId: user.id, reviewer: owners.includes(email) };
}
export async function requireReviewer(request: Request) {
  const user = await identity(request);
  if (!user.reviewer)
    throw new HttpError("This review area is for DockFold’s owner.", 403);
  return user;
}
