/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // If you run in Docker and want fewer file watcher issues:
  // webpackDevMiddleware: config => {
  //   config.watchOptions = { poll: 1000, aggregateTimeout: 300 }
  //   return config
  // },
}

export default nextConfig
