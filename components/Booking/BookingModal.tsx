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
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={close} />

      {/* panel */}
      <div className="relative w-full sm:max-w-lg md:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#3B2657] text-cream shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] border border-white/10">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 md:px-8 py-5 bg-[#3B2657]/95 backdrop-blur border-b border-white/10">
          <div className="flex items-center gap-3">
            {(step === 1 || step === 2) && (
              <button
                onClick={() => setStep(step === 2 ? (scheduled ? 1 : 0) : 0)}
                aria-label="Back"
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-white/15 text-cream/70 hover:text-cream hover:border-white/40 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-coral font-semibold">{t('Pesan Sesi', 'Book a Session')}</div>
              {step < 3 && <div className="mt-1 text-sm text-cream/60">{t('Langkah', 'Step')} {displayStep} / {totalSteps} · {stepLabels[step]}</div>}
            </div>
          </div>
          <button onClick={close} aria-label="Close" className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-white/15 text-cream/70 hover:text-cream hover:border-white/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* progress */}
        {step < 3 && (
          <div className="px-6 md:px-8 pt-4">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-coral transition-all duration-300" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="px-6 md:px-8 py-6">
          {/* STEP 0 — service */}
          {step === 0 && (
            <div className="space-y-3">
              <h3 className="font-serif font-semibold text-2xl text-cream mb-1">{t('Pilih jenis layanan', 'Choose a service type')}</h3>
              <p className="text-sm text-cream/60 mb-4">{t('Mau sesi yang seperti apa?', 'What kind of session are you after?')}</p>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setService(s); setStep(s.scheduled ? 1 : 2); }}
                  className="w-full flex items-center justify-between gap-4 text-left rounded-xl border border-white/10 bg-white/[0.07] hover:bg-white/[0.08] hover:border-white/25 transition-all px-5 py-4"
                >
                  <span>
                    <span className="block font-serif font-semibold text-cream">{s.name}</span>
                    <span className="block text-xs text-cream/55 mt-0.5">{s.meta}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-cream/40 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 — date & time */}
          {step === 1 && (
            <div>
              <h3 className="font-serif font-semibold text-2xl text-cream mb-1">{t('Pilih tanggal & waktu', 'Pick a date & time')}</h3>
              <p className="text-sm text-cream/60 mb-5">{service?.name}</p>

              {error && <div className="mb-4 text-sm text-coral bg-coral/10 border border-coral/25 rounded-lg px-4 py-2.5">{error}</div>}

              {/* calendar on a light sub-panel */}
              <div className="rounded-2xl bg-cream text-ink p-2 sm:p-3 flex justify-center [--rdp-accent-color:#DA8636] [--rdp-accent-background-color:#F1E6D8]">
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cream/60 mb-3">
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
                          className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                            isTaken
                              ? 'border-white/5 text-cream/25 line-through cursor-not-allowed'
                              : active
                                ? 'bg-coral text-ink border-coral'
                                : 'border-white/15 text-cream hover:border-coral/60'
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
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t('Lanjut', 'Continue')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — details */}
          {step === 2 && (
            <div>
              <h3 className="font-serif font-semibold text-2xl text-cream mb-1">{t('Detail kamu', 'Your details')}</h3>
              <p className="text-sm text-cream/60 mb-5 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-coral" />
                {service?.name}{scheduled && date ? ` · ${toISODate(date)} · ${time}` : ''}
              </p>

              <div className="space-y-4">
                {service?.packages && (
                  <div>
                    <span className="block text-xs uppercase tracking-[0.16em] text-cream/60 mb-2">{t('Pilih paket', 'Choose a package')}</span>
                    <div className="grid gap-2">
                      {service.packages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPkg(p)}
                          className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${pkg === p ? 'border-coral bg-coral/10 text-cream' : 'border-white/15 text-cream/80 hover:border-white/30'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-cream/60 mb-1.5">{t('Nama', 'Name')}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text"
                    className="w-full rounded-lg bg-white/[0.1] border border-white/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-coral/60 focus:outline-none transition-colors"
                    placeholder={t('Nama kamu', 'Your name')} />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-cream/60 mb-1.5">WhatsApp</span>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" inputMode="tel"
                    className="w-full rounded-lg bg-white/[0.1] border border-white/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-coral/60 focus:outline-none transition-colors"
                    placeholder={t('cth. 0812 3456 7890', 'e.g. +62 812 3456 7890')} />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-[0.16em] text-cream/60 mb-1.5">Email <span className="text-cream/40 normal-case tracking-normal">({t('opsional', 'optional')})</span></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email"
                    className="w-full rounded-lg bg-white/[0.1] border border-white/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-coral/60 focus:outline-none transition-colors"
                    placeholder={t('nama@email.com', 'you@email.com')} />
                </label>
              </div>

              <div className="mt-7 flex items-center justify-end gap-3">
                <button
                  onClick={submit}
                  disabled={!detailsValid || submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-coral text-ink text-sm font-semibold hover:bg-coral-deep hover:text-cream transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {submitting ? t('Menyimpan…', 'Booking…') : t('Konfirmasi', 'Confirm booking')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — done */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-coral/15 grid place-items-center text-coral mb-5">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-cream">{t('Booking diterima!', 'You’re booked!')}</h3>
              <p className="mt-3 text-cream/70 leading-relaxed max-w-sm mx-auto">
                {t('Terima kasih, ', 'Thank you, ')}{name || t('kamu', 'friend')}. {t('Aku akan menghubungimu via WhatsApp', 'I’ll reach out on WhatsApp')} ({whatsapp}) {t('untuk konfirmasi.', 'to confirm.')}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-cream/60 bg-white/[0.05] rounded-full px-4 py-2">
                <CalendarDays className="w-4 h-4 text-coral" />
                {service?.name}{scheduled && date ? ` · ${toISODate(date)} · ${time}` : ''}
              </div>
              <div className="mt-8">
                <button onClick={close} className="px-8 py-3 rounded-full bg-cream text-ink text-sm font-semibold hover:bg-white transition-colors">
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
