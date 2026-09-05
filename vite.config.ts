import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  // Server values are read only to derive build flags; none are exposed to the
  // client except the explicitly named Clerk publishable key.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const clerkKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  // Community pages need the database and Clerk. An environment without both
  // (for example production before activation) hides them instead of shipping
  // forms and boards that can only fail.
  const communityEnabled = Boolean(clerkKey && env.DATABASE_URL);
  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkKey),
      "import.meta.env.VITE_COMMUNITY_ENABLED": JSON.stringify(
        String(communityEnabled),
      ),
    },
    build: { sourcemap: false },
  };
});
