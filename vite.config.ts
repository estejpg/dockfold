import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: "render-ready-entry",
      apply: "build",
      // Vite regenerates the entry tag and drops its blocking attribute.
      // Keep first paint behind React so document transitions capture the page.
      transformIndexHtml: {
        order: "post",
        handler: (html) =>
          html.replace('<script type="module" ', '<script type="module" blocking="render" '),
      },
    },
  ],
  define: {
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        loadEnv(mode, process.cwd(), "NEXT_PUBLIC_")
          .NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "",
    ),
  },
  build: { sourcemap: false },
}));
