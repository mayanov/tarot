import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface FAQProps {
    isIndonesian?: boolean;
}

const FAQ: React.FC<FAQProps> = ({ isIndonesian = false }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: isIndonesian ? "Bagaimana cara kerja reading via chat?" : "How does an email reading work?",
      answer: isIndonesian 
        ? "Simpel. Pilih paket, lakukan pembayaran, lalu kirim pertanyaanmu lewat WhatsApp. Saya akan analisa kartunya, lalu kirim hasilnya berupa Voice Note dan Teks (plus foto kartu) dalam 2-3 hari kerja. Kamu bisa dengar ulang kapan saja."
        : "After you purchase a reading via PayPal, I will receive your request. Please ensure you include your question in the notes or reply to the confirmation email. I will then meditate on your query, pull the cards, and send you a detailed PDF report including a photo of your spread within 24 hours."
    },
    {
      question: isIndonesian ? "Apa yang boleh ditanyakan?" : "What kind of questions can I ask?",
      answer: isIndonesian
        ? "Bebas, mulai dari karir, asmara, pengembangan diri, sampai situasi yang bikin galau. Fokus saya adalah strategi. Catatan: Saya TIDAK menjawab soal kesehatan medis, hasil hukum, atau nomor togel ya."
        : "You can ask about relationships, career choices, personal growth, or general guidance. I specialize in strategic advice. However, I do not answer questions related to medical diagnoses, legal outcomes, or lottery numbers."
    },
    {
      question: isIndonesian ? "Apakah saya harus online saat dibacakan?" : "Do I need to be present for the reading?",
      answer: isIndonesian
        ? "Kalau ambil paket Chat Reading, nggak perlu. Kamu tinggal tunggu hasilnya dikirim. Kalau ambil sesi Call (Google Meet), kita harus online bareng di waktu yang sudah dijadwalkan."
        : "For Email readings (3-Card and 5-Card), you do not need to be present. I connect with your energy remotely. For Live Sessions, we will meet via Google Meet at your scheduled time."
    },
    {
      question: isIndonesian ? "Apakah ada refund?" : "What is your refund policy?",
      answer: isIndonesian
        ? "Karena waktu dan energi sudah terpakai, penjualan bersifat final (no refund). Tapi kalau saya yang berhalangan hadir pas sesi Call, uangmu kembali 100% atau kita atur jadwal ulang."
        : "Since time and energy are expended during the reading process, all sales are final once the reading has been delivered. If you need to cancel a Live Session, please do so at least 24 hours in advance for a reschedule."
    },
    {
      question: isIndonesian ? "Apakah Tarot itu musyrik atau menakutkan?" : "Is Tarot evil or scary?",
      answer: isIndonesian
        ? "Sama sekali nggak. Saya pakai Tarot sebagai alat psikologi dan refleksi diri. Anggap aja cermin buat lihat pikiran bawah sadarmu sendiri. Tujuannya memberdayakan kamu buat ambil keputusan, bukan nakut-nakutin."
        : "Not at all. My practice is grounded in psychology and self-reflection. I use Tarot as a mirror to your subconscious to help you see options you might have missed. It is a tool for empowerment, not fear."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-bg-deep border-t border-white/5 relative">
      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-12">
             <span className="text-lilac font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                {isIndonesian ? "Pertanyaan Umum" : "Common Questions"}
             </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-serif mb-4">
                {isIndonesian ? "Sering Ditanyakan" : "Frequently Asked"}
            </h2>
            <p className="text-text-subtle text-lg max-w-xl mx-auto">
              {isIndonesian 
                ? "Segala hal tentang proses bacaan, etika, dan cara penyampaian."
                : "Everything you need to know about the reading process, ethics, and delivery."}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                    openIndex === index 
                    ? 'bg-[#1E1E2E] border-lilac/30 shadow-[0_4px_20px_-10px_rgba(192,160,255,0.2)]' 
                    : 'bg-[#151520] border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={`font-bold text-base md:text-lg transition-colors ${openIndex === index ? 'text-white' : 'text-gray-300'}`}>
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-full border transition-all duration-300 shrink-0 ml-4 ${openIndex === index ? 'border-lilac bg-lilac text-[#0F0F1A]' : 'border-white/20 text-white/50'}`}>
                    {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                
                <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="p-6 pt-0 text-text-subtle text-sm md:text-base leading-relaxed border-t border-white/5 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FAQ;