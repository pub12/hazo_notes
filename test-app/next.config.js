/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['hazo_notes'],
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
