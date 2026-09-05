import { ArrowLeft, ArrowUpRight, Copy } from "lucide-react";
import { useState } from "react";
import { byId, customizeURL } from "../lib/dock";
import {
  collectionDock,
  formatDate,
  groups,
  type Collection,
} from "../lib/collections";
import { AppIcon, DockStrip } from "./common";
export function CollectionDetail({ item }: { item: Collection }) {
  const [notice, setNotice] = useState("");
  const dock = collectionDock(item);
  return (
    <main id="main" tabIndex={-1} className="collection-detail">
      <a className="back-link" href="/">
        <ArrowLeft size={14} />
        All Docks
      </a>
      <div className="detail-heading">
        <div>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </div>
        <span>{groups.find((g) => g.id === item.group)?.name}</span>
      </div>
      <div className="detail-preview">
        <DockStrip ids={item.apps} />
      </div>
      <div className="detail-body">
        <section>
          <h2>A place to start</h2>
          <p>{item.rationale}</p>
          <p className="fine-print">
            Curated by DockFold · Added{" "}
            <time dateTime={item.addedOn}>{formatDate(item.addedOn)}</time>
          </p>
          <div className="share-actions">
            <a className="button button-dark" href={customizeURL(dock)}>
              Make it yours <ArrowUpRight size={14} />
            </a>
            <button
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${location.origin}/docks/${item.id}`,
                  );
                  setNotice("Dock link copied.");
                } catch {
                  setNotice("Copy this page’s address from your browser.");
                }
              }}
            >
              <Copy size={14} />
              Copy link
            </button>
          </div>
          <p role="status" className="status-message">
            {notice}
          </p>
        </section>
        <section>
          <h2>
            In this Dock <span>{item.apps.length}</span>
          </h2>
          <ol className="detail-apps">
            {item.apps.map((id, index) => {
              const app = byId.get(id)!;
              return (
                <li key={id}>
                  <span>{index + 1}</span>
                  <AppIcon app={app} size={34} />
                  <span>{app.name}</span>
                  <span>{app.category}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </main>
  );
}
