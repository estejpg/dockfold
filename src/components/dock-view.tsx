import { Fragment, useEffect, useId, useRef, type CSSProperties } from "react";
import { byId } from "../lib/dock";
import { DEFAULT_STACKS, type DockLayout, type StackItem } from "../lib/schema";
import { AppIcon } from "./common";

const MAX_SCALE = 1.65;
const RANGE = 2.6; // neighbours affected on each side, in icon widths

type Size = "lg" | "md" | "sm";

function describe(apps: string[], stacks: StackItem[]) {
  const names = apps.map((id) => byId.get(id)?.name ?? id).join(", ");
  const right = stacks.map((item) => (item.kind === "trash" ? "Trash" : item.label)).join(" and ");
  return `Dock with ${apps.length} ${apps.length === 1 ? "app" : "apps"}: ${names}. Then ${right}.`;
}

export function FolderIcon({ label }: { label: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className="dv-glyph" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#72c4f6" />
          <stop offset="1" stopColor="#3f9ee2" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ad8fb" />
          <stop offset="1" stopColor="#5db5ef" />
        </linearGradient>
      </defs>
      <path d="M8 17a4 4 0 0 1 4-4h12.6a4 4 0 0 1 2.9 1.2L30.4 17H52a4 4 0 0 1 4 4v5H8z" fill={`url(#${id}b)`} />
      <rect x="6" y="21" width="52" height="34" rx="5" fill={`url(#${id}f)`} />
      <rect x="6" y="21" width="52" height="1.2" fill="#fff" opacity=".55" />
      {label === "Downloads" ? (
        <path
          d="M32 28.5v13m-5.5-5.5 5.5 5.5 5.5-5.5"
          fill="none"
          stroke="#2c84c6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".75"
        />
      ) : null}
    </svg>
  );
}

export function TrashIcon() {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className="dv-glyph" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f7f9" stopOpacity=".95" />
          <stop offset="1" stopColor="#c6cad1" stopOpacity=".95" />
        </linearGradient>
      </defs>
      <path d="M13 13.5 16.6 54a4 4 0 0 0 4 3.6h22.8a4 4 0 0 0 4-3.6L51 13.5" fill={`url(#${id}t)`} stroke="#9aa0a9" />
      {[20.5, 26.2, 32, 37.8, 43.5].map((x) => (
        <path key={x} d={`M${x} 17.5 ${32 + (x - 32) * 0.86} 54`} stroke="#a7acb4" strokeWidth="1.1" />
      ))}
      <ellipse cx="32" cy="13.5" rx="19.5" ry="3.8" fill="#e3e6ea" stroke="#9aa0a9" />
    </svg>
  );
}

// Magnifies icons around the pointer and pushes neighbours apart, like the
// macOS Dock. Only transforms are written, and only for fine pointers with
// motion allowed; keyboard and touch see the resting Dock.
function useMagnify(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dock = ref.current;
    if (!dock || !enabled) return;
    const row = dock.querySelector<HTMLElement>(".dv-row")!;
    const shelf = dock.querySelector<HTMLElement>(".dv-shelf")!;
    const label = dock.querySelector<HTMLElement>(".dv-label")!;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let items: { el: HTMLElement; center: number; width: number; grows: boolean; name: string }[] = [];
    let frame = 0;
    let pointerX: number | null = null;

    const apply = () => {
      frame = 0;
      const x = pointerX;
      const scales = items.map((item) => {
        if (x === null || !item.grows) return 1;
        const distance = Math.abs(x - item.center) / (item.width * RANGE);
        return distance >= 1 ? 1 : 1 + ((MAX_SCALE - 1) * (Math.cos(distance * Math.PI) + 1)) / 2;
      });
      const extras = scales.map((scale, index) => (scale - 1) * items[index].width);
      const total = extras.reduce((sum, value) => sum + value, 0);
      let before = 0;
      let nearest = -1;
      items.forEach((item, index) => {
        const shift = before + extras[index] / 2 - total / 2;
        before += extras[index];
        item.el.style.setProperty("--dv-x", `${shift}px`);
        item.el.style.setProperty("--dv-s", String(scales[index]));
        if (
          x !== null &&
          item.grows &&
          item.name &&
          Math.abs(x - item.center) <= item.width / 2 + 3 &&
          (nearest < 0 || scales[index] > scales[nearest])
        )
          nearest = index;
      });
      shelf.style.setProperty("--dv-shelf", String((row.offsetWidth + total) / row.offsetWidth));
      if (nearest >= 0) {
        const item = items[nearest];
        const shift = Number.parseFloat(item.el.style.getPropertyValue("--dv-x"));
        label.textContent = item.name;
        label.style.setProperty("--dv-label-x", `${item.center + shift}px`);
        label.style.setProperty("--dv-label-y", `${-(scales[nearest] - 1) * item.width}px`);
        label.dataset.visible = "";
      } else delete label.dataset.visible;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !fine.matches || reduce.matches) return;
      items = [...row.querySelectorAll<HTMLElement>("[data-dv]")].map((el) => ({
        el,
        center: el.offsetLeft + el.offsetWidth / 2,
        width: el.offsetWidth,
        grows: el.dataset.dv !== "divider",
        name: el.dataset.name ?? "",
      }));
      dock.dataset.active = "";
    };
    const move = (event: PointerEvent) => {
      if (!("active" in dock.dataset)) return;
      pointerX = event.clientX - row.getBoundingClientRect().left;
      schedule();
    };
    const leave = () => {
      if (!("active" in dock.dataset)) return;
      delete dock.dataset.active;
      pointerX = null;
      schedule();
    };
    dock.addEventListener("pointerenter", enter);
    dock.addEventListener("pointermove", move);
    dock.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      dock.removeEventListener("pointerenter", enter);
      dock.removeEventListener("pointermove", move);
      dock.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);
  return ref;
}

export function DockView({
  apps,
  layout,
  size = "lg",
  magnify = false,
  transitionName,
}: {
  apps: string[];
  layout?: DockLayout;
  size?: Size;
  magnify?: boolean;
  transitionName?: string;
}) {
  const spacers = layout?.spacers ?? [];
  const stacks = layout?.stacks ?? DEFAULT_STACKS;
  const ref = useMagnify(magnify);
  const count = apps.length + spacers.length + stacks.length + 0.4;
  return (
    <div className="dv-wrap">
      <div
        ref={ref}
        className={`dockview dv-${size}`}
        data-magnify={magnify ? "" : undefined}
        role="img"
        aria-label={describe(apps, stacks)}
        style={
          {
            "--dv-count": count,
            viewTransitionName: transitionName,
          } as CSSProperties
        }
      >
        <span className="dv-shelf" aria-hidden="true" />
        <div className="dv-row" aria-hidden="true">
          <span className="dv-label" />
          {apps.map((id, index) => {
            const app = byId.get(id);
            if (!app) return null;
            return (
              <Fragment key={id}>
                <span className="dv-item" data-dv="app" data-name={app.name}>
                  <AppIcon app={app} size={size === "sm" ? 32 : 64} />
                  <span className="dv-tip">{app.name}</span>
                </span>
                {spacers.includes(index) ? (
                  <span className="dv-item dv-spacer" data-dv="spacer" data-name="" />
                ) : null}
              </Fragment>
            );
          })}
          <span className="dv-divider" data-dv="divider" />
          {stacks.map((item, index) => {
            const name = item.kind === "trash" ? "Trash" : item.label;
            return (
              <span className="dv-item dv-stack" data-dv="stack" data-name={name} key={`${name}-${index}`}>
                {item.kind === "trash" ? <TrashIcon /> : <FolderIcon label={item.label} />}
                <span className="dv-tip">{name}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MiniDock({
  apps,
  max = 6,
  transitionName,
}: {
  apps: string[];
  max?: number;
  transitionName?: string;
}) {
  const shown = apps.length > max ? apps.slice(0, max - 1) : apps;
  return (
    <span
      className="mini-dock"
      aria-hidden="true"
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      {shown.map((id) => {
        const app = byId.get(id);
        return app ? <AppIcon key={id} app={app} size={20} /> : null;
      })}
      {apps.length > shown.length ? <span className="mini-more">+{apps.length - shown.length}</span> : null}
    </span>
  );
}
