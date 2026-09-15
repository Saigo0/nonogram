/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/api/puzzle": ["./data/nonogram.sqlite"],
  },
};

export default nextConfig;
