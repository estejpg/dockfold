import type { DockApp } from "@/lib/types";
import { AppIcon } from "@/components/app-icon";

export function DockStrip({ apps, compact = false }: { apps: DockApp[]; compact?: boolean }) {
  return (
    <div className={compact ? "dock-strip dock-strip-compact" : "dock-strip"} aria-label="Pinned applications">
      {apps.map((app, index) => (
        <div className="dock-app" key={`${app.bundleIdentifier ?? app.name}-${index}`}>
          <span className="dock-tooltip">{app.name}</span>
          <AppIcon app={app} size={compact ? 42 : 54} />
        </div>
      ))}
    </div>
  );
}
