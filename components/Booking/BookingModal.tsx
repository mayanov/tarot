import React, { useEffect, useState, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { X, Check, ChevronRight, ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { SLOT_TIMES, getTakenSlots, createBooking, slotSpan } from '../../services/booking';
import { trackEvent } from '../../services/analytics';
import { stopLenis, startLenis } from '../UI/scroll';

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

// 'YYYY-MM-DD' → 'dd Mon YYYY' (e.g. 29 Aug 1994)
const fmtLongDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const mon = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { month: 'short' });
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

  // Lock scroll while open — stop Lenis too, or it keeps scrolling the page behind.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) stopLenis(); else startLenis();
    return () => { document.body.style.overflow = ''; startLenis(); };
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

  // WhatsApp deep link for the success step — prefilled with the booking so the
  // customer just attaches their payment proof.
  const waServiceLine = `${service?.name || ''}${pkg ? ` · ${pkg.split(' · ')[0]}` : ''}${scheduled && date ? ` · ${toISODate(date)} ${time ? timeRange(time) : ''}` : ''}`;
  const waMessage = isIndonesian
    ? `Halo Mayanov, saya sudah booking:\n• ${waServiceLine}\n• Nama: ${name}\n• Total: ${totalPrice}\n\nIni bukti pembayaran saya 🙏`
    : `Hi Mayanov, I've just booked:\n• ${waServiceLine}\n• Name: ${name}\n• Total: ${totalPrice}\n\nHere's my payment proof 🙏`;
  const waLink = `https://wa.me/${PAYMENT.waNumber}?text=${encodeURIComponent(waMessage)}`;

  // Payment methods card (Indonesian market). `compact` stacks QRIS above bank
  // so it fits in a narrow side-by-side column on the confirmation step.
  const paymentPanel = (compact: boolean) => !isIndonesian ? null : (
    <div className="text-left rounded-2xl bg-white border border-line overflow-hidden">
      <div className="px-4 py-3 bg-coral/[0.06] border-b border-line">
        <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Cara pembayaran', 'How to pay')}</span>
        <p className="text-[0.7rem] text-taupe mt-0.5">{t('Scan QRIS atau transfer bank — pilih salah satu.', 'Scan the QRIS or transfer to the bank — either one.')}</p>
      </div>
      <div className={compact ? 'p-5 flex flex-col items-center gap-4 text-center' : 'p-5 grid sm:grid-cols-2 gap-5'}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Scan QRIS', 'Scan QRIS')}</span>
          <div className={`${compact ? 'w-32 h-32' : 'w-40 h-40'} rounded-xl border border-line bg-paper grid place-items-center overflow-hidden relative`}>
            <span className="text-[11px] text-taupe text-center px-3">{t('QRIS akan tampil di sini', 'QRIS shown here')}</span>
            <img src={PAYMENT.qrSrc} alt="QRIS" className="absolute inset-0 w-full h-full object-contain bg-white" onError={(e) => { e.currentTarget.remove(); }} />
          </div>
        </div>
        <div className={`flex items-center gap-3 w-full ${compact ? '' : 'hidden'}`}>
          <div className="h-px flex-1 bg-line" />
          <span className="text-[0.65rem] uppercase tracking-widest text-taupe">{t('atau', 'or')}</span>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className={`flex flex-col gap-1.5 ${compact ? 'items-center' : 'justify-center'}`}>
          <span className="text-xs uppercase tracking-[0.16em] text-taupe">{t('Transfer Bank', 'Bank transfer')}</span>
          <div className="font-serif font-semibold text-base text-plum leading-tight">{PAYMENT.bankName}</div>
          <div className="text-sm text-ink tabular-nums tracking-wide">{PAYMENT.accountNumber}</div>
          <div className="text-xs text-ink-soft">a.n. {PAYMENT.accountHolder}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-plum-deep/60 backdrop-blur-2xl" onClick={close} />

      {/* panel — warm, light, on-brand with a plum undertone */}
      <div className={`relative w-full max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#FBF6F1] via-[#F6F0EC] to-[#ECE6F1] text-ink shadow-[0_40px_120px_-24px_rgba(42,24,57,0.6)] ring-1 ring-plum/10 border border-white/70 animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)] transition-[max-width] duration-300 ${step === 3 && isIndonesian ? 'sm:max-w-xl md:max-w-2xl' : 'sm:max-w-md md:max-w-lg'}`}>
        {/* soft glow accents — coral + plum (clipped, so they never add scroll) */}
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-coral/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-plum/20 blur-3xl" />

        {/* scroll only the content, not the decorations (data-lenis-prevent lets this
            scroll natively instead of the page's smooth-scroll hijacking the wheel) */}
        <div className="relative max-h-[92vh] overflow-y-auto overscroll-contain" data-lenis-prevent>
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 md:px-6 py-4 bg-[#FCF8F1]/85 backdrop-blur border-b border-line">
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
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-coral-deep font-semibold">{t('Booking Sesi', 'Book a Session')}</div>
              {step < 4 && <div className="mt-0.5 text-sm font-serif font-semibold text-plum leading-tight">{stepLabels[step]}</div>}
            </div>
          </div>
          <button onClick={close} aria-label="Close" className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line bg-white/70 text-ink-soft hover:text-ink hover:border-ink/25 hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* stepper */}
        {step < 4 && (() => {
          const seq = scheduled ? [0, 1, 2, 3] : [0, 2, 3];
          const cur = seq.indexOf(step);
          return (
            <div className="px-5 md:px-6 pt-4">
              <div className="flex items-start">
                {seq.map((s, i) => {
                  const done = i < cur;
                  const active = i === cur;
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                        <div className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold border-2 transition-colors ${
                          done ? 'bg-coral border-coral text-ink'
                            : active ? 'bg-coral/15 border-coral text-coral-deep'
                              : 'bg-white border-line text-taupe'
                        }`}>
                          {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wide text-center leading-tight ${active ? 'text-plum font-semibold' : 'text-taupe'}`}>
                          {stepLabels[s]}
                        </span>
                      </div>
                      {i < seq.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-3.5 rounded transition-colors ${i < cur ? 'bg-coral' : 'bg-line'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="relative px-5 md:px-6 py-5">
          {/* STEP 0 — service */}
          {step === 0 && (
            <div className="space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setService(s); setStep(s.scheduled ? 1 : 2); }}
                  className="group w-full flex items-center justify-between gap-4 text-left rounded-2xl border border-line bg-white hover:border-coral/50 hover:shadow-[0_14px_34px_-18px_rgba(218,134,54,0.55)] hover:-translate-y-0.5 transition-all px-4 py-3.5"
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
              <p className="text-sm text-ink-soft mb-5">{service?.name}</p>

              {error && <div className="mb-4 text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-4 py-3">{error}</div>}

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
                        className={`text-left rounded-lg border px-4 py-2.5 text-sm transition-colors ${pkg === p ? 'border-coral bg-coral/10 text-plum font-medium' : 'border-line bg-white text-ink-soft hover:border-coral/40'}`}
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
                  {time ? (
                    // Selected slot(s) merged into the full booked range.
                    <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-coral bg-coral/10 px-4 py-3.5">
                      <span className="flex items-center gap-2 text-lg font-serif font-bold text-plum tabular-nums">
                        <Clock className="w-4 h-4 text-coral-deep" /> {time} – {addMinutes(time, durationMin || 30)}
                      </span>
                      <button type="button" onClick={() => setTime(null)} className="text-xs uppercase tracking-wider text-ink-soft hover:text-ink underline underline-offset-2">{t('Ubah', 'Change')}</button>
                    </div>
                  ) : visibleSlots.length === 0 ? (
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

              <div className="sticky bottom-0 z-10 -mx-5 md:-mx-6 -mb-5 mt-5 px-5 md:px-6 py-3.5 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-end gap-3">
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
                          className={`text-left rounded-lg border px-4 py-2.5 text-sm transition-colors ${pkg === p ? 'border-coral bg-coral/10 text-plum font-medium' : 'border-line bg-white text-ink-soft hover:border-coral/40'}`}
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
                    className="w-full rounded-lg bg-white border border-line px-4 py-2.5 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('Nama kamu', 'Your name')} />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">{t('Tanggal Lahir', 'Date of Birth')}</span>
                  <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={toISODate(new Date())}
                    className="w-full rounded-lg bg-white border border-line px-4 py-2.5 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all" />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">WhatsApp</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, ''))} type="tel" inputMode="tel"
                    className="w-full rounded-lg bg-white border border-line px-4 py-2.5 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('cth. 0812 3456 7890', 'e.g. +62 812 3456 7890')} />
                  {whatsapp.trim() !== '' && !whatsappValid && (
                    <span className="block mt-1.5 text-xs text-coral-deep">{t('Masukkan nomor telepon yang valid (min. 8 angka).', 'Enter a valid phone number (at least 8 digits).')}</span>
                  )}
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">Email <span className="text-taupe/70 normal-case tracking-normal">({t('opsional', 'optional')})</span></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email"
                    className="w-full rounded-lg bg-white border border-line px-4 py-2.5 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('nama@email.com', 'you@email.com')} />
                  {!emailValid && (
                    <span className="block mt-1.5 text-xs text-coral-deep">{t('Format email tidak valid (cth. nama@email.com).', 'Invalid email format (e.g. name@email.com).')}</span>
                  )}
                </label>
              </div>

              <div className="sticky bottom-0 z-10 -mx-5 md:-mx-6 -mb-5 mt-5 px-5 md:px-6 py-3.5 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-end gap-3">
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
              {error && <div className="mb-4 text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-lg px-4 py-3">{error}</div>}

              <div className="space-y-5">
              <div className={`grid gap-5 items-start ${isIndonesian ? 'md:grid-cols-2' : ''}`}>
              <div className="rounded-2xl bg-white border border-line overflow-hidden">
                <div className="px-4 py-3 bg-coral/[0.06] border-b border-line">
                  <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Ringkasan', 'Summary')}</span>
                </div>
                <div className="divide-y divide-line">
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
                  <span className="text-sm text-ink font-medium text-right">{fmtLongDate(dob)}</span>
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
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-coral/[0.06] border-t border-line">
                  <span className="text-xs uppercase tracking-[0.16em] text-plum font-semibold">{t('Total', 'Total')}</span>
                  <span className="text-base text-plum font-serif font-bold text-right">{totalPrice || '—'}</span>
                </div>
              </div>

              {paymentPanel(true)}
              </div>

              {isIndonesian && (
                <div className="rounded-2xl bg-white border border-line p-5">
                  <div className="text-xs uppercase tracking-[0.16em] text-plum font-semibold mb-4">{t('Cara & Ketentuan', 'How it works')}</div>
                  <ol className="grid gap-4 sm:grid-cols-2">
                    {[
                      t('Setelah konfirmasi, kirim bukti pembayaran melalui WhatsApp.', 'After confirming, send your payment proof via WhatsApp.'),
                      t('Tanpa pembayaran, booking akan otomatis dibatalkan.', 'Without payment, your booking will be auto-cancelled.'),
                    ].map((txt, i, arr) => {
                      const warn = i === arr.length - 1;
                      return (
                        <li key={i} className="flex gap-2.5 text-xs text-ink-soft leading-relaxed">
                          <span className={`shrink-0 grid place-items-center w-5 h-5 rounded-full text-[0.6rem] font-bold ${warn ? 'bg-coral-deep/15 text-coral-deep' : 'bg-coral/15 text-coral-deep'}`}>{i + 1}</span>
                          <span className={warn ? 'text-coral-deep font-medium' : ''}>{txt}</span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
              </div>

              <div className="sticky bottom-0 z-10 -mx-5 md:-mx-6 -mb-5 mt-5 px-5 md:px-6 py-3.5 bg-[#EFE9F2]/92 backdrop-blur-sm border-t border-line flex items-center justify-end gap-3">
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
                  <span className="text-base text-plum font-serif font-bold text-right">{totalPrice || '—'}</span>
                </div>
              </div>

              <p className="mt-5 text-sm text-ink-soft max-w-sm mx-auto leading-relaxed">
                {t('Klik tombol di bawah untuk kirim bukti pembayaran ke WhatsApp kami — detail booking sudah otomatis terisi.', 'Tap the button below to send your payment proof on WhatsApp — your booking details are pre-filled.')}
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:brightness-95 shadow-[0_12px_26px_-12px_rgba(37,211,102,0.9)] transition"
                >
                  <FaWhatsapp className="w-5 h-5" /> {t('Kirim Bukti Pembayaran', 'Send Payment Proof')}
                </a>
                <button onClick={close} className="text-sm text-ink-soft hover:text-ink underline underline-offset-4 transition-colors">
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
