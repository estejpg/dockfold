import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
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
