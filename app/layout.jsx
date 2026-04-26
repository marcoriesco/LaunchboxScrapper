import './globals.css';

export const metadata = {
    title: 'Launchbox Scraper Desktop',
    description: 'Map and scrape Retro Games',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased min-h-screen">
                {children}
            </body>
        </html>
    );
}
