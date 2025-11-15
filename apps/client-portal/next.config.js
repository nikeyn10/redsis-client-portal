/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow embedding in Monday.com iframe
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://monday.com',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.monday.com https://monday.com",
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.monday.com https://monday.com",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig