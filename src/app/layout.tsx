import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dockfold.vercel.app"),
  title: { default: "Dockfold — The apps people keep close", template: "%s · Dockfold" },
  description: "Browse real Mac Docks and turn your pinned apps into a private, portable profile link.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
