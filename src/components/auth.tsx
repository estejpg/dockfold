import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { useEffect, useState, type ReactNode } from "react";
import { communityFetch } from "../lib/community";

export function AuthProvider({ children }: { children: ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key)
    return (
      <main id="main" tabIndex={-1} className="reading-page">
        <h1>Sign-in is temporarily unavailable.</h1>
        <p>
          Please try again later. You can still{" "}
          <a href="/create">create and share a Dock</a>.
        </p>
      </main>
    );
  return (
    <ClerkProvider
      publishableKey={key}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/requests"
      signUpFallbackRedirectUrl="/requests"
      telemetry={false}
      appearance={{
        variables: {
          fontFamily: "Inter Variable, sans-serif",
          colorPrimary: "#242933",
          borderRadius: "0.65rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
export function SignInPage({ signUp = false }: { signUp?: boolean }) {
  const redirect =
    new URLSearchParams(location.search).get("review") === "1"
      ? "/review"
      : "/requests";
  return (
    <main id="main" tabIndex={-1} className="auth-page">
      <h1>{signUp ? "Join with your email" : "Welcome back"}</h1>
      <p>One account, one vote per app. Your email stays private.</p>
      {signUp ? (
        <SignUp
          routing="hash"
          forceRedirectUrl={redirect}
          signInUrl="/sign-in"
        />
      ) : (
        <SignIn
          routing="hash"
          forceRedirectUrl={redirect}
          signUpUrl={`/sign-up${redirect === "/review" ? "?review=1" : ""}`}
        />
      )}
    </main>
  );
}
export function useCommunityAccount() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [account, setAccount] = useState<{
    reviewer: boolean;
    votes: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setAccount(null);
    setError("");
    if (isSignedIn)
      getToken()
        .then((token) =>
          communityFetch<{ reviewer: boolean; votes: string[] }>(
            "me",
            undefined,
            token,
          ),
        )
        .then((value) => {
          if (!cancelled) setAccount(value);
        })
        .catch(() => {
          if (!cancelled)
            setError("Your account couldn’t be loaded. Please try again.");
        });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, revision]);
  return {
    isLoaded,
    isSignedIn,
    getToken,
    account,
    setAccount,
    error,
    retry: () => setRevision((value) => value + 1),
  };
}
export function AccountControl() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  return isSignedIn ? (
    <button
      className="text-button"
      onClick={() => void signOut({ redirectUrl: "/requests" })}
    >
      Sign out
    </button>
  ) : (
    <a className="text-button" href="/sign-in">
      Sign in to vote
    </a>
  );
}
