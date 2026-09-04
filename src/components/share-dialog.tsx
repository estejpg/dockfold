"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, Check, Download, X } from "lucide-react";
import { appCatalog } from "@/lib/apps";
import { encodeDock } from "@/lib/manifest";

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const demoHref = useMemo(() => {
    const dock = encodeDock({
      v: 1,
      apps: [appCatalog.safari, appCatalog.figma, appCatalog.notion, appCatalog.slack, appCatalog.vscode, appCatalog.spotify],
    });
    return `/share#dock=${dock}`;
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="share-dialog" aria-labelledby="share-title" onClose={onClose} onCancel={onClose}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close share dialog">
        <X size={20} />
      </button>
      <div className="share-copy">
        <p className="step-label">1. Capture <span>2. Review</span> <span>3. Share</span></p>
        <h2 id="share-title">Bring your Dock<br />to the web.</h2>
        <p className="share-lede">DockFold reads your pinned apps and lets you choose what to include. Review the details in your browser, then create an unlisted link.</p>
        <div className="share-actions">
          <a
            className="button button-dark"
            href="/downloads/DockFold.zip"
          >
            <Download size={16} /> Download for Mac
          </a>
          <a className="button button-line" href={demoHref} onClick={onClose}>
            Try the flow <ArrowUpRight size={16} />
          </a>
        </div>
        <p className="build-note">macOS 14+ · Apple silicon & Intel · Personal-use build</p>
      </div>
      <div className="capture-preview" aria-label="DockFold preview">
        <div className="preview-titlebar"><i /><i /><i /><span>DockFold</span></div>
        <div className="preview-body">
          <p className="preview-kicker">6 apps detected</p>
          <h3>Review your Dock</h3>
          <div className="preview-list">
            {[appCatalog.safari, appCatalog.figma, appCatalog.notion, appCatalog.slack, appCatalog.vscode, appCatalog.spotify].map((app) => (
              <div key={app.name}><span>{app.name}</span><Check size={14} /></div>
            ))}
          </div>
          <div className="preview-button">Continue in browser</div>
        </div>
      </div>
    </dialog>
  );
}
