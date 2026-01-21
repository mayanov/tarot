import React from 'react';

const Background: React.FC = () => {
  return (
    <>
      {/* 1. The Fixed Gradient Background */}
      <div
        className="fixed top-0 left-0 w-full h-full -z-30 bg-[#242434]"
      >
        {/* Animated Orbs - More widely dispersed */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-purple-900/10 to-blue-900/10 blur-[150px] animate-pulse-slower" />

        {/* Warm Gold/Amber Orb */}
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[160px] animate-pulse-slow" />

        <div className="absolute bottom-[-10%] right-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-teal-900/10 to-emerald-900/5 blur-[140px] animate-pulse-slow" />
      </div>

      {/* 2. Tarot Card Shapes Overlay */}
      <div className="fixed top-0 left-0 w-full h-full -z-25 pointer-events-none overflow-hidden">
        {/* Card 1: Top Left */}
        <div className="absolute top-[10%] left-[5%] w-48 h-80 border border-white/5 rounded-2xl rotate-[-12deg] opacity-20 animate-float-slow">
          <div className="absolute inset-2 border border-white/5 rounded-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30"></div>
        </div>

        {/* Card 2: Bottom Right */}
        <div className="absolute bottom-[15%] right-[5%] w-64 h-96 border border-lilac/5 rounded-2xl rotate-[15deg] opacity-20 animate-float-slower">
          <div className="absolute inset-4 border border-lilac/5 rounded-xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-lilac/5"></div>
        </div>

        {/* Card 3: Middle Left - Small */}
        <div className="absolute top-[45%] left-[-2%] w-32 h-52 border border-teal-accent/5 rounded-xl rotate-[5deg] opacity-10 animate-float">
          <div className="absolute inset-0 bg-teal-accent/5 opacity-10"></div>
        </div>

        {/* Card 4: Top Right - Angled */}
        <div className="absolute top-[-5%] right-[15%] w-40 h-64 border border-gold-accent/5 rounded-2xl rotate-[25deg] opacity-10 animate-float-delayed">
          <div className="absolute inset-2 border border-gold-accent/5 rounded-xl border-dashed"></div>
        </div>
      </div>

      {/* 3. The Star Field */}
      <div
        className="fixed top-0 left-0 w-full h-full -z-20 opacity-60 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(rgba(255,255,255,0.2) 1.5px, transparent 2px),
            radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1.5px)
          `,
          backgroundSize: '550px 550px, 350px 350px',
          backgroundPosition: '0 0, 40px 60px'
        }}
      />

      {/* 4. Lighter Grain Overlay */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-125 contrast-125 mix-blend-overlay"></div>
    </>
  );
};

export default Background;