/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.discordapp.com', 'i.scdn.co', 'last.fm', 'lastfm.freetls.fastly.net', 'marvelrivalsapi.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'marvelrivalsapi.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig 