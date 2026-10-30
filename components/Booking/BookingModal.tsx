import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { X, Check, ChevronRight, ArrowLeft, CalendarDays, Clock, Copy } from 'lucide-react';
import CelestialMark from '../UI/CelestialMark';
import { FaWhatsapp } from 'react-icons/fa';
import { SLOT_TIMES, CLOSING_TIME, getTakenSlots, createBooking, slotSpan } from '../../services/booking';
import { trackEvent, SERVICE_TRACK_NAME } from '../../services/analytics';
import { lockPage, unlockPage } from '../UI/scroll';

interface BookingModalProps {
  isIndonesian?: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
  meta: string;
  desc: string; // one-line explanation shown on the service picker
  scheduled: boolean; // needs a date & time slot?
  packages?: string[]; // if set, the visitor must pick one
  price?: string; // fixed price when there are no packages
}

// Per-service weekday restrictions for scheduled sessions (0=Sun … 6=Sat).
// The listed days are DISABLED in the date picker.
//   call   → Mon–Fri only (disable Sun, Sat)
//   meetup → Fri & Sun only (disable Mon–Thu, Sat)
// Services not listed here allow any upcoming day.
const DISABLED_DOWS: Record<string, number[]> = {
  call: [0, 6],
  meetup: [1, 2, 3, 4, 6],
};

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Add minutes to a 'HH:mm' string → 'HH:mm'.
const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// 'YYYY-MM-DD' → 'dd Mon YYYY' in the visitor's language (29 Agu 1994 / 29 Aug 1994)
const fmtLongDate = (iso: string, lang: 'id' | 'en' = 'en') => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const mon = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short' });
  return `${String(d).padStart(2, '0')} ${mon} ${y}`;
};

// Pull the price token out of a package/service string ('· Rp 315K', '$20').
const priceFromText = (s?: string | null): string => {
  if (!s) return '';
  const m = s.match(/Rp\s?[\d.,]+\s?(?:K|JT|jt|rb)?|\$\s?[\d.,]+/i);
  return m ? m[0].trim() : '';
};

// Read a duration in minutes out of a package/meta string ('30 Menit', '1 jam', 'Google Meet · 30 min').
const durationFromText = (s?: string | null): number | null => {
  if (!s) return null;
  const min = s.match(/(\d+)\s*(menit|min)/i);
  if (min) return parseInt(min[1], 10);
  const jam = s.match(/(\d+)\s*(jam|hour|hr)/i);
  if (jam) return parseInt(jam[1], 10) * 60;
  if (/jam|hour/i.test(s)) return 60;
  return null;
};

// Payment details shown on the success step (Indonesian market).
// TODO: replace these placeholders with the real values, and drop the QRIS
// image at public/payment-qris.png.
const PAYMENT = {
  bankName: 'BCA',
  accountNumber: '0000000000',
  accountHolder: 'Mayanov Tarot',
  qrSrc: '/payment-qris.png',
  waNumber: '6287786280310', // business WhatsApp (same as the footer / floating button)
};

// Each service wears its pricelist card's colour and mark, so the picker ties back to
// the cards the visitor just saw.
const SERVICE_LOOK: Record<string, { accent: string; mark: 'constellation' | 'star' | 'sparkle' | 'crescent' | 'sun' }> = {
  special: { accent: '#22396F', mark: 'constellation' },
  chat: { accent: '#39234E', mark: 'star' },
  call: { accent: '#CB3B5F', mark: 'sparkle' },
  meetup: { accent: '#F76949', mark: 'crescent' },
  '3card': { accent: '#22396F', mark: 'constellation' },
  '5card': { accent: '#39234E', mark: 'star' },
};

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Booking from a pricelist card: the card's paper details side grows into this form.
// A blank sheet of paper fades in over the card (COVER), grows to the form's size and
// place (MORPH), then the form's content fades in on it (REVEAL). Back runs it in reverse.
const COVER_MS = 160; // matches MORPH_COVER_MS in Services
const MORPH_MS = 480;
const REVEAL_MS = 220;
type Rect = { left: number; top: number; width: number; height: number };
type MorphPhase = 'cover' | 'grow' | 'reveal' | 'hide' | 'shrink' | 'uncover';

const BookingModal: React.FC<BookingModalProps> =({ isIndonesian = false }) => {
  const [open, setOpen] = useState(false);
  // opened from a pricelist card (which stays open underneath): no backdrop of its own,
  // and the form grows out of the card (`morph`, with the form's own rect once measured)
  const [seamless, setSeamless] = useState(false);
  const [morph, setMorph] = useState<{ phase: MorphPhase; panel?: Rect } | null>(null);
  const cardRect = useRef<Rect | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const measurePanel = (): Rect | undefined => {
    const r = panelRef.current?.getBoundingClientRect();
    return r && { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  const [step, setStep] = useState(0); // 0 service · 1 date/time · 2 details · 3 done
  const [service, setService] = useState<ServiceOption | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [pkg, setPkg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPay, setShowPay] = useState(false); // reveal payment details on the success step
  const [payTab, setPayTab] = useState<'qris' | 'bank'>('qris');
  const [copied, setCopied] = useState(false);
  const [qrMissing, setQrMissing] = useState(false); // QRIS image not uploaded yet
  // date of birth as three fields (day / month / year); `dob` (YYYY-MM-DD) is derived
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const t = (id: string, en: string) => (isIndonesian ? id : en);

  const services: ServiceOption[] = isIndonesian
    ? [
        { id: 'chat', name: 'Konsultasi via Chat', meta: 'WhatsApp · per pertanyaan', desc: 'Tanya-jawab santai lewat WhatsApp, dijawab dalam bentuk teks. Fleksibel untuk pertanyaan spesifik.', scheduled: false, packages: ['1 Pertanyaan · Rp 140K', '3 Pertanyaan · Rp 315K'] },
        { id: 'call', name: 'Panggilan Suara & Video', meta: 'Real-time · pilih durasi', desc: 'Ngobrol langsung via suara atau video. Lebih interaktif, tanya sepuasnya selama durasi.', scheduled: true, packages: ['30 Menit · Rp 220K', '60 Menit · Rp 360K'] },
        { id: 'meetup', name: 'Sesi Tatap Muka', meta: 'Jakarta Selatan', desc: 'Ketemu langsung di Jakarta Selatan — pengalaman paling personal dan mendalam.', scheduled: true, packages: ['1 Jam · Rp 450K', '2 Jam · Rp 810K', '3 Jam · Rp 1,17JT'] },
        { id: 'special', name: 'Edisi Spesial', meta: 'Bacaan tematik (PDF)', desc: 'Bacaan tematik khusus (mis. New Year Reading), dikirim rapi dalam bentuk PDF.', scheduled: false, price: 'Rp 250K' },
      ]
    : [
        { id: '3card', name: '3-Card Spread', meta: 'Email · within 24h', desc: 'A focused three-card reading for a clear question, delivered by email within 24 hours.', scheduled: false, price: '$12' },
        { id: '5card', name: '5-Card Deep', meta: 'Email · in-depth', desc: 'A deeper five-card spread with more detail and nuance, delivered by email.', scheduled: false, price: '$20' },
      ];

  const reset = useCallback(() => {
    setStep(0); setService(null); setDate(undefined); setTime(null); setPkg(null);
    setName(''); setDob(''); setDobDay(''); setDobMonth(''); setDobYear(''); setWhatsapp(''); setEmail(''); setError(''); setSubmitting(false); setShowPay(false); setPayTab('qris'); setCopied(false);
  }, []);

  // opened from a pricelist card (still open underneath): closing the form closes that too
  const close = useCallback(() => {
    if (returnToCard.current !== null) window.dispatchEvent(new CustomEvent('close-pricelist-card'));
    returnToCard.current = null;
    setOpen(false);
  }, []);

  // growing out of the card: measure where the form will sit (it is laid out, just
  // invisible), then run the phases
  useLayoutEffect(() => {
    if (!open || morph?.phase !== 'cover' || morph.panel) return;
    const panel = measurePanel();
    if (!panel) { setMorph(null); return; }
    setMorph({ phase: 'cover', panel });
    window.setTimeout(() => setMorph({ phase: 'grow', panel }), COVER_MS);
    window.setTimeout(() => setMorph({ phase: 'reveal', panel }), COVER_MS + MORPH_MS);
    window.setTimeout(() => setMorph(null), COVER_MS + MORPH_MS + REVEAL_MS);
  }, [open, morph]);

  // keep `dob` in sync with the three fields (only a real, past date counts)
  useEffect(() => {
    const d = parseInt(dobDay, 10), m = parseInt(dobMonth, 10), y = parseInt(dobYear, 10);
    const ok = d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && dobYear.length === 4;
    if (!ok) { setDob(''); return; }
    const dt = new Date(y, m - 1, d);
    if (dt.getDate() !== d || dt > new Date()) { setDob(''); return; }
    setDob(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }, [dobDay, dobMonth, dobYear]);

  // When the form was opened from a pricelist card, "back" past the first step returns
  // to that card (reopened on its details) instead of the generic service picker.
  const returnToCard = useRef<number | null>(null);
  const goBack = () => {
    const target = step === 3 ? 2 : step === 2 ? (scheduled ? 1 : 0) : 0;
    if (target === 0 && returnToCard.current !== null) {
      if (morph) return;
      const index = returnToCard.current;
      returnToCard.current = null;
      const reopen = () => window.dispatchEvent(new CustomEvent('reopen-pricelist-card', { detail: { index } }));
      const panel = measurePanel();
      if (!cardRect.current || !panel) { reopen(); setOpen(false); return; }
      // the form's content fades off its paper, the paper shrinks onto the card, and
      // fades away to show the card (back on top, on its details) underneath
      setMorph({ phase: 'hide', panel });
      window.setTimeout(() => setMorph({ phase: 'shrink', panel }), COVER_MS);
      window.setTimeout(() => { reopen(); setMorph({ phase: 'uncover', panel }); }, COVER_MS + MORPH_MS);
      window.setTimeout(() => { setOpen(false); setMorph(null); }, COVER_MS * 2 + MORPH_MS);
      return;
    }
    setStep(target);
  };

  // Picking a service inside the form (opened from the header/hero "Pesan", not a
  // pricelist card) counts as seeing that service and clicking Pesan for it, so the
  // admin's booking funnel (opened → Pesan → booked) adds up for every booking.
  const pickService = (s: ServiceOption) => {
    setService(s);
    const name = SERVICE_TRACK_NAME[s.id];
    if (!name) return;
    const market = isIndonesian ? 'ID' : 'Global';
    trackEvent('view_item', { item_name: name, market }, 'ViewContent', { content_name: name });
    trackEvent('begin_checkout', { item_name: name, market }, 'InitiateCheckout', { content_name: name });
  };

  // Open via a global event (dispatched by the nav / CTA buttons).
  useEffect(() => {
    const onOpen = (e: Event) => {
      reset();
      const detail = (e as CustomEvent<{ serviceId?: string; returnToCard?: number; cardRect?: Rect }>).detail;
      returnToCard.current = typeof detail?.returnToCard === 'number' ? detail.returnToCard : null;
      setSeamless(returnToCard.current !== null);
      const morphs = !!detail?.cardRect && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      cardRect.current = morphs ? detail!.cardRect! : null;
      setMorph(morphs ? { phase: 'cover' } : null);
      const preset = detail?.serviceId ? services.find((s) => s.id === detail.serviceId) : undefined;
      if (preset) { setService(preset); setStep(preset.scheduled ? 1 : 2); }
      setOpen(true);
      // opened from a pricelist card's "Pesan" → counted as a click for that service
      trackEvent('begin_checkout', { item_name: (preset && SERVICE_TRACK_NAME[preset.id]) || 'Booking flow', market: isIndonesian ? 'ID' : 'Global' });
    };
    window.addEventListener('open-booking', onOpen);
    return () => window.removeEventListener('open-booking', onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndonesian]);

  // Lock scroll while open — stop Lenis too, or it keeps scrolling the page behind.
  // Lock scroll while open — stops Lenis too, or it keeps scrolling the page behind.
  useEffect(() => {
    if (!open) return;
    lockPage();
    return unlockPage;
  }, [open]);

  // Load taken slots when a date is picked.
  useEffect(() => {
    if (!date) { setTaken([]); return; }
    let active = true;
    getTakenSlots(toISODate(date)).then((s) => { if (active) setTaken(s); });
    return () => { active = false; };
  }, [date]);

  const submit = async () => {
    if (!service) return;
    if (service.scheduled && (!date || !time)) return;
    setSubmitting(true); setError('');
    try {
      await createBooking({
        serviceId: service.id,
        serviceName: pkg ? `${service.name} · ${pkg}` : service.name,
        date: service.scheduled && date ? toISODate(date) : '',
        time: service.scheduled ? (time || '') : '',
        durationMin: service.scheduled ? (durationFromText(pkg) ?? durationFromText(service.meta) ?? 30) : 0,
        name: name.trim(),
        dob: dob,
        contact: [whatsapp.trim() && `WA: ${whatsapp.trim()}`, email.trim() && `Email: ${email.trim()}`].filter(Boolean).join(' · '),
        question: '',
        market: isIndonesian ? 'ID' : 'Global',
      });
      const trackName = SERVICE_TRACK_NAME[service.id] || service.name;
      // GA4 only counts a purchase with a transaction id
      trackEvent('purchase', { item_name: trackName, market: isIndonesian ? 'ID' : 'Global', transaction_id: `bk-${Date.now()}` }, 'Schedule', { content_name: trackName });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error && err.message === 'SLOT_TAKEN'
        ? t('Maaf, slot itu baru saja terisi. Pilih waktu lain ya.', 'Sorry, that slot was just taken. Please pick another time.')
        : t('Ada kendala. Coba lagi sebentar.', 'Something went wrong. Please try again.'));
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const stepLabels = [t('Jenis Layanan', 'Service Type'), t('Jadwal', 'Schedule'), t('Detail', 'Details'), t('Konfirmasi', 'Review')];
  const needsPackage = !!service?.packages?.length;
  // WhatsApp: digits only (with optional +/spaces/hyphens), at least 8 digits.
  const waDigits = whatsapp.replace(/\D/g, '');
  const whatsappValid = waDigits.length >= 8;
  // Email is optional, but if given it must look like name@domain.tld
  const emailValid = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const detailsValid = name.trim().length > 1 && dob.trim() !== '' && whatsappValid && emailValid && (!needsPackage || !!pkg);
  const scheduled = service?.scheduled ?? true;

  // Time slots: on the current day, the earliest bookable slot is 2 hours out.
  const isTodaySelected = !!date && toISODate(date) === toISODate(new Date());
  const nowCutoffMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() + 120; })();
  const visibleSlots = SLOT_TIMES.filter((slot) => {
    if (!isTodaySelected) return true;
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m >= nowCutoffMin;
  });

  // Duration for the chosen option — drives the "start–end" slot labels and which
  // starts fit before closing. Until a package is picked, assume its shortest one
  // (e.g. a 1-hour meetup), so a slot never looks open for a session that can't fit.
  const shortestPackageMin = service?.packages
    ? Math.min(...service.packages.map((p) => durationFromText(p) ?? Infinity))
    : null;
  const durationMin = service?.packages
    ? (durationFromText(pkg) ?? (Number.isFinite(shortestPackageMin) ? shortestPackageMin : null))
    : durationFromText(service?.meta);
  const timeRange = (start: string) => (durationMin ? `${start}–${addMinutes(start, durationMin)}` : start);

  const totalPrice = pkg ? priceFromText(pkg) : (service?.price || '');

  // WhatsApp deep link for the success step — prefilled with the booking so the
  // customer just attaches their payment proof.
  const waServiceLine = `${service?.name || ''}${pkg ? ` · ${pkg.split(' · ')[0]}` : ''}${scheduled && date ? ` · ${toISODate(date)} ${time ? timeRange(time) : ''}` : ''}`;
  const waMessage = isIndonesian
    ? `Halo Mayanov, saya sudah booking:\n• ${waServiceLine}\n• Nama: ${name}\n• Total: ${totalPrice}\n\nIni bukti pembayaran saya 🙏`
    : `Hi Mayanov, I've just booked:\n• ${waServiceLine}\n• Name: ${name}\n• Total: ${totalPrice}\n\nHere's my payment proof 🙏`;
  const waLink = `https://wa.me/${PAYMENT.waNumber}?text=${encodeURIComponent(waMessage)}`;

  // ---- shared bits of the layout ----
  const label = 'block text-[13px] font-medium text-ink/75 mb-1.5';
  const field = 'w-full rounded-lg bg-white border border-ink/15 px-3.5 py-2.5 text-[15px] text-ink placeholder-ink/30 focus:border-moon focus:ring-2 focus:ring-moon/15 focus:outline-none transition-all';
  const chip = (active: boolean) => `flex flex-col text-center rounded-lg border px-2 py-2.5 transition-colors ${active ? 'border-moon bg-moon/[0.07] text-moon' : 'border-ink/15 bg-white text-ink/75 hover:border-moon/40'}`;
  const primaryBtn = 'inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-moon text-cream text-sm font-semibold hover:bg-plum transition-colors disabled:opacity-40 disabled:pointer-events-none';

  // the bottom bar: running total on the left (once known), the next action on the right
  const bottomBar = (action: React.ReactNode) => (
    <div className="sticky bottom-0 z-10 -mx-5 md:-mx-6 -mb-5 mt-6 px-5 md:px-6 py-3.5 bg-paper/95 backdrop-blur-sm border-t border-ink/10 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {totalPrice && (
          <>
            <span className="block text-[11px] text-ink/50 leading-none">Total</span>
            <span className="block mt-1 font-serif font-semibold text-lg text-ink leading-none tabular-nums">{totalPrice}</span>
          </>
        )}
      </div>
      {action}
    </div>
  );

  // one "label · value" line in a summary list
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-ink/55">{k}</span>
      <span className="text-sm text-ink font-medium text-right break-words">{v}</span>
    </div>
  );

  const copyAccount = () => {
    navigator.clipboard?.writeText(PAYMENT.accountNumber).catch(() => { /* ignore */ });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // Payment (Indonesian market): QRIS | Transfer Bank as two tabs
  const paymentPanel = () => !isIndonesian ? null : (
    <div>
      <div className="flex rounded-lg bg-ink/[0.05] p-1 text-sm font-medium">
        {([['qris', 'QRIS'], ['bank', t('Transfer Bank', 'Bank transfer')]] as const).map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPayTab(id)}
            className={`flex-1 rounded-md py-1.5 transition-colors ${payTab === id ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink'}`}
          >
            {lbl}
          </button>
        ))}
      </div>
      {payTab === 'qris' ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="w-44 h-44 rounded-lg border border-ink/10 bg-white grid place-items-center overflow-hidden relative">
            <span className="text-[11px] text-ink/45 text-center px-3">{t('QRIS akan tampil di sini', 'QRIS shown here')}</span>
            {/* hidden via state (not by removing the node), so switching tabs can't trip React */}
            {!qrMissing && <img src={PAYMENT.qrSrc} alt="QRIS" className="absolute inset-0 w-full h-full object-contain bg-white" onError={() => setQrMissing(true)} />}
          </div>
          <span className="text-xs text-ink/55">{t('Scan dengan aplikasi bank atau e-wallet', 'Scan with any banking or e-wallet app')}</span>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-white px-4 py-3.5">
          <div className="min-w-0">
            <div className="text-xs text-ink/55">{PAYMENT.bankName} · a.n. {PAYMENT.accountHolder}</div>
            <div className="mt-1 font-serif font-semibold text-lg text-ink tabular-nums tracking-wide">{PAYMENT.accountNumber}</div>
          </div>
          <button type="button" onClick={copyAccount} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-moon hover:text-moon transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('Tersalin', 'Copied') : t('Salin', 'Copy')}
          </button>
        </div>
      )}
    </div>
  );

  // service picker: the starting price for a row ("mulai Rp 140K")
  const fromPrice = (s: ServiceOption) => (s.packages?.length ? priceFromText(s.packages[0]) : s.price || '');

  // stepper: "Langkah 2 dari 4 · Jadwal" + a thin progress line
  const seq = scheduled ? [0, 1, 2, 3] : [0, 2, 3];
  const cur = seq.indexOf(step);

  return (
    // above the pricelist card reveal (z-300) when opened from it — the card stays open
    // underneath, so its backdrop serves for both
    <div className={`fixed inset-0 ${seamless ? 'z-[310]' : 'z-[200]'} flex items-end sm:items-center justify-center`}>
      {/* backdrop — same as the pricelist card reveal (none of its own over a card) */}
      <div className={`absolute inset-0 ${seamless ? '' : 'bg-ink/55 backdrop-blur-xl'}`} style={{ animation: 'tarotFade 0.3s ease' }} onClick={close} />

      {/* the card's paper, growing into the form (or back into the card) */}
      {morph?.panel && cardRect.current && (() => {
        const atCard = morph.phase === 'cover' || morph.phase === 'shrink' || morph.phase === 'uncover';
        const r = atCard ? cardRect.current : morph.panel;
        const moving = morph.phase === 'grow' || morph.phase === 'shrink';
        const ease = `${MORPH_MS}ms cubic-bezier(0.65,0,0.35,1)`;
        return (
          <div
            aria-hidden
            className="pointer-events-none fixed bg-paper shadow-[0_40px_120px_-24px_rgba(0,0,0,0.5)]"
            style={{
              left: r.left, top: r.top, width: r.width, height: r.height,
              borderRadius: atCard ? '1.15rem' : '1rem',
              transition: moving ? `left ${ease}, top ${ease}, width ${ease}, height ${ease}, border-radius ${ease}` : 'none',
              animation: morph.phase === 'cover' ? `tarotFade ${COVER_MS}ms ease` : morph.phase === 'uncover' ? `tarotFadeOut ${COVER_MS}ms ease forwards` : undefined,
            }}
          />
        );
      })()}

      <div
        ref={panelRef}
        className={`relative w-full max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-paper text-ink shadow-[0_40px_120px_-24px_rgba(0,0,0,0.5)] animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)] transition-[max-width] duration-300 ${morph ? 'pointer-events-none' : ''} ${step === 1 ? 'sm:max-w-xl md:max-w-2xl' : 'sm:max-w-md md:max-w-lg'}`}
        style={
          // while the paper is moving the form is laid out but invisible; then its content
          // fades in on the paper (or off it, on Back). Over a card it never plays fade-up.
          morph?.phase === 'reveal' ? { animation: `tarotFade ${REVEAL_MS}ms ease` }
          : morph?.phase === 'hide' ? { animation: `tarotFadeOut ${COVER_MS}ms ease forwards` }
          : morph ? { opacity: 0, animation: 'none' }
          : seamless ? { animation: 'none' } : undefined
        }
      >

        {/* scroll only the content (data-lenis-prevent lets this scroll natively) */}
        <div className="relative max-h-[92vh] overflow-y-auto overscroll-contain" data-lenis-prevent>
        {/* header */}
        <div className="sticky top-0 z-10 bg-plum">
          <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              {(step === 1 || step === 2 || step === 3) && (
                <button onClick={goBack} aria-label="Back" className="shrink-0 text-cream/75 hover:text-cream transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="font-serif font-semibold text-cream text-[1.1rem] md:text-[1.2rem] leading-tight truncate">
                {step === 0 ? t('Pilih layanan', 'Choose a service') : (service?.name ?? t('Booking Sesi', 'Book a Session'))}
              </div>
            </div>
            <button onClick={close} aria-label="Close" className="shrink-0 text-cream/75 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* stepper — which step, how many, and a thin line that fills */}
          {step < 4 && (
            <div className="px-5 md:px-6 pb-3">
              <div className="text-[12px] text-cream/70">
                {t('Langkah', 'Step')} {cur + 1} {t('dari', 'of')} {seq.length} · <span className="text-cream">{stepLabels[step]}</span>
              </div>
              <div className="mt-2 h-[3px] rounded-full bg-cream/15 overflow-hidden">
                <div className="h-full rounded-full bg-[#C9B8E8] transition-[width] duration-500" style={{ width: `${((cur + 1) / seq.length) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="relative px-5 md:px-6 py-5">
          {/* STEP 0 — service: rows with the card's mark + starting price */}
          {step === 0 && (
            <div className="-mx-2 divide-y divide-ink/10">
              {services.map((s) => {
                const look = SERVICE_LOOK[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => { pickService(s); setPkg(null); setTime(null); setDate(undefined); setStep(s.scheduled ? 1 : 2); }}
                    className="group w-full flex items-center gap-4 text-left rounded-lg px-2 py-3.5 hover:bg-ink/[0.03] transition-colors"
                  >
                    <span className="shrink-0 grid place-items-center w-11 h-11 rounded-full text-cream" style={{ backgroundColor: look?.accent || '#39234E' }}>
                      <CelestialMark name={look?.mark || 'star'} className="w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif font-semibold text-[1.05rem] text-ink leading-tight">{s.name}</span>
                      <span className="block mt-1 text-[13px] text-ink/55 leading-snug">{s.meta}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11px] text-ink/45 leading-none">{s.packages?.length ? t('mulai', 'from') : ' '}</span>
                      <span className="block mt-1 font-serif font-semibold text-ink leading-none">{fromPrice(s)}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink/35 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 1 — date → duration → time */}
          {step === 1 && (
            <div>
              {error && <div className="mb-4 text-sm text-ink bg-ink/[0.05] rounded-lg px-4 py-3">{error}</div>}

              {(service?.id === 'meetup' || service?.id === 'call') && (
                <p className="mb-4 flex items-center gap-2 text-[13px] text-ink/60">
                  <CalendarDays className="w-4 h-4 shrink-0 text-moon" />
                  {service.id === 'meetup'
                    ? t('Sesi tatap muka hanya tersedia hari Jumat & Minggu.', 'In-person sessions are available on Fridays & Sundays only.')
                    : t('Sesi call tersedia hari Senin–Jumat.', 'Call sessions are available Monday–Friday.')}
                </p>
              )}
              <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
                {/* 1. date */}
                <div>
                  <span className={label}>{t('Tanggal', 'Date')}</span>
                  <div className="booking-cal rounded-lg bg-white border border-ink/10 text-ink p-2 sm:p-3 flex items-center justify-center">
                    <DayPicker
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setTime(null); }}
                      disabled={service && DISABLED_DOWS[service.id]
                        ? [{ before: new Date() }, { dayOfWeek: DISABLED_DOWS[service.id] }]
                        : { before: new Date() }}
                      weekStartsOn={1}
                    />
                  </div>
                </div>

                <div className="mt-5 md:mt-0">
                  {/* 2. duration — after the date, before the time */}
                  {service?.packages && (
                    <div className="mb-5" style={{ opacity: date ? 1 : 0.45, transition: 'opacity 300ms ease' }}>
                      <span className={label}>{t('Durasi', 'Duration')}</span>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${service.packages.length}, minmax(0, 1fr))` }}>
                        {service.packages.map((p) => {
                          const [pName, ...pRest] = p.split(' · ');
                          return (
                            <button key={p} type="button" onClick={() => { setPkg(p); setTime(null); }} className={chip(pkg === p)}>
                              <span className="text-[13px] font-medium leading-snug">{pName}</span>
                              <span className="mt-0.5 text-[12px] leading-snug text-ink/50">{pRest.join(' · ')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. time */}
                  <span className={`${label} flex items-center gap-1.5`}><Clock className="w-3.5 h-3.5" /> {t('Jam', 'Time')}</span>
                  {!date ? (
                    <p className="text-sm text-ink/55 py-2">{t('Pilih tanggal dulu untuk melihat jam.', 'Pick a date to see available times.')}</p>
                  ) : needsPackage && !pkg ? (
                    <p className="text-sm text-ink/55 py-2">{t('Pilih durasi dulu untuk melihat jam.', 'Choose a duration to see available times.')}</p>
                  ) : time ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-moon bg-moon/[0.07] px-4 py-3">
                      <span className="flex items-center gap-2 font-serif font-semibold text-lg text-moon tabular-nums">
                        {time} – {addMinutes(time, durationMin || 30)}
                      </span>
                      <button type="button" onClick={() => setTime(null)} className="text-xs text-ink/60 hover:text-ink underline underline-offset-2">{t('Ubah', 'Change')}</button>
                    </div>
                  ) : visibleSlots.length === 0 ? (
                    <p className="text-sm text-ink/55 py-2">{t('Slot hari ini sudah lewat. Silakan pilih tanggal lain ya.', 'No slots left today. Please pick another date.')}</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {visibleSlots.map((slot) => {
                        // Block this start if the session would run past closing time or overlaps a taken slot.
                        const span = slotSpan(slot, durationMin || 30);
                        const isTaken = addMinutes(slot, durationMin || 30) > CLOSING_TIME || span.some((x) => taken.includes(x));
                        return (
                          <button
                            key={slot}
                            disabled={isTaken}
                            onClick={() => setTime(slot)}
                            className={`py-2 rounded-lg text-sm font-medium border transition-colors tabular-nums ${isTaken ? 'border-transparent text-ink/25 line-through cursor-not-allowed' : 'border-ink/15 bg-white text-ink hover:border-moon hover:text-moon'}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {bottomBar(
                <button onClick={() => setStep(2)} disabled={!date || !time || (needsPackage && !pkg)} className={primaryBtn}>
                  {t('Lanjut', 'Continue')} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2 — details */}
          {step === 2 && (
            <div>
              {scheduled && date && (
                <p className="mb-5 flex items-center gap-2 text-[13px] text-ink/60">
                  <CalendarDays className="w-4 h-4 text-moon" />
                  {fmtLongDate(toISODate(date), isIndonesian ? 'id' : 'en')} · {time && timeRange(time)}{pkg ? ` · ${pkg.split(' · ')[0]}` : ''}
                </p>
              )}

              <div className="space-y-4">
                {service?.packages && !scheduled && (
                  <div>
                    <span className={label}>{t('Paket', 'Package')}</span>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${service.packages.length}, minmax(0, 1fr))` }}>
                      {service.packages.map((p) => {
                        const [pName, ...pRest] = p.split(' · ');
                        return (
                          <button key={p} type="button" onClick={() => setPkg(p)} className={chip(pkg === p)}>
                            <span className="text-[13px] font-medium leading-snug">{pName}</span>
                            <span className="mt-0.5 text-[12px] leading-snug text-ink/50">{pRest.join(' · ')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className={label}>{t('Nama', 'Name')}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text" className={field} placeholder={t('Nama kamu', 'Your name')} />
                </label>
                <div>
                  <span className={label}>{t('Tanggal lahir', 'Date of birth')}</span>
                  {/* day / month / year — the month by name, so the order is never ambiguous */}
                  <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
                    <input value={dobDay} onChange={(e) => setDobDay(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" aria-label={t('Tanggal', 'Day')} placeholder={t('Tgl', 'Day')} className={`${field} text-center`} />
                    <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} aria-label={t('Bulan', 'Month')} className={`${field} ${dobMonth ? '' : 'text-ink/35'}`}>
                      <option value="">{t('Bulan', 'Month')}</option>
                      {(isIndonesian ? MONTHS_ID : MONTHS_EN).map((m, i) => <option key={m} value={String(i + 1)} className="text-ink">{m}</option>)}
                    </select>
                    <input value={dobYear} onChange={(e) => setDobYear(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" aria-label={t('Tahun', 'Year')} placeholder={t('Tahun', 'Year')} className={`${field} text-center`} />
                  </div>
                  {dobDay && dobMonth && dobYear.length === 4 && !dob && (
                    <span className="block mt-1.5 text-xs text-ink/70">{t('Tanggal lahir tidak valid.', 'That date isn’t valid.')}</span>
                  )}
                </div>
                <label className="block">
                  <span className={label}>WhatsApp</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, ''))} type="tel" inputMode="tel" className={field} placeholder={t('cth. 0812 3456 7890', 'e.g. +62 812 3456 7890')} />
                  {whatsapp.trim() !== '' && !whatsappValid && (
                    <span className="block mt-1.5 text-xs text-ink/70">{t('Masukkan nomor telepon yang valid (min. 8 angka).', 'Enter a valid phone number (at least 8 digits).')}</span>
                  )}
                </label>
                <label className="block">
                  <span className={label}>Email <span className="text-ink/40 font-normal">({t('opsional', 'optional')})</span></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" className={field} placeholder={t('nama@email.com', 'you@email.com')} />
                  {!emailValid && (
                    <span className="block mt-1.5 text-xs text-ink/70">{t('Format email tidak valid (cth. nama@email.com).', 'Invalid email format (e.g. name@email.com).')}</span>
                  )}
                </label>
              </div>

              {bottomBar(
                <button onClick={() => setStep(3)} disabled={!detailsValid} className={primaryBtn}>
                  {t('Lanjut', 'Continue')} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 3 — review: one summary list, payment tabs, one line of terms */}
          {step === 3 && (
            <div>
              {error && <div className="mb-4 text-sm text-ink bg-ink/[0.05] rounded-lg px-4 py-3">{error}</div>}

              <h3 className="font-serif font-semibold text-ink text-lg">{t('Ringkasan', 'Summary')}</h3>
              <div className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
                {row(t('Layanan', 'Service'), service?.name)}
                {pkg && row(scheduled ? t('Durasi', 'Duration') : t('Paket', 'Package'), pkg.split(' · ')[0])}
                {scheduled && date && row(t('Jadwal', 'Schedule'), `${fmtLongDate(toISODate(date), isIndonesian ? 'id' : 'en')} · ${time ? timeRange(time) : ''}`)}
                {row(t('Nama', 'Name'), name)}
                {row(t('Tanggal lahir', 'Date of birth'), fmtLongDate(dob, isIndonesian ? 'id' : 'en'))}
                {row('WhatsApp', whatsapp)}
                {email.trim() && row('Email', email)}
              </div>

              {isIndonesian && (
                <div className="mt-6">
                  <h3 className="font-serif font-semibold text-ink text-lg mb-3">{t('Pembayaran', 'Payment')}</h3>
                  {paymentPanel()}
                  <p className="mt-4 text-[13px] text-ink/60 leading-relaxed">
                    {t('Setelah konfirmasi, kirim bukti pembayaran via WhatsApp. Tanpa pembayaran, booking otomatis dibatalkan.', 'After confirming, send your payment proof via WhatsApp. Without payment, the booking is cancelled automatically.')}
                  </p>
                </div>
              )}

              {bottomBar(
                <button onClick={submit} disabled={submitting} className={primaryBtn}>
                  {submitting ? t('Menyimpan…', 'Booking…') : t('Konfirmasi', 'Confirm booking')}
                </button>
              )}
            </div>
          )}

          {/* STEP 4 — done */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-moon/10 grid place-items-center text-moon mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-ink">{t('Booking diterima!', 'You’re booked!')}</h3>
              <p className="mt-2 text-ink/65 leading-relaxed max-w-sm mx-auto text-[15px]">
                {t('Terima kasih, ', 'Thank you, ')}{name || t('kamu', 'friend')}. {t('Aku akan menghubungimu via WhatsApp', 'I’ll reach out on WhatsApp')} ({whatsapp}) {t('untuk konfirmasi.', 'to confirm.')}
              </p>

              <div className="mt-5 text-left divide-y divide-ink/10 border-y border-ink/10">
                {row(t('Layanan', 'Service'), service?.name)}
                {pkg && row(scheduled ? t('Durasi', 'Duration') : t('Paket', 'Package'), pkg.split(' · ')[0])}
                {scheduled && date && row(t('Jadwal', 'Schedule'), `${fmtLongDate(toISODate(date), isIndonesian ? 'id' : 'en')} · ${time ? timeRange(time) : ''}`)}
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium text-ink">Total</span>
                  <span className="font-serif font-semibold text-lg text-ink">{totalPrice || '—'}</span>
                </div>
              </div>

              {isIndonesian && showPay && <div className="mt-5 text-left">{paymentPanel()}</div>}

              <p className="mt-5 text-[13px] text-ink/60 max-w-sm mx-auto leading-relaxed">
                {t('Kirim bukti pembayaran via WhatsApp. Tanpa pembayaran, booking otomatis dibatalkan.', 'Send your payment proof via WhatsApp. Without payment, the booking is cancelled automatically.')}
              </p>

              <div className="mt-5 flex flex-col items-center gap-3">
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} px-8 py-3`}>
                  <span className="inline-flex items-center gap-2"><FaWhatsapp size={18} /> {t('Kirim Bukti Pembayaran', 'Send Payment Proof')}</span>
                </a>
                {isIndonesian && (
                  <button onClick={() => setShowPay((v) => !v)} className="text-sm font-medium text-ink/70 hover:text-ink underline underline-offset-4 transition-colors">
                    {showPay ? t('Sembunyikan detail pembayaran', 'Hide payment details') : t('Lihat detail pembayaran', 'View payment details')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

    </div>
  );
};

export default BookingModal;
