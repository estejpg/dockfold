import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ImagePlus, X } from "lucide-react";
import {
  ICON_SOURCES,
  MAX_ICON_BYTES,
  iconSizeError,
} from "../lib/icon-upload";
import { REQUEST_URL } from "../lib/requests";

type SelectedIcon = {
  file: File;
  preview: string;
  width: number;
  height: number;
};

export function Contribute() {
  const [icon, setIcon] = useState<SelectedIcon | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef(0);
  const success = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (receipt) success.current?.focus();
  }, [receipt]);

  async function choose(files: FileList | null) {
    const chosen = Array.from(files || []);
    const current = ++selection.current;
    setFileError("");
    setIcon(null);
    setChecking(false);
    if (input.current) input.current.value = "";
    if (!chosen.length) return;
    if (chosen.length !== 1) {
      setFileError("Choose one app icon at a time.");
      return;
    }
    const file = chosen[0];
    if (
      file.type !== "image/png" ||
      !file.name.toLowerCase().endsWith(".png")
    ) {
      setFileError(
        "Choose a PNG image. You can export one using the guide below.",
      );
      return;
    }
    if (file.size > MAX_ICON_BYTES || file.size === 0) {
      setFileError("Choose a PNG smaller than 2 MB.");
      return;
    }
    setChecking(true);
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("This file couldn’t be read. Choose it again."));
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = preview;
      await image.decode();
      const dimensionError = iconSizeError(
        image.naturalWidth,
        image.naturalHeight,
      );
      if (dimensionError) throw new Error(dimensionError);
      if (current === selection.current)
        setIcon({
          file,
          preview,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
    } catch (cause) {
      if (current === selection.current)
        setFileError(
          cause instanceof Error && cause.name !== "EncodingError"
            ? cause.message
            : "This PNG couldn’t be opened. Export it again in Preview.",
        );
    } finally {
      if (current === selection.current) setChecking(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || checking) return;
    if (!icon) {
      setFileError("Choose an app icon before submitting.");
      input.current?.focus();
      return;
    }
    const data = new FormData(event.currentTarget);
    data.set("icon", icon.file);
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/icon-submissions", {
        method: "POST",
        body: data,
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 429)
        throw new Error(
          "You’ve reached the upload limit. Please try again in 10 minutes.",
        );
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.receipt !== "string")
        throw new Error(
          result?.error ||
            "We couldn’t confirm your upload. Your form is still here; please try again.",
        );
      setReceipt(result.receipt);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "Error"
          ? cause.message
          : "We couldn’t confirm your upload. Your form is still here; please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main id="main" tabIndex={-1} className="contribute-page">
      <header className="contribute-intro">
        <h1>Contribute an icon</h1>
        <p>
          Bring an app to the collection. Send its details and a clear PNG —
          we’ll take a look.
        </p>
      </header>

      {receipt ? (
        <div className="icon-success" role="status" tabIndex={-1} ref={success}>
          <Check size={24} aria-hidden="true" />
          <h2>Your icon is in the review inbox.</h2>
          <p>
            Thanks for helping the collection grow. Esteban will review it
            before adding it to the picker.
          </p>
          <p className="fine-print">
            Reference: {receipt}. This submission is private and isn’t a public
            app request.
          </p>
          <button
            className="button"
            type="button"
            onClick={() => {
              setReceipt("");
              setIcon(null);
              setFileError("");
              setError("");
            }}
          >
            Contribute another icon
          </button>
        </div>
      ) : (
        <form className="icon-form" onSubmit={submit}>
          <fieldset disabled={sending}>
            <div className="icon-field">
              <label htmlFor="app-name">
                App name <span aria-hidden="true">*</span>
              </label>
              <input
                id="app-name"
                name="appName"
                required
                maxLength={80}
                placeholder="e.g. Things 3"
                autoComplete="off"
              />
            </div>
            <div className="icon-field">
              <label htmlFor="app-website">
                Official website <span aria-hidden="true">*</span>
              </label>
              <input
                id="app-website"
                name="website"
                type="url"
                required
                maxLength={500}
                placeholder="https://"
                autoComplete="url"
              />
            </div>
            <div className="icon-field">
              <label htmlFor="icon-file">
                App icon <span aria-hidden="true">*</span>
              </label>
              <div
                className={`icon-upload${dragging ? " is-dragging" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!sending) setDragging(true);
                }}
                onDragLeave={(event) => {
                  if (
                    !(event.relatedTarget instanceof Node) ||
                    !event.currentTarget.contains(event.relatedTarget)
                  )
                    setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (!sending) void choose(event.dataTransfer.files);
                }}
              >
                {icon ? (
                  <img
                    src={icon.preview}
                    width={64}
                    height={64}
                    alt="Selected app icon preview"
                  />
                ) : (
                  <ImagePlus size={27} strokeWidth={1.4} aria-hidden="true" />
                )}
                <div className="icon-upload-copy">
                  <label
                    className="button icon-file-button"
                    htmlFor="icon-file"
                  >
                    {icon ? "Change image…" : "Choose an image…"}
                  </label>
                  <input
                    ref={input}
                    id="icon-file"
                    className="icon-file-input"
                    type="file"
                    accept="image/png,.png"
                    aria-required="true"
                    aria-invalid={!!fileError}
                    aria-describedby="icon-help icon-file-status"
                    onChange={(event) => {
                      // Copy the FileList before clearing the native input for reselection.
                      const files = event.currentTarget.files;
                      if (files?.length) void choose(files);
                    }}
                  />
                  <p>{icon ? icon.file.name : "or drop your PNG here"}</p>
                  {icon && (
                    <p>
                      {icon.width} × {icon.height} ·{" "}
                      {Math.max(1, Math.round(icon.file.size / 1024))} KB
                    </p>
                  )}
                </div>
                {icon && (
                  <button
                    className="icon-remove"
                    type="button"
                    aria-label="Remove selected icon"
                    onClick={() => {
                      ++selection.current;
                      setIcon(null);
                      setFileError("");
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p id="icon-help" className="field-help">
                Square PNG, up to 2 MB. 256–2048 pixels; 512 or larger is ideal.
                Keep transparency.{" "}
                <a href="#export-guide">Need help exporting?</a>
              </p>
              <p
                id="icon-file-status"
                className={fileError ? "form-error" : "field-help"}
                role={fileError ? "alert" : "status"}
              >
                {fileError || (checking ? "Checking your image…" : "")}
              </p>
            </div>
            <div className="icon-field">
              <label htmlFor="icon-source">Where did the icon come from?</label>
              <select id="icon-source" name="source">
                {ICON_SOURCES.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </div>
            <div className="icon-field">
              <label htmlFor="icon-notes">
                Anything else? <span className="optional-label">Optional</span>
              </label>
              <textarea
                id="icon-notes"
                name="notes"
                maxLength={1000}
                rows={3}
                placeholder="An icon source link, app version, or anything that helps us review it."
              />
            </div>
            <div className="icon-honeypot" aria-hidden="true">
              <label htmlFor="company">Leave this field empty</label>
              <input
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="upload-destination">
              <h2>Where does it go?</h2>
              <p>
                Your icon and app details go to DockFold’s private review inbox,
                hosted on Vercel. Esteban reviews submissions before publishing
                approved icons. No account needed.
              </p>
              <p>
                Uploads don’t create GitHub requests or votes.{" "}
                <a href="/requests">Use App requests</a> for the public board.
              </p>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button button-dark icon-submit"
              type="submit"
              disabled={checking}
            >
              {sending ? "Submitting…" : "Submit icon"}
            </button>
            <p className="field-help">
              By submitting, you’re sharing this app icon for review and
              possible inclusion in DockFold. <a href="/privacy">Privacy</a>
            </p>
          </fieldset>
        </form>
      )}

      <section
        className="icon-export-guide"
        id="export-guide"
        aria-labelledby="guide-heading"
      >
        <h2 id="guide-heading">Get an icon from your Mac</h2>
        <p>A minute in Finder and Preview is all it takes.</p>
        <ol className="guide-steps">
          <li>
            <h3>Find the app</h3>
            <p>
              Open Finder → Applications. Select the app, then choose Get Info
              or press <kbd>⌘ I</kbd>.
            </p>
          </li>
          <li>
            <h3>Copy its icon</h3>
            <p>
              Click the small app icon at the top-left of the Get Info window.
              Press <kbd>⌘ C</kbd> to copy it.
            </p>
          </li>
          <li>
            <h3>Open it in Preview</h3>
            <p>
              Open Preview, then choose File → New from Clipboard or press{" "}
              <kbd>⌘ N</kbd>. If several sizes appear, select the largest image
              in the thumbnail sidebar.
            </p>
          </li>
          <li>
            <h3>Export a PNG</h3>
            <p>
              Choose File → Export (or right-click the selected thumbnail and
              choose Export As). Select PNG and keep transparency enabled. A
              square image at 512 × 512 pixels or larger works well. If it’s
              over 2 MB or 2048 pixels, use Tools → Adjust Size, then export
              again.
            </p>
          </li>
          <li>
            <h3>Send it here</h3>
            <p>
              Choose your PNG in the form above, add the app’s name and official
              website, then select Submit icon. Keep this page open until you
              see your confirmation.
            </p>
          </li>
        </ol>
        <p className="field-help">
          Icon export options can vary by macOS version and app. If export is
          unavailable,{" "}
          <a href={REQUEST_URL} target="_blank" rel="noreferrer">
            request the app on GitHub
          </a>{" "}
          without an icon. You can also attach a PNG to an existing GitHub
          request if you prefer a public contribution.
        </p>
      </section>
    </main>
  );
}
