import React, { useEffect, useState, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { X, Check, ChevronRight, ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { SLOT_TIMES, getTakenSlots, createBooking } from '../../services/booking';
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
}

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = (id: string, en: string) => (isIndonesian ? id : en);

  const services: ServiceOption[] = isIndonesian
    ? [
        { id: 'chat', name: 'Konsultasi via Chat', meta: 'WhatsApp · per pertanyaan', scheduled: false, packages: ['1 Pertanyaan · Rp 140K', '3 Pertanyaan · Rp 315K', 'Beli 3 Dapat 5 · Rp 315K (Promo)'] },
        { id: 'call', name: 'Call / Video Call', meta: 'Real-time · pilih durasi', scheduled: true, packages: ['30 Menit · Rp 220K', '60 Menit · Rp 360K'] },
        { id: 'meetup', name: 'Sesi Tatap Muka', meta: 'Jakarta Selatan · 1 jam', scheduled: true },
        { id: 'special', name: 'Edisi Spesial', meta: 'Bacaan tematik (PDF)', scheduled: false },
      ]
    : [
        { id: '3card', name: '3-Card Spread', meta: 'Email · within 24h', scheduled: false },
        { id: '5card', name: '5-Card Deep', meta: 'Email · in-depth', scheduled: false },
        { id: 'live', name: 'Live Session', meta: 'Google Meet · 30 min', scheduled: true },
      ];

  const reset = useCallback(() => {
    setStep(0); setService(null); setDate(undefined); setTime(null); setPkg(null);
    setName(''); setWhatsapp(''); setEmail(''); setError(''); setSubmitting(false);
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
        name: name.trim(),
        contact: [whatsapp.trim() && `WA: ${whatsapp.trim()}`, email.trim() && `Email: ${email.trim()}`].filter(Boolean).join(' · '),
        question: '',
        market: isIndonesian ? 'ID' : 'Global',
      });
      trackEvent('purchase', { item_name: service.name, market: isIndonesian ? 'ID' : 'Global' }, 'Schedule', { content_name: service.name });
      setStep(3);
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

  const stepLabels = [t('Jenis Layanan', 'Service Type'), t('Jadwal', 'Schedule'), t('Detail', 'Details')];
  const needsPackage = !!service?.packages?.length;
  const detailsValid = name.trim().length > 1 && whatsapp.trim().length > 3 && (!needsPackage || !!pkg);
  const scheduled = service?.scheduled ?? true;
  const totalSteps = scheduled ? 3 : 2;
  const displayStep = scheduled ? step + 1 : (step === 0 ? 1 : 2);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-plum-deep/50 backdrop-blur-md" onClick={close} />

      {/* panel — warm, light, on-brand */}
      <div className="relative w-full sm:max-w-lg md:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#FCF8F1] to-[#F3EBDD] text-ink shadow-[0_40px_120px_-24px_rgba(43,36,32,0.55)] ring-1 ring-black/[0.06] border border-white/70 animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)]">
        {/* soft coral glow accent */}
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-coral/25 blur-3xl" />

        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 md:px-8 py-5 bg-[#FCF8F1]/85 backdrop-blur border-b border-line">
          <div className="flex items-center gap-3">
            {(step === 1 || step === 2) && (
              <button
                onClick={() => setStep(step === 2 ? (scheduled ? 1 : 0) : 0)}
                aria-label="Back"
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line bg-white/70 text-ink-soft hover:text-ink hover:border-ink/25 hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-coral-deep font-semibold">{t('Pesan Sesi', 'Book a Session')}</div>
              {step < 3 && <div className="mt-1 text-sm text-taupe">{t('Langkah', 'Step')} {displayStep} / {totalSteps} · {stepLabels[step]}</div>}
            </div>
          </div>
          <button onClick={close} aria-label="Close" className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-line bg-white/70 text-ink-soft hover:text-ink hover:border-ink/25 hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* progress */}
        {step < 3 && (
          <div className="px-6 md:px-8 pt-4">
            <div className="h-1 rounded-full bg-ink/[0.08] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-coral to-coral-deep transition-all duration-300" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SLOT_TIMES.map((slot) => {
                      const isTaken = taken.includes(slot);
                      const active = time === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isTaken}
                          onClick={() => setTime(slot)}
                          className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
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
                </div>
              )}

              <div className="mt-7 flex items-center justify-end gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={!date || !time}
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
                {service?.name}{scheduled && date ? ` · ${toISODate(date)} · ${time}` : ''}
              </p>

              <div className="space-y-4">
                {service?.packages && (
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
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">WhatsApp</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" inputMode="tel"
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('cth. 0812 3456 7890', 'e.g. +62 812 3456 7890')} />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-taupe mb-1.5">Email <span className="text-taupe/70 normal-case tracking-normal">({t('opsional', 'optional')})</span></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email"
                    className="w-full rounded-lg bg-white border border-line px-4 py-3 text-ink placeholder-taupe/50 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition-all"
                    placeholder={t('nama@email.com', 'you@email.com')} />
                </label>
              </div>

              <div className="mt-7 flex items-center justify-end gap-3">
                <button
                  onClick={submit}
                  disabled={!detailsValid || submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream shadow-[0_12px_26px_-14px_rgba(218,134,54,0.8)] transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                >
                  {submitting ? t('Menyimpan…', 'Booking…') : t('Konfirmasi', 'Confirm booking')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — done */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-coral/15 ring-4 ring-coral/10 grid place-items-center text-coral-deep mb-5">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-plum">{t('Booking diterima!', 'You’re booked!')}</h3>
              <p className="mt-3 text-ink-soft leading-relaxed max-w-sm mx-auto">
                {t('Terima kasih, ', 'Thank you, ')}{name || t('kamu', 'friend')}. {t('Aku akan menghubungimu via WhatsApp', 'I’ll reach out on WhatsApp')} ({whatsapp}) {t('untuk konfirmasi.', 'to confirm.')}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-ink-soft bg-white border border-line rounded-full px-4 py-2">
                <CalendarDays className="w-4 h-4 text-coral-deep" />
                {service?.name}{scheduled && date ? ` · ${toISODate(date)} · ${time}` : ''}
              </div>
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
  );
};

export default BookingModal;
