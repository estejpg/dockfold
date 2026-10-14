import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { collectionName, formatDay, type DockRecord } from "../lib/docks";
import { DockView, MiniDock } from "./dock-view";

const OPEN_DELAY = 220;
const WARM_WINDOW = 300;

function usePreview() {
  const [active, setActive] = useState<DockRecord | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const point = useRef({ x: 0, y: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closedAt = useRef(0);

  const place = () => {
    const element = card.current;
    if (!element) return;
    const { x, y } = point.current;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const left = x + 18 + width > innerWidth - 12 ? x - width - 18 : x + 18;
    const top = y + 18 + height > innerHeight - 12 ? y - height - 18 : y + 18;
    element.style.transform = `translate(${Math.max(12, left)}px, ${Math.max(12, top)}px)`;
  };
  useLayoutEffect(place, [active]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const hide = () => {
    clearTimeout(timer.current);
    setActive((current) => {
      if (current) closedAt.current = performance.now();
      return null;
    });
  };
  const bind = (dock: DockRecord) => ({
    onPointerEnter(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      point.current = { x: event.clientX, y: event.clientY };
      clearTimeout(timer.current);
      if (performance.now() - closedAt.current < WARM_WINDOW) setActive(dock);
      else timer.current = setTimeout(() => setActive(dock), OPEN_DELAY);
    },
    onPointerMove(event: PointerEvent) {
      point.current = { x: event.clientX, y: event.clientY };
      place();
    },
    onPointerLeave: hide,
    onFocus: hide,
    onClick: hide,
  });
  const preview = active ? (
    <div className="hover-preview" ref={card} aria-hidden="true">
      <div className="preview-stage">
        <DockView apps={active.apps} layout={active.layout} size="md" />
      </div>
      <p>
        <strong>{active.title}</strong> · {active.apps.length} apps
      </p>
    </div>
  ) : null;
  return { bind, preview };
}

export function DockRows({
  docks,
  showCollection = false,
  preview = true,
  label,
}: {
  docks: DockRecord[];
  showCollection?: boolean;
  preview?: boolean;
  label?: string;
}) {
  const hover = usePreview();
  return (
    <>
      <ol className="dock-list" aria-label={label}>
        {docks.map((dock) => (
          <li key={dock.id}>
            <a className="dock-row" href={`/docks/${dock.id}`} {...(preview ? hover.bind(dock) : {})}>
              <span className="row-text">
                <span className="row-title">{dock.title}</span>
                <span className="row-summary">{dock.summary}</span>
                {showCollection ? (
                  <span className="row-collection">{collectionName(dock.collection)}</span>
                ) : null}
                <span className="sr-only">, {dock.apps.length} apps</span>
              </span>
              <MiniDock apps={dock.apps} max={5} transitionName={`dock-${dock.id}`} />
              <time className="row-date" dateTime={dock.addedOn}>
                {formatDay(dock.addedOn)}
              </time>
            </a>
          </li>
        ))}
      </ol>
      {preview ? hover.preview : null}
    </>
  );
}

export function DockCards({ docks, label }: { docks: DockRecord[]; label?: string }) {
  return (
    <ul className="dock-cards" aria-label={label}>
      {docks.map((dock) => (
        <li key={dock.id}>
          <a className="dock-card" href={`/docks/${dock.id}`}>
            <span className="card-stage">
              <DockView
                apps={dock.apps}
                layout={dock.layout}
                size="sm"
                transitionName={`dock-${dock.id}`}
              />
            </span>
            <span className="card-title">{dock.title}</span>
            <span className="card-summary">{dock.summary}</span>
            <span className="card-meta">
              {collectionName(dock.collection)} · {dock.apps.length} apps
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
