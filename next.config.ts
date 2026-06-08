import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs'],
  turbopack: {},
  allowedDevOrigins: ['http://21.0.11.84:81', 'http://localhost:81', 'http://21.0.11.84:3000', 'http://21.0.11.84'],
}

export default nextConfig
