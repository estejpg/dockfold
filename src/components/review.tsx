import { useEffect, useState } from "react";
import {
  APP_CATEGORIES,
  communityFetch,
  type ReviewInbox,
  type ReviewIcon,
  type ReviewRequest,
} from "../lib/community";
import { AccountControl, AuthProvider, useCommunityAccount } from "./auth";

type Perform = (action: string, body: object) => Promise<void>;
function PrivateImage({
  icon,
  getToken,
}: {
  icon: ReviewIcon;
  getToken: () => Promise<string | null>;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false,
      objectURL = "";
    setError(false);
    getToken()
      .then((token) =>
        fetch(`/api/community?action=private-icon&id=${icon.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(25_000),
        }),
      )
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectURL = URL.createObjectURL(blob);
          setUrl(objectURL);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [icon.id, getToken, revision]);
  return error ? (
    <button
      className="text-button"
      onClick={() => setRevision((value) => value + 1)}
    >
      Retry icon preview
    </button>
  ) : url ? (
    <img
      className="review-icon-preview"
      src={url}
      alt="Submitted app icon"
      width={96}
      height={96}
    />
  ) : (
    <p role="status">Loading icon…</p>
  );
}
function ReviewCard({
  row,
  images,
  perform,
  busy,
  getToken,
}: {
  row: ReviewRequest;
  images: ReviewIcon[];
  perform: Perform;
  busy: boolean;
  getToken: () => Promise<string | null>;
}) {
  const [category, setCategory] = useState<string>("Utilities");
  const [targetId, setTargetId] = useState(""),
    [search, setSearch] = useState("");
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]),
    [targetError, setTargetError] = useState("");
  async function findTargets() {
    setTargetError("");
    setTargetId("");
    try {
      const data = await communityFetch<{
        requests: { id: string; name: string }[];
      }>("targets", undefined, await getToken(), { q: search });
      setTargets(data.requests.filter((item) => item.id !== row.id));
    } catch (e) {
      setTargetError(e instanceof Error ? e.message : "Please try again.");
    }
  }
  return (
    <article className="review-card">
      <div className="section-heading">
        <h2>{row.name}</h2>
        <span className="review-status">{row.status}</span>
      </div>
      <a href={row.website} target="_blank" rel="noreferrer">
        Official website ↗<span className="sr-only"> opens a new tab</span>
      </a>
      <p className="fine-print">
        Received {new Date(row.createdAt).toLocaleDateString()}
      </p>
      {row.notes ? <p className="review-notes">{row.notes}</p> : null}
      <fieldset disabled={busy}>
        <div className="review-actions">
          {row.status !== "included" && row.status !== "merged" ? (
            <>
              <button
                className="button"
                disabled={row.status === "open"}
                onClick={() =>
                  void perform("review-status", {
                    id: row.id,
                    revision: row.revision,
                    status: "open",
                  })
                }
              >
                Approve for votes
              </button>
              <button
                className="text-button"
                disabled={row.status === "declined"}
                onClick={() =>
                  void perform("review-status", {
                    id: row.id,
                    revision: row.revision,
                    status: "declined",
                  })
                }
              >
                Decline request
              </button>
            </>
          ) : null}
        </div>
        {images.length ? (
          <>
            <h3>Contributed icons</h3>
            <label className="review-category">
              Publish in category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {APP_CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="review-icons">
              {images.map((icon) => (
                <div className="review-icon" key={icon.id}>
                  <PrivateImage icon={icon} getToken={getToken} />
                  <div>
                    <p>
                      {icon.source} · {icon.width}px · {icon.status}
                    </p>
                    {icon.notes ? (
                      <p className="review-notes">{icon.notes}</p>
                    ) : null}
                    {icon.status !== "declined" && row.status !== "merged" ? (
                      <div className="review-actions">
                        <button
                          className="button button-dark"
                          onClick={() =>
                            void perform("publish", {
                              id: row.id,
                              iconId: icon.id,
                              revision: row.revision,
                              category,
                            })
                          }
                        >
                          Publish icon
                        </button>
                        {icon.status === "pending" ? (
                          <button
                            className="text-button"
                            onClick={() =>
                              void perform("decline-icon", { iconId: icon.id })
                            }
                          >
                            Decline icon
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <p className="fine-print">
              Publishing adds the app and its optimized icon to the public
              catalog. Original uploads and notes remain private.
            </p>
          </>
        ) : (
          <p className="board-help">
            No icon yet. You can approve the request for votes while waiting for
            a contribution.
          </p>
        )}
        {!["included", "merged"].includes(row.status) ? (
          <details className="merge-details">
            <summary>Merge a duplicate</summary>
            <p>
              Move its icons and votes into another request. Votes from the same
              account count once.
            </p>
            <label>
              Find the existing app
              <input
                value={search}
                maxLength={80}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="button" onClick={() => void findTargets()}>
              Find requests
            </button>
            {targetError ? (
              <p role="alert" className="form-error">
                {targetError}
              </p>
            ) : null}
            <label>
              Merge into
              <select
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                <option value="">Choose a request</option>
                {targets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button"
              disabled={!targetId}
              onClick={() =>
                void perform("merge", {
                  id: row.id,
                  targetId,
                  revision: row.revision,
                })
              }
            >
              Merge request
            </button>
          </details>
        ) : null}
      </fieldset>
    </article>
  );
}
function ReviewPage() {
  const account = useCommunityAccount();
  const { getToken, account: currentAccount } = account;
  const [inbox, setInbox] = useState<ReviewInbox | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [status, setStatus] = useState("pending"),
    [offset, setOffset] = useState(0),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!currentAccount?.reviewer) return;
    setLoading(true);
    setError("");
    getToken()
      .then((token) =>
        communityFetch<ReviewInbox>("review", undefined, token, {
          status,
          offset: String(offset),
        }),
      )
      .then((value) => {
        if (!cancelled) setInbox(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentAccount?.reviewer, getToken, status, offset, revision]);
  async function perform(action: string, body: object) {
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await communityFetch(action, body, await account.getToken());
      setNotice("Saved. The review list is updating.");
      setRevision((value) => value + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The change couldn’t be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main id="main" tabIndex={-1} className="review-page">
      <section className="page-intro">
        <h1>Review submissions</h1>
        <p>
          A private inbox for requests and icons. You decide what joins the
          collection.
        </p>
        <AccountControl />
      </section>
      {!account.isLoaded ||
      (account.isSignedIn && !account.account && !account.error) ? (
        <p role="status">Checking your account…</p>
      ) : !account.isSignedIn ? (
        <p>
          <a className="button button-dark" href="/sign-in?review=1">
            Sign in as the owner
          </a>
        </p>
      ) : account.error ? (
        <p role="alert" className="form-error">
          {account.error} <button onClick={account.retry}>Retry</button>
        </p>
      ) : !account.account?.reviewer ? (
        <p>
          This review area is for DockFold’s owner.{" "}
          <a href="/requests">Explore app requests</a>.
        </p>
      ) : (
        <>
          <div className="review-toolbar">
            <label>
              Show
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setOffset(0);
                  setInbox(null);
                }}
              >
                {["pending", "open", "included", "declined", "merged"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value === "pending" ? "Needs review" : value}
                    </option>
                  ),
                )}
              </select>
            </label>
            <button
              className="button"
              disabled={loading || saving}
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh inbox
            </button>
          </div>
          {error ? (
            <p role="alert" className="form-error">
              {error}
            </p>
          ) : null}
          <p role="status" className="status-message">
            {loading ? "Updating the inbox…" : notice}
          </p>
          {inbox?.requests.map((row) => (
            <ReviewCard
              key={row.id}
              row={row}
              images={inbox.icons.filter((icon) => icon.requestId === row.id)}
              perform={perform}
              busy={saving || loading}
              getToken={account.getToken}
            />
          ))}
          {inbox && !inbox.requests.length ? (
            <div className="empty-results">
              <h2>All clear here.</h2>
              <p>No submissions in this view.</p>
            </div>
          ) : null}
          <div className="pagination">
            {offset > 0 ? (
              <button
                className="button"
                disabled={loading}
                onClick={() => setOffset((value) => Math.max(0, value - 25))}
              >
                Previous
              </button>
            ) : null}
            {inbox?.more ? (
              <button
                className="button"
                disabled={loading}
                onClick={() => setOffset((value) => value + 25)}
              >
                Next submissions
              </button>
            ) : null}
          </div>
          {inbox?.catalog.length ? (
            <section className="review-catalog">
              <h2>Published additions</h2>
              <p>
                Hiding an app removes it from the picker. Existing shared Docks
                keep working.
              </p>
              {inbox.catalog.map((app) => (
                <div key={app.id}>
                  <img src={app.icon} alt="" width={40} height={40} />
                  <span>
                    {app.name} · {app.active ? "In the picker" : "Hidden"}
                  </span>
                  <button
                    className="button"
                    disabled={saving}
                    onClick={() =>
                      void perform("visibility", {
                        id: app.id,
                        active: !app.active,
                      })
                    }
                  >
                    {app.active ? "Hide from picker" : "Show in picker"}
                  </button>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
export default function Review() {
  return (
    <AuthProvider>
      <ReviewPage />
    </AuthProvider>
  );
}
