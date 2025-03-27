/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: 'storage.verity.dev',
      },
    ],
  },
}

module.exports = nextConfig 