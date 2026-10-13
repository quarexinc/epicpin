/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: { unoptimized: true },
};
export default nextConfig;
