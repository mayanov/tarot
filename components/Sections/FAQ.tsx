import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import CelestialMark from '../UI/CelestialMark';

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

  const toggleFAQ = (key: string) => setOpenKey((cur) => (cur === key ? null : key));

  return (
    // Its own lilac sheet with rounded top corners, rising over the section above
    // (the same move the About sheet makes over the hero), so it doesn't blend into
    // the white Events section.
    <section
      id="faq"
      className="relative isolate overflow-hidden -mt-10 md:-mt-14 rounded-t-[2.75rem] lg:rounded-t-[4.5rem] pt-20 md:pt-28 pb-24 md:pb-36 text-ink shadow-[0_-24px_60px_-28px_rgba(42,24,57,0.28)]"
      style={{ backgroundColor: '#EFE8F7' }}
    >
      {/* a large, faint crescent behind the title */}
      <CelestialMark name="crescent" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 md:top-8 -z-10 w-56 md:w-72 text-moon/[0.07]" />
      <div className="mx-auto px-8 relative z-10">
        {/* one centred column: title, then the category filter, then the questions */}
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <FadeIn dir="blur" duration={1.15}>
              <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                {isIndonesian ? 'Sering ditanyakan' : 'Frequently asked'}
              </h2>

              {/* category filter — editorial text tabs with an animated underline */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
                {categories.map((cat) => {
                  const active = showAll ? cat === allLabel : cat === activeCat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(cat)}
                      aria-pressed={active}
                      className={`rounded-full px-4 py-1.5 tracking-wide transition-colors duration-300 ${active ? 'bg-moon text-white font-semibold' : 'bg-white/60 text-ink/75 hover:bg-white hover:text-ink'}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </FadeIn>
          </div>

          {/* questions — text stays left-aligned inside the centred column so the
              answers are easy to read */}
          <div className="mt-10 md:mt-12">
            <div className="border-t border-moon/15">
              {filtered.map((faq, index) => {
                const open = openKey === faq.question;
                return (
                  <FadeIn key={faq.question} delay={Math.min(index, 6) * 55} dir="up" distance={0.7}>
                    <div className="border-b border-moon/15">
                      <button
                        onClick={() => toggleFAQ(faq.question)}
                        className="group w-full flex items-center justify-between gap-5 py-5 md:py-6 text-left focus:outline-none"
                        aria-expanded={open}
                      >
                        <span className="flex items-baseline gap-4">
                          <span aria-hidden className="w-6 shrink-0 font-elegant italic text-moon/70 text-sm md:text-base tabular-nums">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className={`font-elegant font-medium text-lg md:text-xl leading-snug tracking-tight transition-colors duration-500 ${open ? 'text-moon' : 'text-ink group-hover:text-moon'}`}>
                            {faq.question}
                          </span>
                        </span>
                        <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-500 ${open ? 'text-moon rotate-180' : 'text-ink/40'}`} />
                      </button>

                      <div className={`grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          {/* the answer, set in from the number with a thin purple rule */}
                          <p className="mb-6 ml-10 pl-4 pr-6 border-l-2 border-moon/40 text-ink/70 text-[0.95rem] md:text-base leading-relaxed whitespace-pre-line font-light">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
