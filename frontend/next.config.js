/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Настройки изображений
    images: {
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

    // Настройки для API прокси
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.INTERNAL_API_URL || 'http://backend:8000'}/api/:path*`,
            },
        ];
    },

    productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
