import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface TestimonialsProps {
  isIndonesian?: boolean;
}

const Testimonials: React.FC<TestimonialsProps> = ({ isIndonesian = false }) => {

  const reviewsEN = [
    {
      text: "had a 1 hr call session with Mayanov and it was suuuuper great. she really helped me out when i got stuck on what to ask next and didn't judge my 'stupid' questions (lol, thank u!). i actually feel relieved after the call, not just because of the reading, but because i could pour out everything i was curious about before. thank youuuuu~",
      author: "Dessy A.",
      location: "Google Review"
    },
    {
      text: "maya is such a beautiful soul. she’s also passionate about reading the cards and very accommodating in answering all my questions. and on top of anything, no questions is petty or insignificant. all is welcome and she’s happily to open the cards for us. def a happy client here.",
      author: "Novita P.",
      location: "Google Review"
    },
    {
      text: "Had my first tarot session today and it was such a great experience! It was clear and insightful and I felt super comfortable throughout, will definitely do it again hehe 😆😆",
      author: "Azirah B.",
      location: "Google Review"
    },
    {
      text: "I had an incredibly insightful and helpful tarot reading with Maya. She was able to connect with me on a deep level and interpret the cards in a way that was incredibly relevant to my life. Her guidance was supportive and non-judgmental, and I felt truly seen and heard. Super impressed with her and her sessions were always very healing 🫶🏼 Thank you so much Maya!",
      author: "Sid H.",
      location: "Google Review"
    },
    {
      text: "This is my first tarot reading of my life and I find the reading sessions with Maya really helpful and was a comforting experience. During some of the questions I asked, She is being proactive and kind enough to do additional reading by herself so that I can get the best answer possible",
      author: "Surya",
      location: "Google Review"
    },
    {
      text: "She is the best tarot reader so far, in my opinion. Kak Maya provides explanations that are easy to understand and simple. I feel guided by her...",
      author: "Fahmi P.",
      location: "Google Review"
    },
    {
      text: "very eloquent and structured in interpreting her cards. A good listener and observer, Maya always makes reading sessions straightforwardly eye-opening.",
      author: "Anestya P.",
      location: "Google Review"
    },
    {
      text: "Spot on reading by Maya. Great personality! gives clarity and the whole experience was an eye opening.",
      author: "Nichola N.",
      location: "Google Review"
    },
    {
      text: "love my session with maya! her readings and explanations were very clear. very understanding, no judgement, she helped with some advises as well :) very recommended.",
      author: "Halena R.",
      location: "Google Review"
    },
    {
      text: "Good listener and the readings are on point, giving a concrete examples and advice also! Can talk normally with her, no need to be nervous :D",
      author: "Celine C.",
      location: "Google Review"
    },
    {
      text: "She was so kind, on time, and she kindly helped me to understand the readings. It was really helpful for me to connect the dots. Thank you so much, Maya!",
      author: "Carissa N.",
      location: "Google Review"
    },
    {
      text: "It was a fun experience. I loved how she delivered the messages, so insightful.",
      author: "Vasa A.",
      location: "Google Review"
    },
    {
      text: "She’s so polite, willing to listen to our problems. No judgmental statement from her. She’s really a good reader and a good listener",
      author: "Vivi S.",
      location: "Google Review"
    },
    {
      text: "Hit her up for tarot readings!! She's great at them and super sweet! 😊😊",
      author: "Tasya P.",
      location: "Google Review"
    },
    {
      text: "I don't really trust tarot, except for this one. Top notch reading 👍",
      author: "Astrid D.",
      location: "Local Guide"
    },
    {
      text: "A nice person to talk to, can give a good common sense behind the Tarot reading.. Recommended..",
      author: "Fauke B.",
      location: "Google Review"
    },
    {
      text: "A very heartfelt consultation💗 Tysm Maya!!",
      author: "Naomi L.",
      location: "Google Review"
    }
  ];

  // REAL REVIEWS FROM GOOGLE (Transcribed & Anonymized)
  const reviewsID = [
    {
      text: "Bintangnya cuma Lima aja??? Kurang! Dibacain tarot sama Mayanov tuh kek main \"Dingdong\" pingin nambah koin terus. Seasik itu. Ga mau udahan. Cuy kok ya pas semua bacaannya. Wagelaseh. Mayanov selalu punya jawaban atas segala pertanyaan dan pernyataan. Bikin nyaman kek dipeluk orang yang kita sayang (tsaelah).",
      author: "Rica E.",
      location: "Google Review"
    },
    {
      text: "Kakaknya asik, ramah, blunt tapi ngena banget. Ini lebih ke sesi self improvement sama inner work sih. Seperti ngobrol curhat sama bestie tapi ada kesimpulan yang jelas.",
      author: "Raissa A.",
      location: "Local Guide"
    },
    {
      text: "Terima kasih Mayanov yang sudah menampar aku dengan bacaan tarotnya. Ini pembacaan yg evaluatif dan rasional, Maya juga sampaikan saran-saran yg antisipatif dan make sense berdasarkan bacaan tarotnya.",
      author: "Violla R.",
      location: "Google Review"
    },
    {
      text: "Thank you Maya!!! super seneng bisa dibacain sm Maya, cara memberi masukannya jelas dan eye opening, menenangkan :)",
      author: "Nadya A.",
      location: "Google Review"
    },
    {
      text: "First time reading tarot for me, dan seru bgt bisa sharing sm kak maya! Thank you kak udah bantu kasih saran dan jalan keluar dari masalah yg cukup buntu ini haha.",
      author: "Nadhila S.",
      location: "Google Review"
    },
    {
      text: "Ngobrol sama Maya seperti ngobrol dengan teman lama, walau baru kenal. She's a good listener dan berusaha memberikan saran2 yang mungkin bisa membantu kedepannya.",
      author: "Nana S.",
      location: "Local Guide"
    },
    {
      text: "Very very very helpful biar dikata dari sesi tafsir tarot, malah jadi curhat x gibah berkepanjangan HAHAHA. Lebih ke spiritual guidance nya oke banget, saya sih yes.",
      author: "N. Sadav",
      location: "Google Review"
    },
    {
      text: "My tarot reading with Maya was truly insightful and professional. For me, this reading was more like talking to a therapist. 🥹😆 Maya explained things fluently, contextually, and provided doable solutions.",
      author: "Annisa A.",
      location: "Local Guide"
    },
    {
      text: "Ka maya friendly banget, spt ngobrol sama temen sendiri, cara ngejelasinnya mudah di cerna, bebas nanya apa aja selama 30 menit itu sampe ga terasa sesinya berakhir hehe.",
      author: "Desti R.",
      location: "Google Review"
    },
    {
      text: "VERY ON POINTTTT! very eye-opening indeed dan cara jelasinnya juga very clear jadi cepet paham dan nyambunginnya juga. will for sure do another reading here.",
      author: "Dea A.",
      location: "Google Review"
    },
    {
      text: "Aku suka sih sesi aku yang satu jam...pertama aku kira bakal kelamaan dan awkward tapi lama lama enggak kok dan pertanyaan yang di bisa di tanya banyak banget jadi aku suka. Kartu-kartu yang keluat juga di jelasin dengan baik.",
      author: "Marcello T.",
      location: "Local Guide"
    },
    {
      text: "Thankyou so much mba Maya tlh mendengar keluh kesah saya. Tanpa saya jelaskan secara detail mengenai persoalan saya bacaan kartu mba Maya sngt akurat.",
      author: "Grace T.",
      location: "Google Review"
    },
    {
      text: "I just want to say thank you Mba Maya for the session! Very eye-opening dan jadi makin yakin sama yang udah dijalanin. Will go back to you for another sessions in the future 😁",
      author: "Ayu G.",
      location: "Google Review"
    },
    {
      text: "Sesi tarotnya seru, humble kakaknya , setiap kartu yang dibacakan itu detail dan jelas , enak dan nyaman diajak curhat jadi jatuhnya sesi ngobrolnya juga lebih santai.",
      author: "Yeni O.",
      location: "Google Review"
    },
    {
      text: "Thankyou bgt kakk udah dibacain, puas bgt karna bisa buka pandangan aku yg awalnga kalut jd lebih bisa yakin sm next step nya harus gimana, very helping dan enak bgt ngobrolnya.",
      author: "Hana A.",
      location: "Google Review"
    },
    {
      text: "SPOT ON!!! Cukup dapet clarity yg jelas untuk lebih memahami lebih dalam ttg diri sendiri and what to do.",
      author: "Maharani S.",
      location: "Google Review"
    },
    {
      text: "RELATEEEE! Dan bener-bener ngebuka pikiran bgttt, thankyouuu!🫶🏻",
      author: "Anggie A.",
      location: "Google Review"
    },
    {
      text: "Really helpfulll. Gak cuman readingnya yang oke, tpi bisa juga sambil curcol dan dpt saran juga based on reading. Makasiii kakkk 😊😊",
      author: "Claresta P.",
      location: "Local Guide"
    },
    {
      text: "Kartu yg pertama kali kaka keluarin tentang pertemuan kita itu bener banget, layaknya orang yg melepas rindu. Makasih banyak ya ka Maya ✨💕",
      author: "Ann K.",
      location: "Google Review"
    },
    {
      text: "Sangat membantu dalam memberikan jawaban dari semua pertanyaan yang saya ajukan, memberikan saran dan masukan yang sangat relevan dan memberitahu saya hal-hal apa di dalam diri saya yang harus saya tingkatkan 🙏",
      author: "Putri A.",
      location: "Google Review"
    },
    {
      text: "Enakkk buat ngobrol, dan resonate apa yg dibilang tentang doi. Makasih banyak kak pikiranku jadi terbukaaa",
      author: "Greantea L.",
      location: "Google Review"
    }
  ];

  const reviews = isIndonesian ? reviewsID : reviewsEN;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to the first review when the market (and thus the list) changes.
  useEffect(() => { setIndex(0); }, [isIndonesian]);

  // Auto-advance one review every few seconds; pause on hover.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 5000);
    return () => clearInterval(id);
  }, [paused, reviews.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + reviews.length) % reviews.length);

  return (
    <section id="testimonials" className="py-12 md:py-16 relative overflow-hidden isolate border-y border-white/[0.08] text-cream">
      {/* spotlight band — a soft lit stage glowing out of the near-black ground */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: '#0B0B0D' }}>
        <div
          className="absolute left-1/2 top-1/2 h-[130%] w-[80%] max-w-[1050px] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.025) 42%, transparent 72%)' }}
        />
      </div>
      <FadeIn>
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 mb-12 md:mb-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-8">
            <div>
              <h2 className="text-[1.9rem] md:text-[2.5rem] leading-[1.05] font-elegant font-medium text-cream tracking-[-0.02em]">
                {isIndonesian ? 'Apa kata mereka' : 'What others are saying'}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0 md:pb-2">
              <div className="flex text-cream">
                {[1, 2, 3, 4, 5].map((st) => (<Star key={st} className="w-4 h-4 fill-current" />))}
              </div>
              <span className="text-cream font-medium ml-1">5.0</span>
              <span className="text-cream/70">· {isIndonesian ? 'Rating rata-rata di Google' : 'Average rating on Google'}</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Auto-advancing — arrows flank the quote; all reviews are stacked so the
          block height always fits the LONGEST one (no jump when it changes). */}
      <div
        className="relative max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* prev — plain chevron, at the section's left margin */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={isIndonesian ? 'Sebelumnya' : 'Previous'}
          className="absolute left-3 md:left-8 lg:left-10 top-1/2 -translate-y-1/2 z-10 p-2 text-cream/45 hover:text-moon transition-colors duration-300"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
        </button>
        {/* next — plain chevron, at the section's right margin */}
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={isIndonesian ? 'Berikutnya' : 'Next'}
          className="absolute right-3 md:right-8 lg:right-10 top-1/2 -translate-y-1/2 z-10 p-2 text-cream/45 hover:text-moon transition-colors duration-300"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
        </button>

        <div className="relative z-10 grid max-w-5xl mx-auto px-4 sm:px-6">
          {reviews.map((r, i) => {
            const active = i === index;
            return (
              <div
                key={i}
                aria-hidden={!active}
                style={{ gridArea: '1 / 1' }}
                className={`flex flex-col items-center justify-center text-center transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <p className="text-cream text-xl md:text-3xl leading-relaxed font-normal">
                  <span className="font-elegant text-moon/70 align-baseline">&ldquo;</span>{r.text}<span className="font-elegant text-moon/70 align-baseline">&rdquo;</span>
                </p>
                {/* attribution — italic serif with a dash */}
                <div className="mt-8 font-elegant italic text-cream/90 text-lg md:text-xl">
                  <span className="not-italic text-moon mr-2">&mdash;</span>{r.author}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-12 md:mt-14 px-4">
        <a
          href="https://share.google/4LrmhpcgHNXX9bTzr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-none border border-cream/30 hover:border-cream hover:bg-cream hover:text-ink transition-all duration-300 text-cream font-medium group"
        >
          <span>{isIndonesian ? 'Lihat Semua Review di Google' : 'Read All Reviews on Google'}</span>
        </a>
      </div>
    </section>
  );
};

// Simple Star Icon component for local use if needed, though Lucide handles it.
const Star: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

export default Testimonials;