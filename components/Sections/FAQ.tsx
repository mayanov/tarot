import React, { useState } from 'react';
import { trackWhatsApp, trackFaqOpen } from '../../services/analytics';
import { Plus } from 'lucide-react';
import PencilArrow from '../UI/PencilArrow';
import FadeIn from '../UI/FadeIn';
import PencilRule from '../UI/PencilRule';

interface FAQProps {
  isIndonesian?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
  cat: string;
}

// A frame sketched round the chosen answer (desktop): four pencil strokes, each a
// little off level and running past the corners, with the top and bottom gone over a
// second time more lightly, so the answer sits in a drawn box rather than a CSS one.
const SketchFrame: React.FC = () => (
  <svg aria-hidden className="pointer-events-none absolute -z-10 inset-0 h-full w-full overflow-visible text-moon">
    <defs>
      <filter id="faqpencil" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.6" result="ga" />
        <feComposite in="d" in2="ga" operator="in" />
      </filter>
    </defs>
    <g filter="url(#faqpencil)" stroke="currentColor" strokeLinecap="round" fill="none" opacity="0.45">
      <line x1="-3%" y1="1%" x2="101%" y2="-1%" strokeWidth="1.2" />
      <line x1="1%" y1="2%" x2="98%" y2="0.5%" strokeWidth="0.6" opacity="0.6" />
      <line x1="99%" y1="-4%" x2="100.5%" y2="103%" strokeWidth="1.2" />
      <line x1="102%" y1="99%" x2="-2%" y2="100.5%" strokeWidth="1.2" />
      <line x1="97%" y1="98%" x2="3%" y2="99.5%" strokeWidth="0.6" opacity="0.6" />
      <line x1="0.5%" y1="104%" x2="-0.5%" y2="-3%" strokeWidth="1.2" />
    </g>
  </svg>
);

const FAQ: React.FC<FAQProps> = ({ isIndonesian = false }) => {
  const faqsEN: FaqItem[] = [
    {
      cat: 'About Tarot',
      question: "What is a tarot reading?",
      answer: "A tarot reading looks at the symbols in the cards drawn for your question to help you see your situation more clearly: the patterns at play, what's influencing it, and the options in front of you.\n\nI use tarot as a tool for reflection and guidance, not to frighten you or to hand down a fixed fate."
    },
    {
      cat: 'About Tarot',
      question: "Can tarot predict the future?",
      answer: "Not as something fixed. A reading shows the energy and direction of things as they stand now: where they're likely heading if nothing changes. Your choices and actions still shape what happens next, and a reading is there to help you make them with clearer eyes."
    },
    {
      cat: 'About Tarot',
      question: "Do I have to believe in tarot for it to work?",
      answer: "No. All you need is an open mind. Tarot works best as a way to step back and look at yourself and your situation honestly, whatever you believe about how it works."
    },
    {
      cat: 'About Tarot',
      question: "Is tarot evil or scary?",
      answer: "Not at all. My practice is grounded in psychology and self-reflection. I use tarot as a mirror, to help you notice what you already sense and see options you might have missed. It's a tool for clarity and empowerment, not fear."
    },
    {
      cat: 'Readings',
      question: "Which reading should I choose?",
      answer: "• 3-Card Spread ($12): a quick, focused check-in on one clear question. You get a photo of your spread and a written reading by email within 24 hours.\n• 5-Card Deep ($20): one question read in depth, with the bigger picture, hidden influences and what's coming next. You get a high-res photo of your cards and an in-depth reading, with priority delivery within 24 hours.\n• Live Session ($45, 30 minutes): we talk it through together on Google Meet, and you can ask as many questions as we can fit in the time.\n\nNot sure? Message me on WhatsApp and I'll help you pick."
    },
    {
      cat: 'Readings',
      question: "What kind of questions can I ask?",
      answer: "Tarot is well suited to:\n• Love and relationships\n• Career and work\n• Big decisions and crossroads\n• Personal growth\n• Your emotions and the dynamics of a situation\n\nThe clearer and more specific your question, the clearer the reading. \"What do I need to know about changing jobs this year?\" works better than \"What's my future?\""
    },
    {
      cat: 'Readings',
      question: "Are there questions you won't read?",
      answer: "Yes. Out of care and responsibility, I don't read on:\n• Death\n• Pregnancy\n• Medical diagnoses\n• Legal outcomes\n• Gambling or lottery numbers\n• Lost items or pets"
    },
    {
      cat: 'Readings',
      question: "How many questions does one reading cover?",
      answer: "The 3-Card Spread and the 5-Card Deep each answer one question (1 qty = 1 question). If you have more than one, simply order one reading per question. In a Live Session you can ask as many questions as we can fit into the 30 minutes."
    },
    {
      cat: 'Process',
      question: "How does an email reading work?",
      answer: "1. Tap \"Book a Reading\", leave your name, date of birth, WhatsApp and email, and pay.\n2. You'll get a confirmation email: reply to it with your question and a little context about your situation.\n3. I focus on your question, pull the cards, and send you a photo of your spread with your written reading within 24 hours."
    },
    {
      cat: 'Process',
      question: "How does a Live Session work?",
      answer: "1. Tap \"Book a Reading\" and pick a day and time. Times are shown in your own time zone.\n2. Leave your name, date of birth, WhatsApp and email, then pay.\n3. The Google Meet link comes by email. At your time, we meet on the call for 30 minutes.\n\nLive Sessions run Monday to Friday."
    },
    {
      cat: 'Process',
      question: "Do I need to be present for the reading?",
      answer: "For email readings (3-Card and 5-Card), no: I read for your question remotely, and you simply receive it by email. For a Live Session, yes: we meet on Google Meet at the time you booked."
    },
    {
      cat: 'Process',
      question: "What do I need to prepare?",
      answer: "Just your question and a short description of your situation. You don't need to send a photo, and you don't need to know anything about tarot beforehand."
    },
    {
      cat: 'Booking',
      question: "How do I pay?",
      answer: "Securely through PayPal, right in the booking form. Prices are in US dollars."
    },
    {
      cat: 'Booking',
      question: "What is your refund policy?",
      answer: "All payments are non-refundable, so please make sure before you book.\n\nIf you can't make your Live Session, you can reschedule it: just let me know at least 24 hours in advance and we'll find a new time."
    },
    {
      cat: 'Booking',
      question: "Is my reading confidential?",
      answer: "Yes, completely. Your story, your questions and your reading are never shared without your permission."
    },
    {
      cat: 'About Tarot',
      question: "Can tarot replace a doctor, lawyer or therapist?",
      answer: "No. Tarot is not a substitute for professional legal, financial, medical or psychological advice. If you're facing something in those areas, please reach out to a qualified professional as well."
    },
  ];

  const faqsID: FaqItem[] = [
    {
      cat: 'Tentang',
      question: "Apa itu tarot reading?",
      answer: "Tarot reading adalah proses membaca simbol dari kartu tarot untuk membantu melihat situasi, pola, dan kemungkinan yang sedang kamu hadapi. Tarot digunakan sebagai alat refleksi dan panduan, bukan untuk menakut-nakuti atau menentukan nasib secara mutlak."
    },
    {
      cat: 'Tentang',
      question: "Apakah tarot bisa meramal masa depan?",
      answer: "Tarot tidak melihat masa depan sebagai sesuatu yang pasti dan tidak bisa diubah. Yang dibaca adalah energi dan kecenderungan berdasarkan kondisi saat ini. Pilihan dan tindakan kamu tetap punya peran besar dalam menentukan arah ke depannya."
    },
    {
      cat: 'Tentang',
      question: "Apakah saya harus percaya tarot agar reading-nya bekerja?",
      answer: "Tidak harus percaya sepenuhnya. Yang terpenting adalah datang dengan pikiran terbuka. Tarot paling efektif saat digunakan sebagai alat untuk memahami diri dan situasi dengan lebih jernih."
    },
    {
      cat: 'Pertanyaan',
      question: "Pertanyaan apa saja yang bisa ditanyakan?",
      answer: "Tarot cocok untuk membahas: Percintaan & hubungan, Karier & pekerjaan, Keputusan hidup, Pengembangan diri, Kondisi emosi dan dinamika situasi"
    },
    {
      cat: 'Pertanyaan',
      question: "Apakah ada pertanyaan yang tidak bisa dibaca?",
      answer: "Ya. Demi etika dan tanggung jawab, tarot reading tidak menerima pertanyaan mengenai: Kematian, Kehamilan, Judi, Barang atau hewan yang hilang"
    },
    {
      cat: 'Booking',
      question: "Apakah pembayaran bisa dikembalikan (refund)?",
      answer: "Semua pembayaran bersifat non-refundable. Mohon pastikan kamu sudah yakin sebelum melakukan booking."
    },
    {
      cat: 'Proses',
      question: "Bagaimana jika waktu sesi habis?",
      answer: "Jika waktu sesi sudah selesai, reading akan disimpulkan. Apabila ingin melanjutkan, sesi tambahan bisa dilakukan sesuai ketentuan yang berlaku."
    },
    {
      cat: 'Proses',
      question: "Bagaimana cara kerja tarot reading via chat?",
      answer: "Setelah kamu memilih paket dan menyelesaikan pembayaran, kamu bisa langsung mengirimkan konteks cerita dan pertanyaan melalui WhatsApp chat. Hasil reading akan dikirim dalam bentuk: Foto kartu tarot yang keluar, dan Penjelasan dalam bentuk voice note, agar lebih jelas dan terasa personal."
    },
    {
      cat: 'Proses',
      question: "Kapan sesi dimulai?",
      answer: "Untuk sesi online, reading dimulai setelah pembayaran diterima. Untuk sesi tatap muka, pembayaran dapat dilakukan sebelum sesi atau langsung di tempat."
    },
    {
      cat: 'Proses',
      question: "Informasi apa yang perlu saya siapkan untuk reading?",
      answer: "Cukup siapkan: Nama, Cerita singkat atau konteks situasi. Foto atau tanggal lahir tidak wajib."
    },
    {
      cat: 'Tentang',
      question: "Apakah sesi tarot bersifat rahasia?",
      answer: "Ya. Kerahasiaan klien sepenuhnya dijaga. Cerita, pertanyaan, dan hasil reading tidak akan dibagikan tanpa persetujuan klien."
    },
    {
      cat: 'Tentang',
      question: "Apakah tarot bisa menggantikan profesional lain?",
      answer: "Tidak. Tarot bukan pengganti layanan profesional di bidang hukum, keuangan, kesehatan, atau psikologi."
    },
    {
      cat: 'Tentang',
      question: "Apakah hasil tarot bersifat mutlak?",
      answer: "Tidak. Tarot menunjukkan gambaran dan kemungkinan sementara. Masa depan bisa berubah seiring usaha dan pilihan yang kamu ambil."
    }
  ];

  const faqs = isIndonesian ? faqsID : faqsEN;
  const allLabel = isIndonesian ? 'Semua' : 'All';
  const categories = [allLabel, ...Array.from(new Set(faqs.map((f) => f.cat)))];

  const [activeCat, setActiveCat] = useState<string>(allLabel);
  const [openKey, setOpenKey] = useState<string | null>(faqs[0]?.question ?? null);

  // A stale category (e.g. after a language switch) falls back to "all".
  const showAll = activeCat === allLabel || !faqs.some((f) => f.cat === activeCat);
  const filtered = showAll ? faqs : faqs.filter((f) => f.cat === activeCat);

  // the answer shown in the desktop panel: the chosen question, else the first one listed
  const current = filtered.find((f) => f.question === openKey) ?? filtered[0];
  const currentNo = current ? filtered.indexOf(current) + 1 : 0;

  // phones: an accordion (tap again to close). Desktop: a question is picked for the
  // panel on the right, so tapping it again keeps it.
  const toggleFAQ = (key: string) => {
    if (key !== openKey) trackFaqOpen(key, isIndonesian ? 'ID' : 'Global');
    if (window.matchMedia('(min-width: 1024px)').matches) setOpenKey(key);
    else setOpenKey((cur) => (cur === key ? null : key));
  };
  const pickCat = (cat: string) => {
    setActiveCat(cat);
    const list = cat === allLabel ? faqs : faqs.filter((f) => f.cat === cat);
    setOpenKey(list[0]?.question ?? null);
  };

  const wa = `https://wa.me/6287786280310?text=${encodeURIComponent(isIndonesian ? 'Halo kak, aku mau tanya soal sesi tarot.' : "Hi! I have a question about a tarot reading.")}`;

  return (
    // A typographic index on the page's own paper (no panel, no divider): the
    // questions are set as large serif lines, filtered by an inline sentence, and the
    // section closes on a direct WhatsApp question instead of the last item.
    // Desktop: the questions run down the left and the chosen one's answer sits on the
    // right (pinned while the list scrolls); phones keep the accordion.
    <section id="faq" className="relative text-ink pt-16 md:pt-24 pb-24 md:pb-36">
      <div className="mx-auto px-8">
        <FadeIn dir="blur" duration={1.15}>
          <div className="text-center">
            <h2 className="letterpress-lg pb-[0.14em] -mb-[0.14em] font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
              {isIndonesian ? 'Sering ditanyakan' : 'Frequently asked'}
            </h2>

            {/* category filter — a quiet row of words, the active one in purple italic */}
            <p className="letterpress mt-6 md:mt-8 text-[0.95rem] md:text-base text-ink/50 font-light">
              {categories.map((cat, ci) => {
                const active = showAll ? cat === allLabel : cat === activeCat;
                return (
                  <React.Fragment key={cat}>
                    {ci > 0 && <span aria-hidden className="mx-1.5 text-ink/25">·</span>}
                    <button
                      onClick={() => pickCat(cat)}
                      aria-pressed={active}
                      className={`relative pb-1 font-elegant text-[1.1rem] md:text-[1.2rem] transition-colors duration-300 ${active ? 'italic text-moon' : 'text-ink/70 hover:text-moon'}`}
                    >
                      {cat}
                      {/* the active one is underlined in pencil */}
                      <PencilRule className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  </React.Fragment>
                );
              })}
            </p>
          </div>
        </FadeIn>

        <div className="mt-10 md:mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24 lg:items-start">
        {/* the index */}
        <ol>
          {filtered.map((faq, index) => {
            const open = openKey === faq.question;
            return (
              <li key={faq.question}>
                <PencilRule weight="fine" className="text-ink/30" />
                <FadeIn delay={Math.min(index, 6) * 55} dir="up" distance={0.6}>
                  <button
                    onClick={() => toggleFAQ(faq.question)}
                    aria-expanded={open}
                    className="group w-full grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2.75rem_1fr_auto] items-baseline gap-x-3 md:gap-x-5 py-4 md:py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-moon/40 rounded-sm"
                  >
                    <span aria-hidden className={`letterpress font-elegant italic text-sm tabular-nums transition-colors duration-300 ${open ? 'text-moon' : 'text-ink/35'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`letterpress font-elegant font-medium text-[1.1rem] md:text-[1.3rem] leading-snug tracking-[-0.01em] transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'text-moon' : 'text-ink group-hover:translate-x-1.5 group-hover:text-moon'}`}>
                      {faq.question}
                    </span>
                    {/* a bare + that turns into × when open — no container */}
                    <Plus aria-hidden className={`print-ink [filter:url(#pencil-icon)] lg:hidden self-center w-5 h-5 transition-[transform,color] duration-500 ${open ? 'rotate-45 text-moon' : 'text-ink/40 group-hover:text-moon'}`} strokeWidth={1.5} />
                    {/* desktop: an arrow pointing to the answer on the right */}
                    <PencilArrow weight="medium" className={`hidden lg:block self-center w-5 h-5 transition-[transform,opacity,color] duration-500 ${current === faq ? 'opacity-100 text-moon' : 'opacity-0 -translate-x-2 text-moon group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>

                  <div className={`lg:hidden grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      {/* the answer lines up under the question text, in a narrower column */}
                      <p className="letterpress pb-6 md:pb-7 pl-[2.75rem] md:pl-[4rem] pr-10 max-w-3xl text-ink/65 text-[0.95rem] md:text-base leading-[1.75] whitespace-pre-line font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </FadeIn>
                {index === filtered.length - 1 && <PencilRule weight="fine" className="text-ink/30" />}
              </li>
            );
          })}
        </ol>

        {/* desktop: the chosen question's answer */}
        <aside aria-live="polite" className="hidden lg:block lg:sticky lg:top-28">
          <div className="mb-6"><PencilRule weight="fine" className="text-ink/30" /></div>
          {current && (
            <div key={current.question} className="relative isolate px-8 py-8 animate-[faqIn_500ms_cubic-bezier(0.16,1,0.3,1)]">
              <SketchFrame />
              <p className="letterpress font-elegant italic text-sm tabular-nums text-moon">{String(currentNo).padStart(2, '0')}</p>
              <h3 className="letterpress-lg mt-2 font-elegant font-semibold text-ink text-[1.6rem] xl:text-[1.9rem] leading-[1.2] tracking-[-0.015em]">
                {current.question}
              </h3>
              <p className="letterpress mt-5 text-ink/65 text-base leading-[1.8] whitespace-pre-line font-light">
                {current.answer}
              </p>
            </div>
          )}
        </aside>
        </div>

        {/* closing — ask directly */}
        <FadeIn dir="up">
          <div className="mt-16 md:mt-20 text-center">
            <p className="letterpress-lg font-elegant italic text-ink/60 text-xl md:text-2xl">
              {isIndonesian ? 'Masih penasaran?' : 'Still curious?'}
            </p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp('faq', isIndonesian ? 'ID' : 'Global')}
              className="group mt-3 inline-flex items-center gap-3 font-elegant font-semibold text-ink text-[1.8rem] md:text-[2.6rem] leading-tight tracking-[-0.02em] hover:text-moon transition-colors duration-300"
            >
              <span className="letterpress-lg pb-[0.14em] -mb-[0.14em]">{isIndonesian ? 'Tanya langsung via WhatsApp' : 'Ask me on WhatsApp'}</span>
              <PencilArrow dir="up-right" press="display" weight="semibold" className="w-7 h-7 md:w-9 md:h-9 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FAQ;
