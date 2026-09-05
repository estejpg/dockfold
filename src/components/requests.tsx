import { ArrowUpRight, RefreshCw, Search, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { communityFetch, type PublicRequest } from "../lib/community";
import { AccountControl, AuthProvider, useCommunityAccount } from "./auth";

function RequestForm({ onSaved }: { onSaved: () => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{
    existing?: string;
    existingName?: string;
  } | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (receipt) confirmation.current?.focus();
  }, [receipt]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      setReceipt(await communityFetch("request", Object.fromEntries(form)));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="request-app"
      className="community-form"
      aria-labelledby="request-form-title"
    >
      <h2 id="request-form-title">Request an app</h2>
      {receipt ? (
        <div
          className="submission-confirmation"
          ref={confirmation}
          tabIndex={-1}
        >
          <h3>
            {receipt.existing
              ? "This app is already on the list."
              : "Thanks. Your request is in the inbox."}
          </h3>
          <p>
            {receipt.existing
              ? "You can vote for it or contribute an icon."
              : "Esteban will review it before it appears on the leaderboard. You don’t need an icon to request an app."}
          </p>
          {receipt.existing ? (
            <a
              className="text-button"
              href={`/requests?q=${encodeURIComponent(receipt.existingName || "")}#request-${receipt.existing}`}
            >
              View request
            </a>
          ) : null}
          <button className="button" onClick={() => setReceipt(null)}>
            Request another app
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p>
            Check the list first, then suggest an app that’s missing. No account
            needed.
          </p>
          <fieldset disabled={busy}>
            <label>
              App name
              <input name="name" required maxLength={80} autoComplete="off" />
            </label>
            <label>
              Official website
              <input
                name="website"
                type="url"
                required
                maxLength={500}
                placeholder="https://"
              />
            </label>
            <label>
              Anything we should know?{" "}
              <span className="optional-label">Optional</span>
              <textarea name="notes" maxLength={1000} rows={3} />
            </label>
            <div className="honeypot" aria-hidden="true">
              <label>
                Company
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <p className="fine-print">
              Your notes stay private. Approved app names and websites appear on
              the public list.
            </p>
            <button className="button button-dark" type="submit">
              {busy ? "Sending…" : "Send request"}
            </button>
          </fieldset>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

function RequestsPage() {
  const account = useCommunityAccount();
  const [rows, setRows] = useState<PublicRequest[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [query, setQuery] = useState(() =>
      (new URLSearchParams(location.search).get("q") || "").slice(0, 80),
    ),
    [offset, setOffset] = useState(0),
    [more, setMore] = useState(false),
    [revision, setRevision] = useState(0);
  const [voting, setVoting] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError("");
    const timer = setTimeout(
      () => {
        communityFetch<{ requests: PublicRequest[]; more: boolean }>(
          "board",
          undefined,
          undefined,
          { q: query, offset: String(offset) },
        )
          .then((board) => {
            if (!cancelled) {
              setRows(board.requests);
              setMore(board.more);
              setLoaded(true);
            }
          })
          .catch((e) => {
            if (!cancelled) setError(e.message);
          })
          .finally(() => {
            if (!cancelled) setBusy(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, offset, revision]);
  async function vote(row: PublicRequest) {
    if (!account.isSignedIn) {
      location.assign("/sign-in");
      return;
    }
    if (!account.account || voting) return;
    setVoting(row.id);
    setNotice("");
    try {
      const result = await communityFetch<{
        id: string;
        votes: number;
        voted: boolean;
      }>(
        "vote",
        { id: row.id, voted: !account.account.votes.includes(row.id) },
        await account.getToken(),
      );
      account.setAccount((previous) =>
        previous
          ? {
              ...previous,
              votes: [
                ...previous.votes.filter((id) => id !== row.id),
                ...(result.voted ? [row.id] : []),
              ],
            }
          : previous,
      );
      setRows((previous) =>
        previous
          .map((item) =>
            item.id === row.id ? { ...item, votes: result.votes } : item,
          )
          .sort(
            (a, b) =>
              b.votes - a.votes ||
              Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
              a.id.localeCompare(b.id),
          ),
      );
      setNotice(
        result.voted
          ? `Vote saved for ${row.name}.`
          : `Vote removed for ${row.name}.`,
      );
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Your vote couldn’t be saved.",
      );
    } finally {
      setVoting(null);
    }
  }
  return (
    <main id="main" tabIndex={-1} className="requests-page">
      <section className="page-intro">
        <h1>What belongs in the Dock next?</h1>
        <p>
          Request an app. Vote for your favorites. Help the collection grow.
        </p>
        <div className="intro-actions">
          <a className="button button-dark" href="#request-app">
            Request an app
          </a>
          <a className="text-button" href="/contribute">
            Contribute an icon <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="account-control">
          <AccountControl />
          {account.account?.reviewer ? (
            <a href="/review" className="text-button">
              Review submissions
            </a>
          ) : null}
        </div>
      </section>
      <section className="request-board" aria-labelledby="requests-title">
        <div className="section-heading">
          <h2 id="requests-title">Most requested</h2>
          <button
            className="text-button refresh-button"
            disabled={busy}
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={15} />
            {busy ? "Updating…" : "Refresh"}
          </button>
        </div>
        <p className="board-help">
          Sign in with email to add or remove your vote. One vote per account,
          per app.
        </p>
        <label className="search-control">
          <Search size={18} />
          <span className="sr-only">Search app requests</span>
          <input
            type="search"
            maxLength={80}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOffset(0);
            }}
            placeholder="Check if your app is already requested"
          />
        </label>
        {error ? (
          <p role="alert" className="form-error">
            {error} {loaded ? "Previously loaded requests are shown." : ""}
          </p>
        ) : null}
        {account.error ? (
          <p role="alert" className="form-error">
            {account.error}{" "}
            <button className="text-button" onClick={account.retry}>
              Retry account
            </button>
          </p>
        ) : null}
        {busy && !loaded ? (
          <p role="status" className="loading-state">
            Loading app requests…
          </p>
        ) : null}
        <ol className="request-list">
          {rows.map((row, index) => (
            <li key={row.id} id={`request-${row.id}`}>
              <span className="request-rank">
                {String(offset + index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>
                  <a href={row.website} target="_blank" rel="noreferrer">
                    {row.name}
                    <span className="sr-only">
                      {" "}
                      official website, opens a new tab
                    </span>
                  </a>
                </h3>
                <span>
                  {row.status === "included"
                    ? "Included in the catalog"
                    : "Open for votes"}
                </span>
              </div>
              <button
                className="vote-link"
                aria-pressed={account.account?.votes.includes(row.id) || false}
                aria-label={`${account.account?.votes.includes(row.id) ? "Remove vote for" : "Vote for"} ${row.name}, ${row.votes} votes`}
                disabled={
                  row.status === "included" ||
                  !!voting ||
                  !account.isLoaded ||
                  !!(account.isSignedIn && !account.account)
                }
                onClick={() => void vote(row)}
              >
                <ThumbsUp size={16} />
                <strong>{row.votes}</strong>
              </button>
            </li>
          ))}
        </ol>
        {loaded && !busy && !rows.length ? (
          <div className="empty-results">
            <h3>
              {query ? "No matching requests." : "The next app could be yours."}
            </h3>
            <p>
              {query
                ? "Try another spelling, or send a request below."
                : "Reviewed requests will appear here. Start with an app you use."}
            </p>
          </div>
        ) : null}
        <p className="status-message" role="status">
          {notice}
        </p>
        <div className="pagination">
          {offset > 0 ? (
            <button
              className="button"
              disabled={busy}
              onClick={() => setOffset((value) => Math.max(0, value - 50))}
            >
              Previous
            </button>
          ) : null}
          {more ? (
            <button
              className="button"
              disabled={busy}
              onClick={() => setOffset((value) => value + 50)}
            >
              Next requests
            </button>
          ) : null}
        </div>
      </section>
      <RequestForm onSaved={() => setRevision((value) => value + 1)} />
    </main>
  );
}
export default function Requests() {
  return (
    <AuthProvider>
      <RequestsPage />
    </AuthProvider>
  );
}
