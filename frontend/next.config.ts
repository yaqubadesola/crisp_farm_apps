import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 'standalone' is required for Docker builds.
  // Vercel builds natively and does not need it — controlled by BUILD_STANDALONE.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
}

export default nextConfig
