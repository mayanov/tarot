// The sound of a page being turned, synthesised (no audio file to load): a swish of
// filtered noise as the sheet moves through the air, flickering a little like paper
// does, then a soft pat as it settles on the page below. Quiet on purpose. Only ever
// played from a click (browsers allow audio after a user gesture).

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

/** `turn`: the length of the page's swing in ms, so the pat lands as it settles */
export const playPageTurn = (turn = 700) => {
  try {
    const ac = audio();
    if (!ac || !noise) return;
    const t = ac.currentTime + 0.01;
    const dur = turn / 1000;
    const out = ac.createGain();
    out.gain.value = 0.22;
    out.connect(ac.destination);

    // the swish: band-passed noise rising in pitch as the sheet speeds up
    const swish = ac.createBufferSource();
    swish.buffer = noise;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.9);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
    // the flicker of a page in the air: a few quick, uneven dips in loudness
    const flutter = ac.createGain();
    for (let i = 0, at = t + 0.04; at < t + dur * 0.8; i++, at += 0.03 + Math.random() * 0.04) {
      flutter.gain.setValueAtTime(0.55 + Math.random() * 0.45, at);
    }
    swish.connect(bp).connect(env).connect(flutter).connect(out);
    swish.start(t, Math.random() * 0.4, dur);

    // the pat: a short, low burst as it lands
    const pat = ac.createBufferSource();
    pat.buffer = noise;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const penv = ac.createGain();
    const land = t + dur * 0.85;
    penv.gain.setValueAtTime(0.0001, land);
    penv.gain.exponentialRampToValueAtTime(0.7, land + 0.008);
    penv.gain.exponentialRampToValueAtTime(0.0001, land + 0.09);
    pat.connect(lp).connect(penv).connect(out);
    pat.start(land, Math.random() * 0.5, 0.12);
  } catch {
    // no sound is fine
  }
};
