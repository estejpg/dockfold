// Decided at build time in vite.config.ts from the server configuration of the
// environment being built. Server modules and tests never import this file.
export const communityEnabled =
  import.meta.env.VITE_COMMUNITY_ENABLED === "true";
