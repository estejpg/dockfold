"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, Check, Github, X } from "lucide-react";
import { appCatalog } from "@/lib/apps";
import { encodeDock } from "@/lib/manifest";

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const demoHref = useMemo(() => {
    const dock = encodeDock({
      v: 1,
      apps: [appCatalog.safari, appCatalog.figma, appCatalog.notion, appCatalog.slack, appCatalog.vscode, appCatalog.spotify],
    });
    return `/share?dock=${dock}`;
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="share-dialog" onClose={onClose} onCancel={onClose}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close share dialog">
        <X size={20} />
      </button>
      <div className="share-copy">
        <p className="step-label">1. Capture <span>2. Review</span> <span>3. Share</span></p>
        <h2>Bring your Dock<br />to the web.</h2>
        <p className="share-lede">Dockfold Capture reads the apps you keep pinned, lets you review the list, then opens a shareable profile. Nothing is uploaded.</p>
        <div className="share-actions">
          <a
            className="button button-dark"
            href="https://github.com/estejpg/dockfold/tree/main/macos/DockfoldCapture"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> View Mac source
          </a>
          <Link className="button button-line" href={demoHref}>
            Try the flow <ArrowUpRight size={16} />
          </Link>
        </div>
        <p className="build-note">macOS 14+ · SwiftPM source · signed binary release can follow</p>
      </div>
      <div className="capture-preview" aria-label="Dockfold Capture preview">
        <div className="preview-titlebar"><i /><i /><i /><span>Dockfold Capture</span></div>
        <div className="preview-body">
          <p className="preview-kicker">6 apps detected</p>
          <h3>Review your Dock</h3>
          <div className="preview-list">
            {[appCatalog.safari, appCatalog.figma, appCatalog.notion, appCatalog.slack, appCatalog.vscode, appCatalog.spotify].map((app) => (
              <div key={app.name}><span>{app.name}</span><Check size={14} /></div>
            ))}
          </div>
          <div className="preview-button">Open in Dockfold</div>
        </div>
      </div>
    </dialog>
  );
}
