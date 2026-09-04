import Image from "next/image";
import type { DockApp } from "@/lib/types";
import { resolveIcon } from "@/lib/apps";

export function AppIcon({ app, size = 54 }: { app: DockApp; size?: number }) {
  const icon = resolveIcon(app);
  if (!icon) {
    return (
      <span className="app-icon-fallback" style={{ width: size, height: size }} aria-label={app.name}>
        {Array.from(app.name)[0]?.toUpperCase()}
      </span>
    );
  }

  return <Image className="app-icon-image" src={icon} alt={app.name} width={size} height={size} />;
}
