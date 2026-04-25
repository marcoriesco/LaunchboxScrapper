import Link from 'next/link';
import { Settings, Search, Home } from 'lucide-react';
import './globals.css';

export const metadata = {
    title: 'Launchbox Scraper Desktop',
    description: 'Map and scrape Retro Games',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased bg-[#0B0F19] text-white overflow-hidden flex h-screen">
                {/* Sidebar */}
                <aside className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col">
                    <div className="p-6">
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            LB <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Scraper</span>
                        </h1>
                    </div>
                    
                    <nav className="flex-1 px-4 space-y-2">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                            <Home size={20} />
                            <span className="font-medium">Scraper</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                            <Settings size={20} />
                            <span className="font-medium">Configurações</span>
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative">
                    <div className="background-blobs pointer-events-none absolute inset-0 z-0 opacity-50">
                        <div className="blob blob-1"></div>
                        <div className="blob blob-2"></div>
                    </div>
                    
                    <div className="relative z-10 max-w-6xl mx-auto p-8">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
