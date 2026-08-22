import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Background from './Background';
import { Home, AlertCircle } from 'lucide-react';

interface NotFoundProps {
    isIndonesian?: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({ isIndonesian = false }) => {
    return (
        <div className="min-h-screen relative font-sans text-ink flex flex-col justify-between">
            <Background />
            <Header isIndonesian={isIndonesian} />

            <main className="flex-grow flex items-center justify-center w-full px-4 relative z-10 pt-20">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center border border-terracotta/25">
                            <AlertCircle className="w-10 h-10 text-terracotta" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-medium font-serif text-ink">
                        {isIndonesian ? 'Halaman Tidak Ditemukan' : 'Page Not Found'}
                    </h1>

                    <p className="text-ink-soft text-lg leading-relaxed font-light">
                        {isIndonesian
                            ? 'Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.'
                            : "Sorry, the page you are looking for doesn't exist or has been moved."}
                    </p>

                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-terracotta text-paper font-medium text-lg hover:bg-terracotta-dark transition-all duration-300 shadow-[0_10px_30px_-12px_rgba(193,97,74,0.7)] hover:-translate-y-1 group"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {isIndonesian ? 'Kembali ke Beranda' : 'Back to Home'}
                    </a>
                </div>
            </main>

            <Footer isIndonesian={isIndonesian} />
        </div>
    );
};

export default NotFound;
