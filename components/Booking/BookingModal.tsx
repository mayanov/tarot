import React, { useEffect, useState, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { X, Check, ChevronRight, ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { SLOT_TIMES, getTakenSlots, createBooking, slotSpan } from '../../services/booking';
import { trackEvent } from '../../services/analytics';

interface BookingModalProps {
  isIndonesian?: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
  meta: string;
  scheduled: boolean; // needs a date & time slot?
  packages?: string[]; // if set, the visitor must pick one
  price?: string; // fixed price when there are no packages
}

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
  waNumber: '', // e.g. '628123456789' — used for the "send proof" note
};

const BookingModal: React.FC<BookingModalProps> = ({ isIndonesian = false }) => {
  const [open, setOpen] = useState(false);
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

  const t = (id: string, en: string) => (isIndonesian ? id : en);

  const services: ServiceOption[] = isIndonesian
    ? [
        { id: 'chat', name: 'Konsultasi via Chat', meta: 'WhatsApp · per pertanyaan', scheduled: false, packages: ['1 Pertanyaan · Rp 140K', '3 Pertanyaan · Rp 315K', 'Beli 3 Dapat 5 · Rp 315K (Promo)'] },
        { id: 'call', name: 'Call / Video Call', meta: 'Real-time · pilih durasi', scheduled: true, packages: ['30 Menit · Rp 220K', '60 Menit · Rp 360K'] },
        { id: 'meetup', name: 'Sesi Tatap Muka', meta: 'Jakarta Selatan', scheduled: true, packages: ['1 Jam · Rp 450K', '2 Jam · Rp 810K', '3 Jam · Rp 1,17JT'] },
        { id: 'special', name: 'Edisi Spesial', meta: 'Bacaan tematik (PDF)', scheduled: false, price: 'Rp 250K' },
      ]
    : [
        { id: '3card', name: '3-Card Spread', meta: 'Email · within 24h', scheduled: false, price: '$12' },
        { id: '5card', name: '5-Card Deep', meta: 'Email · in-depth', scheduled: false, price: '$20' },
        { id: 'live', name: 'Live Session', meta: 'Google Meet · 30 min', scheduled: true, price: '$45' },
      ];

  const reset = useCallback(() => {
    setStep(0); setService(null); setDate(undefined); setTime(null); setPkg(null);
    setName(''); setDob(''); setWhatsapp(''); setEmail(''); setError(''); setSubmitting(false);
  }, []);

  const close = useCallback(() => { setOpen(false); }, []);

  // Open via a global event (dispatched by the nav / CTA buttons).
  useEffect(() => {
    const onOpen = (e: Event) => {
      reset();
      const detail = (e as CustomEvent<{ serviceId?: string }>).detail;
      if (detail?.serviceId) {
        const preset = services.find((s) => s.id === detail.serviceId);
        if (preset) { setService(preset); setStep(preset.scheduled ? 1 : 2); }
      }
      setOpen(true);
      trackEvent('begin_checkout', { item_name: 'Booking flow', market: isIndonesian ? 'ID' : 'Global' });
    };
    window.addEventListener('open-booking', onOpen);
    return () => window.removeEventListener('open-booking', onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndonesian]);

  // Lock scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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
      trackEvent('purchase', { item_name: service.name, market: isIndonesian ? 'ID' : 'Global' }, 'Schedule', { content_name: service.name });
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
  const totalSteps = scheduled ? 4 : 3;
  const displayStep = scheduled ? step + 1 : (step === 0 ? 1 : step);

  // Time slots: on the current day, the earliest bookable slot is 2 hours out.
  const isTodaySelected = !!date && toISODate(date) === toISODate(new Date());
  const nowCutoffMin = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() + 120; })();
  const visibleSlots = SLOT_TIMES.filter((slot) => {
    if (!isTodaySelected) return true;
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m >= nowCutoffMin;
  });

  // Duration for the chosen option — drives the "start–end" slot labels.
  const durationMin = service?.packages ? durationFromText(pkg) : durationFromText(service?.meta);
  const timeRange = (start: string) => (durationMin ? `${start}–${addMinutes(start, durationMin)}` : start);

  const summaryLine = `${service?.name || ''}${pkg ? ` · ${pkg}` : ''}${scheduled && date ? ` · ${toISODate(date)} · ${time ? timeRange(time) : ''}` : ''}`;
  const totalPrice = pkg ? priceFromText(pkg) : (service?.price || '');

  // Payment methods card (Indonesian market) — shown on both the review and done steps.
  const paymentPanel = isIndonesian ? (
    <div className="text-left rounded-2xl bg-white border border-line overflow-hidden">
      <div className="px-5 py-3 bg-coral/[0.06] border-b border-line">
        <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Cara pembayaran', 'How to pay')}</span>
      </div>
      <div className="p-5 grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Scan QRIS', 'Scan QRIS')}</span>
          <div className="w-40 h-40 rounded-xl border border-line bg-paper grid place-items-center overflow-hidden relative">
            <span className="text-[11px] text-taupe text-center px-3">{t('QRIS akan tampil di sini', 'QRIS shown here')}</span>
            <img src={PAYMENT.qrSrc} alt="QRIS" className="absolute inset-0 w-full h-full object-contain bg-white" onError={(e) => { e.currentTarget.remove(); }} />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Transfer Bank', 'Bank transfer')}</span>
          <div className="font-serif font-semibold text-lg text-plum leading-tight">{PAYMENT.bankName}</div>
          <div className="text-base text-ink tabular-nums tracking-wide">{PAYMENT.accountNumber}</div>
          <div className="text-xs text-ink-soft">a.n. {PAYMENT.accountHolder}</div>
        </div>
      </div>
      <div className="px-5 pb-4 text-xs text-ink-soft leading-relaxed">
        {t('Setelah transfer, kirim bukti pembayaran ke WhatsApp kami untuk konfirmasi.', 'After paying, send your payment proof to our WhatsApp to confirm.')}
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-plum-deep/60 backdrop-blur-2xl" onClick={close} />

      {/* panel — warm, light, on-brand with a plum undertone */}
      <div className="relative w-full sm:max-w-lg md:max-w-xl max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#FBF6F1] via-[#F6F0EC] to-[#ECE6F1] text-ink shadow-[0_40px_120px_-24px_rgba(42,24,57,0.6)] ring-1 ring-plum/10 border border-white/70 animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)]">
        {/* soft glow accents — coral + plum (clipped, so they never add scroll) */}
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-coral/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-plum/20 blur-3xl" />

        {/* scroll only the content, not the decorations (data-lenis-prevent lets this
            scroll natively instead of the page's smooth-scroll hijacking the wheel) */}
        <div className="relative max-h-[92vh] overflow-y-auto overscroll-contain" data-lenis-prevent>
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 md:px-8 py-5 bg-[#FCF8F1]/85 backdrop-blur border-b border-line">
          <div className="flex items-center gap-3">
            {(step === 1 || step === 2 || step === 3) && (
              <button
                onClick={() => setStep(step === 3 ? 2 : step === 2 ? (scheduled ? 1 : 0) : 0)}
                aria-label="Back"
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line bg-white/70 text-ink-soft hover:text-ink hover:border-ink/25 hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-coral-deep font-semibold">{t('Pesan Sesi', 'Book a Session')}</div>
              {step < 4 && <div className="mt-1 text-sm text-taupe">{t('Langkah', 'Step')} {displayStep} / {totalSteps} · {stepLabels[step]}</div>}
            </div>
          </div>
          <button onClick={close} aria-label="Close" className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line bg-white/70 text-ink-soft hover:text-ink hover:border-ink/25 hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* progress */}
        {step < 4 && (
          <div className="px-6 md:px-8 pt-4">
            <div className="h-1 rounded-full bg-ink/[0.08] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-plum via-mauve to-coral transition-all duration-300" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="relative px-6 md:px-8 py-6">
          {/* STEP 0 — service */}
          {step === 0 && (
            <div className="space-y-3">
              <h3 className="font-serif font-semibold text-2xl text-plum mb-1">{t('Pilih jenis layanan', 'Choose a service type')}</h3>
              <p className="text-sm text-ink-soft mb-4">{t('Mau sesi yang seperti apa?', 'What kind of session are you after?')}</p>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setService(s); setStep(s.scheduled ? 1 : 2); }}
                  className="group w-full flex items-center justify-between gap-4 text-left rounded-2xl border border-line bg-white hover:border-coral/50 hover:shadow-[0_14px_34px_-18px_rgba(218,134,54,0.55)] hover:-translate-y-0.5 transition-all px-5 py-4"
                >
                  <span>
                    <span className="block font-serif font-semibold text-plum">{s.name}</span>
                    <span className="block text-xs text-taupe mt-0.5">{s.meta}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-coral-deep/40 group-hover:text-coral-deep group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 — date & time */}
          {step === 1 && (
            <div>
              <h3 className="font-serif font-semibold text-2xl text-plum mb-1">{t('Pilih tanggal & waktu', 'Pick a date & time')}</h3>
              <p className="text-sm text-ink-soft mb-5">{service?.name}</p>

              {error && <div className="mb-4 text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-4 py-2.5">{error}</div>}

              {/* duration / package — choose before the time slot */}
              {service?.packages && (
                <div className="mb-5">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-2">
                    {t('Pilih durasi', 'Choose duration')}
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {service.packages.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setPkg(p); setTime(null); }}
                        className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${pkg === p ? 'border-coral bg-coral/10 text-plum font-medium' : 'border-line bg-white text-ink-soft hover:border-coral/40'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* calendar */}
              <div className="rounded-2xl bg-white border border-line shadow-sm text-ink p-2 sm:p-3 flex justify-center [--rdp-accent-color:#DA8636] [--rdp-accent-background-color:#F5E7D6]">
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(null); }}
                  disabled={{ before: new Date() }}
                  weekStartsOn={1}
                />
              </div>

              {date && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-taupe mb-3">
                    <Clock className="w-3.5 h-3.5" /> {t('Pilih jam', 'Choose a time')}
                  </div>
                  {visibleSlots.length === 0 ? (
                    <p className="text-sm text-ink-soft bg-ink/[0.04] border border-line rounded-lg px-4 py-3">
                      {t('Slot hari ini sudah lewat. Silakan pilih tanggal lain ya.', 'No slots left today. Please pick another date.')}
                    </p>
                  ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {visibleSlots.map((slot) => {
                      // Block this start if the whole session span isn't free / doesn't fit the day.
                      const span = slotSpan(slot, durationMin || 30);
                      const isTaken = !span.every((s) => SLOT_TIMES.includes(s)) || span.some((s) => taken.includes(s));
                      const active = time === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isTaken}
                          onClick={() => setTime(slot)}
                          className={`py-2.5 rounded-lg text-sm font-medium border transition-all tabular-nums ${
                            isTaken
                              ? 'border-line text-taupe/40 line-through bg-ink/[0.03] cursor-not-allowed'
                              : active
                                ? 'bg-coral text-ink border-coral shadow-[0_8px_18px_-9px_rgba(241,159,88,0.9)]'
                                : 'border-line bg-white text-ink hover:border-coral hover:text-coral-deep'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              <div className="sticky bottom-0 z-10 -mx-6 md:-mx-8 -mb-6 mt-6 px-6 md:px-8 py-4 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-end gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={!date || !time || (needsPackage && !pkg)}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream shadow-[0_12px_26px_-14px_rgba(218,134,54,0.8)] transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                >
                  {t('Lanjut', 'Continue')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — details */}
          {step === 2 && (
            <div>
              <h3 className="font-serif font-semibold text-2xl text-plum mb-1">{t('Detail kamu', 'Your details')}</h3>
              <p className="text-sm text-ink-soft mb-5 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-coral-deep" />
                {summaryLine}
              </p>

              <div className="space-y-4">
                {service?.packages && !scheduled && (
                  <div>
                    <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-2">{t('Pilih paket', 'Choose a package')}</span>
                    <div className="grid gap-2">
                      {service.packages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPkg(p)}
                          className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${pkg === p ? 'border-coral bg-coral/10 text-plum font-medium' : 'border-line bg-white text-ink-soft hover:border-coral/40'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">{t('Nama', 'Name')}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text"
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('Nama kamu', 'Your name')} />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">{t('Tanggal Lahir', 'Date of Birth')}</span>
                  <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={toISODate(new Date())}
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all" />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">WhatsApp</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, ''))} type="tel" inputMode="tel"
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('cth. 0812 3456 7890', 'e.g. +62 812 3456 7890')} />
                  {whatsapp.trim() !== '' && !whatsappValid && (
                    <span className="block mt-1.5 text-xs text-coral-deep">{t('Masukkan nomor telepon yang valid (min. 8 angka).', 'Enter a valid phone number (at least 8 digits).')}</span>
                  )}
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">Email <span className="text-taupe/70 normal-case tracking-normal">({t('opsional', 'optional')})</span></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email"
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('nama@email.com', 'you@email.com')} />
                  {!emailValid && (
                    <span className="block mt-1.5 text-xs text-coral-deep">{t('Format email tidak valid (cth. nama@email.com).', 'Invalid email format (e.g. name@email.com).')}</span>
                  )}
                </label>
              </div>

              <div className="sticky bottom-0 z-10 -mx-6 md:-mx-8 -mb-6 mt-6 px-6 md:px-8 py-4 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-end gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={!detailsValid}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream shadow-[0_12px_26px_-14px_rgba(218,134,54,0.8)] transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                >
                  {t('Lanjut', 'Continue')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — review & confirm */}
          {step === 3 && (
            <div>
              <h3 className="font-serif font-semibold text-2xl text-plum mb-1">{t('Konfirmasi booking', 'Confirm your booking')}</h3>
              <p className="text-sm text-ink-soft mb-5">{t('Cek dulu ya, sudah benar?', 'Please review before confirming.')}</p>

              {error && <div className="mb-4 text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-4 py-2.5">{error}</div>}

              <div className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Layanan', 'Service')}</span>
                  <span className="text-sm text-ink font-medium text-right">{service?.name}</span>
                </div>
                {pkg && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-taupe">{scheduled ? t('Durasi', 'Duration') : t('Paket', 'Package')}</span>
                    <span className="text-sm text-ink font-medium text-right">{pkg}</span>
                  </div>
                )}
                {scheduled && date && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Jadwal', 'Schedule')}</span>
                    <span className="text-sm text-ink font-medium text-right">{toISODate(date)} · {time && timeRange(time)}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Nama', 'Name')}</span>
                  <span className="text-sm text-ink font-medium text-right">{name}</span>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Tanggal Lahir', 'Date of Birth')}</span>
                  <span className="text-sm text-ink font-medium text-right">{dob}</span>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-taupe">WhatsApp</span>
                  <span className="text-sm text-ink font-medium text-right break-all">{whatsapp}</span>
                </div>
                {email.trim() && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-taupe">Email</span>
                    <span className="text-sm text-ink font-medium text-right break-all">{email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-coral/[0.06]">
                  <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Total', 'Total')}</span>
                  <span className="text-lg text-plum font-serif font-bold text-right">{totalPrice || '—'}</span>
                </div>
              </div>

              {paymentPanel && <div className="mt-4">{paymentPanel}</div>}

              <div className="sticky bottom-0 z-10 -mx-6 md:-mx-8 -mb-6 mt-6 px-6 md:px-8 py-4 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-ink-soft hover:text-ink underline underline-offset-4 transition-colors"
                >
                  {t('Ubah detail', 'Edit details')}
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream shadow-[0_12px_26px_-14px_rgba(218,134,54,0.8)] transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                >
                  {submitting ? t('Menyimpan…', 'Booking…') : t('Konfirmasi', 'Confirm booking')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — done */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-coral/15 ring-4 ring-coral/10 grid place-items-center text-coral-deep mb-5">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-plum">{t('Booking diterima!', 'You’re booked!')}</h3>
              <p className="mt-3 text-ink-soft leading-relaxed max-w-sm mx-auto">
                {t('Terima kasih, ', 'Thank you, ')}{name || t('kamu', 'friend')}. {t('Aku akan menghubungimu via WhatsApp', 'I’ll reach out on WhatsApp')} ({whatsapp}) {t('untuk konfirmasi.', 'to confirm.')}
              </p>
              {/* booking details — labelled rows for easy reading */}
              <div className="mt-6 text-left rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Layanan', 'Service')}</span>
                  <span className="text-sm text-ink font-medium text-right">{service?.name}</span>
                </div>
                {pkg && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-taupe">{scheduled ? t('Durasi', 'Duration') : t('Paket', 'Package')}</span>
                    <span className="text-sm text-ink font-medium text-right">{pkg.split(' · ')[0]}</span>
                  </div>
                )}
                {scheduled && date && (
                  <>
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Tanggal', 'Date')}</span>
                      <span className="text-sm text-ink font-medium text-right">{toISODate(date)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Waktu', 'Time')}</span>
                      <span className="text-sm text-ink font-medium text-right">{time ? timeRange(time) : ''}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-coral/[0.06]">
                  <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Total', 'Total')}</span>
                  <span className="text-lg text-plum font-serif font-bold text-right">{totalPrice || '—'}</span>
                </div>
              </div>

              {/* Payment (Indonesian market) */}
              {paymentPanel && (
                <div className="mt-6">
                  {paymentPanel}
                </div>
              )}

              <div className="mt-8">
                <button onClick={close} className="px-8 py-3 rounded-full bg-plum text-cream text-sm font-semibold hover:bg-plum-deep transition-colors">
                  {t('Selesai', 'Done')}
                </button>
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
