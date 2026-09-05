import { ArrowUpRight, RefreshCw, Search, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BOARD_URL,
  cachedBoard,
  fetchBoard,
  REPOSITORY,
  REQUEST_URL,
  type RequestBoard,
} from "../lib/requests";
export default function Requests() {
  const [board, setBoard] = useState<RequestBoard | undefined>(cachedBoard),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchBoard(controller.signal, revision > 0)
      .then(setBoard)
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Could not load requests.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  const visible =
    board?.requests.filter((request) =>
      request.name.toLowerCase().includes(query.trim().toLowerCase()),
    ) ?? [];
  return (
    <main id="main" className="requests-page">
      <section className="page-intro">
        <h1>What belongs in the Dock next?</h1>
        <p>
          Request an app. Vote for your favorites. Help the collection grow.
        </p>
        <div className="intro-actions">
          <a
            className="button button-dark"
            href={REQUEST_URL}
            target="_blank"
            rel="noreferrer"
          >
            Request an app <ArrowUpRight size={16} />
            <span className="sr-only"> on GitHub, opens a new tab</span>
          </a>
          <a className="text-button" href="#/contribute">
            Have an icon to contribute? <ArrowUpRight size={16} />
          </a>
        </div>
        <p className="fine-print">
          Requests and votes use GitHub. An account is needed to contribute.
        </p>
      </section>
      <section className="request-board" aria-labelledby="requests-title">
        <div className="section-heading">
          <h2 id="requests-title">Most requested</h2>
          <button
            className="text-button refresh-button"
            disabled={loading}
            onClick={() => setRevision((r) => r + 1)}
          >
            <RefreshCw size={15} />
            {loading ? "Updating…" : "Refresh votes"}
          </button>
        </div>
        <p className="board-help">
          Open a request and add a 👍 reaction to the first post to vote. One
          vote per GitHub account.
        </p>
        <label className="search-control">
          <Search size={18} />
          <span className="sr-only">Search app requests</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Check if your app is already requested"
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {loading && !board ? (
          <p className="loading-state" role="status">
            Loading app requests…
          </p>
        ) : null}
        {board ? (
          <>
            <ol className="request-list">
              {visible.map((request, index) => (
                <li key={request.number}>
                  <span className="request-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>
                      <a
                        href={`https://github.com/${REPOSITORY}/issues/${request.number}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {request.name}
                        <span className="sr-only">
                          {" "}
                          on GitHub, opens a new tab
                        </span>
                      </a>
                    </h3>
                    <span>Request #{request.number}</span>
                  </div>
                  <a
                    className="vote-link"
                    href={`https://github.com/${REPOSITORY}/issues/${request.number}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Vote for ${request.name} on GitHub, ${request.votes} votes, opens a new tab`}
                  >
                    <ThumbsUp size={16} />
                    <strong>{request.votes}</strong>
                    <ArrowUpRight size={14} />
                  </a>
                </li>
              ))}
            </ol>
            {!visible.length ? (
              <div className="empty-results">
                <h3>
                  {query
                    ? "No matching requests."
                    : "The next app could be yours."}
                </h3>
                <p>
                  {query
                    ? "Try another spelling, or suggest the app on GitHub."
                    : "No open app requests yet. Start the list with an app you use."}
                </p>
                <a
                  className="text-button"
                  href={REQUEST_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Request an app <ArrowUpRight size={16} />
                </a>
              </div>
            ) : null}
            <p className="fine-print">
              {error ? "Showing previously loaded votes. " : ""}Last updated{" "}
              {new Date(board.fetchedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              . {board.truncated ? "Showing the first 500 open requests. " : ""}
              New visits reuse votes for up to five minutes.
            </p>
          </>
        ) : null}
        <a
          className="text-button"
          href={BOARD_URL}
          target="_blank"
          rel="noreferrer"
        >
          View all requests on GitHub <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="request-note">
        <h2>A small contribution goes a long way.</h2>
        <p>
          Add the app’s website and, if you have it, a PNG of its icon to your
          request. Esteban reviews requests and adds icons to the collection.
        </p>
        <a href="#/contribute" className="text-button">
          How to export an app icon <ArrowUpRight size={16} />
        </a>
      </section>
    </main>
  );
}
