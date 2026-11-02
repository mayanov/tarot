import React, { useEffect } from 'react';
import Header from './Header';
import CelestialMark from '../UI/CelestialMark';
import ButtonInk from '../UI/ButtonInk';
import PencilRule from '../UI/PencilRule';
import { btnPrimaryLight } from '../UI/buttons';
import { trackEvent, SERVICE_TRACK_NAME } from '../../services/analytics';

// Where PayPal sends a global visitor back to (/?payment_success=3card|5card) after
// paying for the reading they booked: the site's paper, set like the 404 page, with
// what happens next. The sale is counted here, once per visit, since this is the only
// point that knows the payment went through.
const READINGS = {
    '3card': { name: '3-Card Spread', value: 12, mark: 'constellation', when: 'within 24 hours' },
    '5card': { name: '5-Card Deep', value: 20, mark: 'star', when: 'within a few days' },
} as const;

export type PaidReading = keyof typeof READINGS;

let counted = false;

const ThankYou: React.FC<{ reading: PaidReading }> = ({ reading }) => {
    const r = READINGS[reading];

    useEffect(() => {
        const key = `mt:paid:${reading}`;
        let seen = counted;
        try { seen = seen || sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch { /* storage blocked */ }
        if (seen) return;
        counted = true;
        const item = SERVICE_TRACK_NAME[reading];
        trackEvent('purchase', { item_name: item, market: 'Global', value: r.value, currency: 'USD', transaction_id: `pp-${Date.now()}` },
            'Purchase', { value: r.value, currency: 'USD', content_name: item });
    }, [reading, r]);

    const steps = [
        'Your question from the booking form is with me — there’s nothing more to send.',
        `Your reading arrives by email ${r.when}. If it isn’t there, check your spam folder.`,
        'Want to add something? Message me on WhatsApp or email tarotreadingbymayanov@gmail.com.',
    ];

    return (
        <div className="h-[100dvh] overflow-hidden relative font-sans text-ink bg-paper flex flex-col">
            <Header isIndonesian={false} paper noBooking />

            <main className="flex-1 min-h-0 flex items-center justify-center w-full px-6 relative z-10 pt-20 pb-6 [@media(max-height:740px)]:pt-16 [@media(max-height:740px)]:pb-3">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                    <CelestialMark name={r.mark} className="print-ink w-14 [@media(max-height:740px)]:w-10 text-moon/80" />
                    <span className="print-ink mt-4 [@media(max-height:740px)]:mt-2 font-elegant italic text-ink/45 tracking-[0.2em]">{r.name}</span>

                    <h1 className="letterpress-lg mt-3 font-elegant font-semibold text-ink text-[2.4rem] md:text-[3rem] [@media(max-height:740px)]:text-[2rem] leading-[1.05] tracking-[-0.02em]">
                        Thank you, payment received
                    </h1>
                    <PencilRule collapse={false} className="mt-4 w-16 text-moon/50" />

                    <p className="letterpress mt-4 text-ink/65 text-[17px] leading-relaxed">
                        Your reading is confirmed. I’ll sit with your cards and write back soon.
                    </p>

                    <ol className="mt-8 [@media(max-height:740px)]:mt-4 w-full text-left">
                        {steps.map((s, i) => (
                            <li key={i} className="flex gap-4 py-3 [@media(max-height:740px)]:py-1.5">
                                <span className="print-ink font-elegant italic text-moon/80 text-xl leading-none pt-0.5">{i + 1}</span>
                                <span className="letterpress text-ink/70 text-[15px] leading-relaxed">{s}</span>
                            </li>
                        ))}
                    </ol>

                    <span className="mt-6 [@media(max-height:740px)]:mt-3 block w-fit -rotate-2 font-['Reenie_Beanie',cursive] lowercase text-moon/80 text-[1.45rem] leading-none [filter:url(#pencil-icon)]">
                        thank you for trusting me
                    </span>

                    <a href="/" className={`${btnPrimaryLight} inline-flex mt-8 [@media(max-height:740px)]:mt-5 px-8 py-3 text-[1.05rem]`}>
                        <ButtonInk kind="primary" tone="light">Back to Home</ButtonInk>
                    </a>
                </div>
            </main>
        </div>
    );
};

export default ThankYou;
