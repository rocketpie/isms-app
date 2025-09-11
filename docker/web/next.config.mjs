/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      // Browser -> Next.js (web) -> PostgREST (container)
      { source: '/api/:path*',  destination: 'http://postgrest:3000/:path*' },
      // Browser -> Next.js (web) -> GoTrue (container)
      { source: '/auth/:path*', destination: 'http://auth:7779/:path*' }
    ];
  }
};
export default nextConfig;
