import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import SectionHeader from '../UI/SectionHeader';
import GrainyMesh from '../UI/GrainyMesh';

interface FAQProps {
  isIndonesian?: boolean;
}

const FAQ: React.FC<FAQProps> = ({ isIndonesian = false }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqsEN = [
    {
      question: "How does an email reading work?",
      answer: "After you purchase a reading via PayPal, I will receive your request. Please ensure you include your question in the notes or reply to the confirmation email. I will then meditate on your query, pull the cards, and send you a detailed PDF report including a photo of your spread within 24 hours."
    },
    {
      question: "What kind of questions can I ask?",
      answer: "You can ask about relationships, career choices, personal growth, or general guidance. I specialize in strategic advice. However, I do not answer questions related to medical diagnoses, legal outcomes, or lottery numbers."
    },
    {
      question: "Do I need to be present for the reading?",
      answer: "For Email readings (3-Card and 5-Card), you do not need to be present. I connect with your energy remotely. For Live Sessions, we will meet via Google Meet at your scheduled time."
    },
    {
      question: "What is your refund policy?",
      answer: "Since time and energy are expended during the reading process, all sales are final once the reading has been delivered. If you need to cancel a Live Session, please do so at least 24 hours in advance for a reschedule."
    },
    {
      question: "Is Tarot evil or scary?",
      answer: "Not at all. My practice is grounded in psychology and self-reflection. I use Tarot as a mirror to your subconscious to help you see options you might have missed. It is a tool for empowerment, not fear."
    }
  ];

  const faqsID = [
    {
      question: "Apa itu tarot reading?",
      answer: "Tarot reading adalah proses membaca simbol dari kartu tarot untuk membantu melihat situasi, pola, dan kemungkinan yang sedang kamu hadapi. Tarot digunakan sebagai alat refleksi dan panduan, bukan untuk menakut-nakuti atau menentukan nasib secara mutlak."
    },
    {
      question: "Apakah tarot bisa meramal masa depan?",
      answer: "Tarot tidak melihat masa depan sebagai sesuatu yang pasti dan tidak bisa diubah. Yang dibaca adalah energi dan kecenderungan berdasarkan kondisi saat ini. Pilihan dan tindakan kamu tetap punya peran besar dalam menentukan arah ke depannya."
    },
    {
      question: "Apakah saya harus percaya tarot agar reading-nya bekerja?",
      answer: "Tidak harus percaya sepenuhnya. Yang terpenting adalah datang dengan pikiran terbuka. Tarot paling efektif saat digunakan sebagai alat untuk memahami diri dan situasi dengan lebih jernih."
    },
    {
      question: "Pertanyaan apa saja yang bisa ditanyakan?",
      answer: "Tarot cocok untuk membahas: Percintaan & hubungan, Karier & pekerjaan, Keputusan hidup, Pengembangan diri, Kondisi emosi dan dinamika situasi"
    },
    {
      question: "Apakah ada pertanyaan yang tidak bisa dibaca?",
      answer: "Ya. Demi etika dan tanggung jawab, tarot reading tidak menerima pertanyaan mengenai: Kematian, Kehamilan, Judi, Barang atau hewan yang hilang"
    },
    {
      question: "Apakah pembayaran bisa dikembalikan (refund)?",
      answer: "Semua pembayaran bersifat non-refundable. Mohon pastikan kamu sudah yakin sebelum melakukan booking."
    },
    {
      question: "Bagaimana jika waktu sesi habis?",
      answer: "Jika waktu sesi sudah selesai, reading akan disimpulkan. Apabila ingin melanjutkan, sesi tambahan bisa dilakukan sesuai ketentuan yang berlaku."
    },
    {
      question: "Bagaimana cara kerja tarot reading via chat?",
      answer: "Setelah kamu memilih paket dan menyelesaikan pembayaran, kamu bisa langsung mengirimkan konteks cerita dan pertanyaan melalui WhatsApp chat. Hasil reading akan dikirim dalam bentuk: Foto kartu tarot yang keluar, dan Penjelasan dalam bentuk voice note, agar lebih jelas dan terasa personal."
    },
    {
      question: "Kapan sesi dimulai?",
      answer: "Untuk sesi online, reading dimulai setelah pembayaran diterima. Untuk sesi tatap muka, pembayaran dapat dilakukan sebelum sesi atau langsung di tempat."
    },
    {
      question: "Informasi apa yang perlu saya siapkan untuk reading?",
      answer: "Cukup siapkan: Nama, Cerita singkat atau konteks situasi. Foto atau tanggal lahir tidak wajib."
    },
    {
      question: "Apakah sesi tarot bersifat rahasia?",
      answer: "Ya. Kerahasiaan klien sepenuhnya dijaga. Cerita, pertanyaan, dan hasil reading tidak akan dibagikan tanpa persetujuan klien."
    },
    {
      question: "Apakah tarot bisa menggantikan profesional lain?",
      answer: "Tidak. Tarot bukan pengganti layanan profesional di bidang hukum, keuangan, kesehatan, atau psikologi."
    },
    {
      question: "Apakah hasil tarot bersifat mutlak?",
      answer: "Tidak. Tarot menunjukkan gambaran dan kemungkinan sementara. Masa depan bisa berubah seiring usaha dan pilihan yang kamu ambil."
    }
  ];

  const faqs = isIndonesian ? faqsID : faqsEN;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-16 md:py-24 relative overflow-hidden isolate border-y border-white/10"
    >
      <div className="max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <FadeIn>
          <SectionHeader
            num="06"
            label="FAQ"
            accent="text-plum"
            title={isIndonesian ? 'Sering ditanyakan' : 'Frequently asked'}
            intro={isIndonesian
              ? 'Segala hal tentang proses bacaan, etika, dan cara penyampaian.'
              : 'Everything about the reading process, ethics, and delivery.'}
          />

          <div className="border-t border-white/10">
            {faqs.map((faq, index) => {
              const open = openIndex === index;
              const tone = ['text-coral', 'text-mauve', 'text-[#88ADDA]', 'text-[#7FC08F]'][index % 4];
              return (
                <FadeIn key={index} delay={Math.min(index, 7) * 60}>
                <div className="border-b border-white/10">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="group w-full flex items-start justify-between gap-6 py-7 text-left focus:outline-none"
                    aria-expanded={open}
                  >
                    <span className="flex gap-4 md:gap-7 items-baseline">
                      <span className={`text-xl md:text-2xl font-serif font-semibold tabular-nums shrink-0 ${tone}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`font-serif font-medium text-xl md:text-2xl leading-snug tracking-tight transition-colors ${open ? tone : 'text-cream'}`}>
                        {faq.question}
                      </span>
                    </span>
                    <Plus className={`w-6 h-6 mt-1 shrink-0 transition-all duration-300 ${open ? `rotate-45 ${tone}` : 'text-cream/50'}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="pb-8 md:pl-[3.6rem] text-cream/70 text-base md:text-lg leading-relaxed whitespace-pre-line font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
                </FadeIn>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FAQ;