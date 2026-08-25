/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The API lives in the Express app, not in Next route handlers.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-vd3v.onrender.com/api',
  },
};

module.exports = nextConfig;
