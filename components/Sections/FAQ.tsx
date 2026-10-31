import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowRight } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface FAQProps {
  isIndonesian?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
  cat: string;
}

const FAQ: React.FC<FAQProps> = ({ isIndonesian = false }) => {
  const faqsEN: FaqItem[] = [
    {
      cat: 'Process',
      question: "How does an email reading work?",
      answer: "After you purchase a reading via PayPal, I will receive your request. Please ensure you include your question in the notes or reply to the confirmation email. I will then meditate on your query, pull the cards, and send you a detailed PDF report including a photo of your spread within 24 hours."
    },
    {
      cat: 'Questions',
      question: "What kind of questions can I ask?",
      answer: "You can ask about relationships, career choices, personal growth, or general guidance. I specialize in strategic advice. However, I do not answer questions related to medical diagnoses, legal outcomes, or lottery numbers."
    },
    {
      cat: 'Process',
      question: "Do I need to be present for the reading?",
      answer: "For Email readings (3-Card and 5-Card), you do not need to be present. I connect with your energy remotely. For Live Sessions, we will meet via Google Meet at your scheduled time."
    },
    {
      cat: 'Booking',
      question: "What is your refund policy?",
      answer: "Since time and energy are expended during the reading process, all sales are final once the reading has been delivered. If you need to cancel a Live Session, please do so at least 24 hours in advance for a reschedule."
    },
    {
      cat: 'Tarot',
      question: "Is Tarot evil or scary?",
      answer: "Not at all. My practice is grounded in psychology and self-reflection. I use Tarot as a mirror to your subconscious to help you see options you might have missed. It is a tool for empowerment, not fear."
    }
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
            <h2 className="print-text pb-[0.14em] -mb-[0.14em] font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
              {isIndonesian ? 'Sering ditanyakan' : 'Frequently asked'}
            </h2>

            {/* category filter — a quiet row of words, the active one in purple italic */}
            <p className="print-body mt-6 md:mt-8 text-[0.95rem] md:text-base text-ink/50 font-light">
              {categories.map((cat, ci) => {
                const active = showAll ? cat === allLabel : cat === activeCat;
                return (
                  <React.Fragment key={cat}>
                    {ci > 0 && <span aria-hidden className="mx-1.5 text-ink/25">·</span>}
                    <button
                      onClick={() => pickCat(cat)}
                      aria-pressed={active}
                      className={`font-elegant text-[1.1rem] md:text-[1.2rem] transition-colors duration-300 underline-offset-[6px] decoration-1 ${active ? 'italic text-moon underline decoration-moon' : 'text-ink/70 hover:text-moon'}`}
                    >
                      {cat}
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
              <li key={faq.question} className="border-t border-ink/10 last:border-b">
                <FadeIn delay={Math.min(index, 6) * 55} dir="up" distance={0.6}>
                  <button
                    onClick={() => toggleFAQ(faq.question)}
                    aria-expanded={open}
                    className="group w-full grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2.75rem_1fr_auto] items-baseline gap-x-3 md:gap-x-5 py-4 md:py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-moon/40 rounded-sm"
                  >
                    <span aria-hidden className={`print-body font-elegant italic text-sm tabular-nums transition-colors duration-300 ${open ? 'text-moon' : 'text-ink/35'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`print-text font-elegant font-medium text-[1.1rem] md:text-[1.3rem] leading-snug tracking-[-0.01em] transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'text-moon' : 'text-ink group-hover:translate-x-1.5 group-hover:text-moon'}`}>
                      {faq.question}
                    </span>
                    {/* a bare + that turns into × when open — no container */}
                    <Plus aria-hidden className={`print-ink lg:hidden self-center w-5 h-5 transition-[transform,color] duration-500 ${open ? 'rotate-45 text-moon' : 'text-ink/40 group-hover:text-moon'}`} strokeWidth={1.5} />
                    {/* desktop: an arrow pointing to the answer on the right */}
                    <ArrowRight aria-hidden className={`print-ink hidden lg:block self-center w-5 h-5 transition-[transform,opacity,color] duration-500 ${current === faq ? 'opacity-100 text-moon' : 'opacity-0 -translate-x-2 text-ink/40 group-hover:opacity-100 group-hover:translate-x-0'}`} strokeWidth={1.5} />
                  </button>

                  <div className={`lg:hidden grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      {/* the answer lines up under the question text, in a narrower column */}
                      <p className="print-body pb-6 md:pb-7 pl-[2.75rem] md:pl-[4rem] pr-10 max-w-3xl text-ink/65 text-[0.95rem] md:text-base leading-[1.75] whitespace-pre-line font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </li>
            );
          })}
        </ol>

        {/* desktop: the chosen question's answer */}
        <aside aria-live="polite" className="hidden lg:block lg:sticky lg:top-28 border-t border-ink/10 pt-6">
          {current && (
            <div key={current.question} className="animate-[faqIn_500ms_cubic-bezier(0.16,1,0.3,1)]">
              <p className="print-body font-elegant italic text-sm tabular-nums text-moon">{String(currentNo).padStart(2, '0')}</p>
              <h3 className="print-text mt-2 font-elegant font-semibold text-ink text-[1.6rem] xl:text-[1.9rem] leading-[1.2] tracking-[-0.015em]">
                {current.question}
              </h3>
              <p className="print-body mt-5 text-ink/65 text-base leading-[1.8] whitespace-pre-line font-light">
                {current.answer}
              </p>
            </div>
          )}
        </aside>
        </div>

        {/* closing — ask directly */}
        <FadeIn dir="up">
          <div className="mt-16 md:mt-20 text-center">
            <p className="print-text font-elegant italic text-ink/60 text-xl md:text-2xl">
              {isIndonesian ? 'Masih penasaran?' : 'Still curious?'}
            </p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 inline-flex items-center gap-3 font-elegant font-semibold text-ink text-[1.8rem] md:text-[2.6rem] leading-tight tracking-[-0.02em] hover:text-moon transition-colors duration-300"
            >
              <span className="print-text pb-[0.14em] -mb-[0.14em]">{isIndonesian ? 'Tanya langsung via WhatsApp' : 'Ask me on WhatsApp'}</span>
              <ArrowUpRight className="w-7 h-7 md:w-9 md:h-9 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={1.5} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FAQ;
