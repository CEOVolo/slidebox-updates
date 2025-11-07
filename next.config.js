/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // typescript: {
  //   // Temporarily ignore TypeScript errors during build
  //   ignoreBuildErrors: true,
  // },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'figma-alpha-api.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3-alpha.figma.com',
      },
    ],
  },
  env: {
    FIGMA_ACCESS_TOKEN: process.env.FIGMA_ACCESS_TOKEN,
  },
}

module.exports = nextConfig 