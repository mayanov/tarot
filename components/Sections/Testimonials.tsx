import React, { useRef, useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface TestimonialsProps {
  isIndonesian?: boolean;
}

const Testimonials: React.FC<TestimonialsProps> = ({ isIndonesian = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Create loop array
  // If list is small, duplicate it to ensure infinite scroll looks smooth
  // But now the list is quite long (21 items), so duplicating once is enough or might not even be needed if items > screen width
  const loopingReviews = [...reviews, ...reviews];

  // Drag to scroll logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Auto-scroll logic
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    let requestID: number;
    const speed = 0.4; // pixels per frame

    const animate = () => {
      if (!isDown) {
        slider.scrollLeft += speed;
        // If we reach the middle point of loopingReviews, reset to 0 for infinite feel
        if (slider.scrollLeft >= slider.scrollWidth / 2) {
          slider.scrollLeft = 0;
        }
      }
      requestID = requestAnimationFrame(animate);
    };

    requestID = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestID);
  }, [isDown]);

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-bg-dark border-t border-white/5">
      {/* Background Accent */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-teal-accent/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-lilac/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-full mx-auto">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-serif mb-6">
              {isIndonesian ? "Apa Kata Mereka" : "What Others Are Saying"}
            </h2>
            {/* 5-Star Rating Info */}
            <div className="flex justify-center items-center gap-2 mb-6 text-teal-accent font-bold animate-pulse-slow">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current text-gold-accent" />
                ))}
              </div>
              <span className="text-white ml-2">
                {isIndonesian ? "5.0 Rating Rata-rata di Google" : "5.0 Average Rating on Google"}
              </span>
            </div>

            <p className="text-text-subtle text-lg max-w-2xl mx-auto">
              {isIndonesian
                ? "Begini kata mereka yang udah pernah tarot reading sama Mayanov"
                : "Don't just take my word for it. Here’s how others found their way with a little help from the cards."}
            </p>
          </div>

          {/* Infinite Scroll Container */}
          <div className="relative w-full mask-image-gradient-horizontal">
            {/* Gradient Masks for edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-bg-dark to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-bg-dark to-transparent z-10 pointer-events-none"></div>

            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing px-4 select-none"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {loopingReviews.map((review, index) => (
                <div
                  key={index}
                  className="w-[300px] md:w-[400px] flex-shrink-0 bg-[#1E1E2E] border border-white/5 p-8 rounded-2xl relative shadow-lg transition duration-300 flex flex-col"
                >
                  {/* Top Border Accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lilac/20 to-transparent transition-all duration-500"></div>

                  <Quote className="absolute top-6 left-6 w-8 h-8 text-lilac/20 transition duration-300" />
                  <p className="text-text-light/90 mb-6 relative z-10 italic leading-relaxed pt-6 font-medium text-sm md:text-base flex-grow">
                    "{review.text}"
                  </p>
                  <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-auto">
                    <div>
                      <div className="font-bold text-white text-sm">{review.author}</div>
                      <div className="text-xs text-text-subtle font-medium tracking-wide">{review.location}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold-accent opacity-80"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Review Button */}
          <div className="text-center mt-12">
            <a
              href="https://share.google/4LrmhpcgHNXX9bTzr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E1E2E] border border-white/10 hover:bg-white hover:text-bg-dark transition-all duration-300 text-teal-accent hover:border-teal-accent font-bold group"
            >
              <Star className="w-5 h-5 fill-current group-hover:text-gold-accent transition-colors" />
              <span>{isIndonesian ? "Lihat Semua Review di Google" : "Read All Reviews on Google"}</span>
            </a>
          </div>

        </FadeIn>
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