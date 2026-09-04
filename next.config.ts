import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['lucide-react'] },
  async headers() {
    const privateHeaders = [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    ];
    return [
      { source: '/:path*', headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ] },
      ...['/share', '/p/:path*', '/d/:path*', '/manage/:path*'].map(source => ({ source, headers: privateHeaders })),
    ];
  },
};
export default nextConfig;
