import React from 'react';
import Header from './Header';
import Footer from './Footer';
import CelestialMark from '../UI/CelestialMark';
import ButtonInk from '../UI/ButtonInk';
import PencilRule from '../UI/PencilRule';
import { btnPrimaryLight } from '../UI/buttons';

interface NotFoundProps {
    isIndonesian?: boolean;
}

// A page that isn't there: the site's paper with a printed crescent, the message
// set like the sections' headings, and the way home as a painted button.
const NotFound: React.FC<NotFoundProps> = ({ isIndonesian = false }) => {
    return (
        <div className="min-h-screen relative font-sans text-ink bg-paper flex flex-col justify-between">
            <Header isIndonesian={isIndonesian} paper />

            <main className="flex-grow flex items-center justify-center w-full px-6 relative z-10 pt-28 pb-20">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                    <CelestialMark name="crescent" className="print-ink w-14 text-moon/80" />
                    <span className="print-ink mt-4 font-elegant italic text-ink/45 tracking-[0.2em]">404</span>

                    <h1 className="letterpress-lg mt-3 font-elegant font-semibold text-ink text-[2.4rem] md:text-[3rem] leading-[1.05] tracking-[-0.02em]">
                        {isIndonesian ? 'Halaman tidak ditemukan' : 'Page not found'}
                    </h1>
                    <PencilRule collapse={false} className="mt-4 w-16 text-moon/50" />

                    <p className="letterpress mt-4 text-ink/65 text-[17px] leading-relaxed">
                        {isIndonesian
                            ? 'Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.'
                            : "Sorry, the page you're looking for doesn't exist or has moved."}
                    </p>

                    <a href="/" className={`${btnPrimaryLight} inline-flex mt-8 px-8 py-3 text-[1.05rem]`}>
                        <ButtonInk kind="primary" tone="light">
                            {isIndonesian ? 'Kembali ke Beranda' : 'Back to Home'}
                        </ButtonInk>
                    </a>
                </div>
            </main>

            <Footer isIndonesian={isIndonesian} />
        </div>
    );
};

export default NotFound;
