const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGitHubPages ? '/hta_cleaner_scanner' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: isGitHubPages ? 'export' : undefined,
    basePath,
    assetPrefix: basePath,
    trailingSlash: isGitHubPages,
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
    },

    // Настройки изображений
    images: {
        unoptimized: isGitHubPages,
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: 'localhost',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },

    ...(isGitHubPages
        ? {}
        : {
              // Настройки для API прокси
              async rewrites() {
                  return [
                      {
                          source: '/api/:path*',
                          destination: `${process.env.INTERNAL_API_URL || 'http://backend:8000'}/api/:path*`,
                      },
                      {
                          source: '/uploads/:path*',
                          destination: `${process.env.INTERNAL_API_URL || 'http://backend:8000'}/uploads/:path*`,
                      },
                  ];
              },
          }),

    productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
