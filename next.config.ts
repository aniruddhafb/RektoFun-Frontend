

/** @type {import('next').NextConfig} */
const nextConfig = {

  async rewrites() {
    return {
      // fallback: checked AFTER all pages, public files, AND dynamic routes.
      // This lets app/api/sports/scores/[fixtureId]/route.ts handle its own requests
      // before Next.js ever considers forwarding to the FastAPI backend.
      fallback: [
        {
          source: '/api/:path*',
          destination: 'https://api.rekto.fun/api/:path*',
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'earningrecords.com',
        port: '',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: 'default-src \'self\'; script-src \'none\'; sandbox;',
  },
}


module.exports = nextConfig
