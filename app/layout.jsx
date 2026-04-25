import './globals.css';

export const metadata = {
    title: 'Launchbox Scraper',
    description: 'Map and scrape Retro Games',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased">
                <div className="background-blobs">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <header className="text-center mb-12 animate-[slideDown_0.8s_ease-out_forwards]">
                        <h1 className="text-5xl font-extrabold tracking-tight mb-2">
                            Launchbox <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Scraper</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-light">Discover & Map Retro Game Artwork</p>
                    </header>
                    {children}
                </div>
            </body>
        </html>
    );
}
