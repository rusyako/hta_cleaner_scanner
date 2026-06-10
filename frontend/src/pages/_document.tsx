import { Html, Head, Main, NextScript } from 'next/document';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Document() {
    return (
        <Html lang="ru">
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="HTA Cleaner" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="application-name" content="HTA Cleaner Scanner" />
                <link rel="icon" href={`${basePath}/favicon.ico`} />
                <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
                <link rel="apple-touch-startup-image" href={`${basePath}/apple-touch-icon.png`} />
                <link rel="manifest" href={`${basePath}/site.webmanifest`} />
                <meta name="theme-color" content="#3b82f6" />
                <meta name="msapplication-TileColor" content="#3b82f6" />
            </Head>
            <body>
            <Main />
            <NextScript />
            </body>
        </Html>
    );
}
