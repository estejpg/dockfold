import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dockfold.vercel.app"),
  title: { default: "DockFold — The apps you keep close", template: "%s · DockFold" },
  description: "Capture your Mac Dock, review your apps, and create an unlisted link you can delete.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("dockfold:theme");document.documentElement.dataset.theme=t==="dark"||t==="light"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}})()` }} /></head><body>{children}</body></html>;
}
