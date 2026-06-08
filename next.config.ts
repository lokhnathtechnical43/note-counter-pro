import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs'],
  turbopack: {},
}

export default nextConfig
