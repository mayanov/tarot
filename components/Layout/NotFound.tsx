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
        <div className="min-h-screen relative font-sans text-text-light flex flex-col justify-between">
            <Background />
            <Header isIndonesian={isIndonesian} />

            <main className="flex-grow flex items-center justify-center w-full px-4 relative z-10 pt-20">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-lilac/10 flex items-center justify-center border border-lilac/20 animate-pulse">
                            <AlertCircle className="w-12 h-12 text-lilac" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-white">
                        {isIndonesian ? 'Halaman Tidak Ditemukan' : 'Page Not Found'}
                    </h1>

                    <p className="text-text-subtle text-lg leading-relaxed">
                        {isIndonesian
                            ? 'Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.'
                            : "Sorry, the page you are looking for doesn't exist or has been moved."}
                    </p>

                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-lilac text-[#05050A] font-bold text-lg hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(192,160,255,0.3)] hover:shadow-[0_0_25px_rgba(192,160,255,0.5)] hover:-translate-y-1 group"
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
