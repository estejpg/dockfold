import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Search, Trash2 } from "lucide-react";
import { catalog, MAX_APPS, moveApp } from "../lib/dock";
import { groups } from "../lib/collections";
import {
  parseSuggestion,
  suggestionText,
  SuggestionError,
} from "../lib/suggestion";
import { AppIcon, DockStrip } from "./common";

type Result = {
  delivered: "email" | "mailto" | "copy";
  text: string;
  mailto?: string;
};

export function Suggest() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState(groups[0]?.id ?? "everyday");
  const [apps, setApps] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [credit, setCredit] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const success = useRef<HTMLDivElement>(null);
  const visible = catalog.filter((app) =>
    app.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (result) success.current?.focus();
  }, [result]);

  function toggle(id: string) {
    setResult(null);
    setError("");
    setApps((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_APPS) {
        setError(`Choose up to ${MAX_APPS} apps.`);
        return current;
      }
      return [...current, id];
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const payload = {
      title,
      description,
      group,
      apps,
      notes,
      credit,
      email,
      company: new FormData(event.currentTarget).get("company"),
    };
    setError("");
    setCopied(false);
    try {
      parseSuggestion(payload);
    } catch (cause) {
      setError(
        cause instanceof SuggestionError
          ? cause.message
          : "Check the form and try again.",
      );
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.json().catch(() => null);
      if (
        response.ok &&
        body &&
        (body.delivered === "email" ||
          body.delivered === "mailto" ||
          body.delivered === "copy") &&
        typeof body.text === "string"
      ) {
        setResult({
          delivered: body.delivered,
          text: body.text,
          mailto:
            typeof body.mailto === "string" ? body.mailto : undefined,
        });
        return;
      }
      throw new Error(
        typeof body?.error === "string"
          ? body.error
          : "We couldn’t send that suggestion. Copy it below instead.",
      );
    } catch (cause) {
      setResult({
        delivered: "copy",
        text: suggestionText(parseSuggestion(payload)),
      });
      setError(
        cause instanceof Error
          ? cause.message
          : "Copy the suggestion and send it to DockFold.",
      );
    } finally {
      setSending(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (result?.delivered === "email")
    return (
      <main id="main" tabIndex={-1} className="suggest-page">
        <div className="suggest-success" ref={success} tabIndex={-1}>
          <h1>Suggestion received.</h1>
          <p>
            Every Dock gets a look before it joins the collection. Listing is
            not immediate.
          </p>
          <a className="button button-dark" href="/">
            Back to the gallery
          </a>
        </div>
      </main>
    );

  return (
    <main id="main" tabIndex={-1} className="suggest-page">
      <section className="suggest-intro">
        <h1>Submit a Dock</h1>
        <p>
          Know a setup that belongs in the gallery? Suggest it — every
          submission gets a look. Listing is not immediate.
        </p>
      </section>
      <form className="suggest-form" onSubmit={(event) => void submit(event)}>
        <label className="suggest-field">
          Dock name
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
            autoComplete="off"
          />
        </label>
        <label className="suggest-field">
          One-line description
          <input
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={180}
            required
            autoComplete="off"
            placeholder="What this Dock is for."
          />
        </label>
        <label className="suggest-field">
          Category
          <select
            name="group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="suggest-apps">
          <legend>Apps in this Dock</legend>
          <p className="field-help">
            Choose from the catalog, then use the arrows to set the order. Up
            to {MAX_APPS} apps.
          </p>
          <div
            className={`dock-preview ${apps.length ? "" : "is-empty"}`}
            aria-hidden={apps.length === 0}
          >
            {apps.length ? (
              <DockStrip ids={apps} compact />
            ) : (
              <p>Choose your first app.</p>
            )}
          </div>
          {apps.length ? (
            <ol className="selected-list" aria-label="Selected apps in Dock order">
              {apps.map((id, index) => {
                const app = catalog.find((item) => item.id === id);
                if (!app) return null;
                return (
                  <li key={id}>
                    <span className="order-number">{index + 1}</span>
                    <AppIcon app={app} size={32} />
                    <span className="selected-name">{app.name}</span>
                    <div className="order-controls">
                      <button
                        type="button"
                        aria-label={`Move ${app.name} earlier`}
                        disabled={index === 0}
                        onClick={() => setApps(moveApp(apps, id, -1))}
                      >
                        <ArrowLeft size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${app.name} later`}
                        disabled={index === apps.length - 1}
                        onClick={() => setApps(moveApp(apps, id, 1))}
                      >
                        <ArrowRight size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${app.name} from Dock`}
                        onClick={() => toggle(id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
          <label className="search-control">
            <Search size={16} />
            <span className="sr-only">Search apps</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps"
            />
          </label>
          <div className="suggest-app-grid" aria-label="Available apps">
            {visible.map((app) => (
              <button
                type="button"
                className="app-choice"
                aria-label={`${apps.includes(app.id) ? "Remove" : "Add"} ${app.name}`}
                aria-pressed={apps.includes(app.id)}
                key={app.id}
                onClick={() => toggle(app.id)}
              >
                <span className="choice-icon">
                  <AppIcon app={app} size={48} />
                  {apps.includes(app.id) ? (
                    <span className="selected-mark">
                      <Check size={12} />
                    </span>
                  ) : null}
                </span>
                <span>{app.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="suggest-field">
          Optional note
          <span className="optional-label">private to the reviewer</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Anything that helps review this Dock."
          />
        </label>
        <label className="suggest-field">
          How should we credit you?
          <span className="optional-label">optional</span>
          <input
            name="credit"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            maxLength={80}
            autoComplete="nickname"
            placeholder="A name or site"
          />
        </label>
        <label className="suggest-field">
          Email
          <span className="optional-label">optional, in case of questions</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            autoComplete="email"
          />
        </label>
        <label className="icon-honeypot">
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button button-dark" disabled={sending} type="submit">
          {sending ? "Sending…" : "Submit Dock"}
        </button>
      </form>
      {result ? (
        <section
          className="suggest-fallback"
          ref={success}
          tabIndex={-1}
          aria-label="Suggestion ready to send"
        >
          <h2>
            {result.delivered === "mailto"
              ? "Open your email app to send this."
              : "Copy the suggestion to send it."}
          </h2>
          <p>
            {result.delivered === "mailto"
              ? "Your mail app will carry the Dock name, category, and apps. Listing is not immediate."
              : "This deployment has no inbox configured yet. Copy the text and send it to the DockFold owner."}
          </p>
          <textarea readOnly value={result.text} rows={8} />
          <div className="share-actions">
            {result.mailto ? (
              <a className="button button-dark" href={result.mailto}>
                Open email app
              </a>
            ) : null}
            <button
              className="button"
              type="button"
              onClick={() => void copyText(result.text)}
            >
              <Copy size={15} />
              {copied ? "Copied" : "Copy suggestion"}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
