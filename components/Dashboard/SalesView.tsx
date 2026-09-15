import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAllBookings, updatePaymentStatus, Booking } from '../../services/booking';

type Cur = 'IDR' | 'USD';

// --- price parsing (mirrors RevenueView so numbers line up) ---
const SERVICE_PRICE_FALLBACK: Record<string, string> = { special: 'Rp 250K', '3card': '$12', '5card': '$20', live: '$45' };
const priceToken = (s?: string | null): string | null => {
    if (!s) return null;
    const m = s.match(/Rp\s?[\d.,]+\s?(?:K|JT|jt|rb|RB)?|\$\s?[\d.,]+/);
    return m ? m[0] : null;
};
const parseAmount = (token: string | null): { amount: number; currency: Cur } | null => {
    if (!token) return null;
    if (token.includes('$')) {
        const n = parseFloat(token.replace(/[^\d.]/g, ''));
        return Number.isFinite(n) ? { amount: n, currency: 'USD' } : null;
    }
    const m = token.match(/Rp\s?([\d.,]+)\s?(K|JT|jt|rb|RB)?/);
    if (!m) return null;
    const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    const suffix = (m[2] || '').toLowerCase();
    const mult = suffix === 'jt' ? 1_000_000 : (suffix === 'k' || suffix === 'rb') ? 1_000 : 1;
    return { amount: num * mult, currency: 'IDR' };
};
const amountOf = (b: Booking) => parseAmount(priceToken(b.price) || priceToken(b.serviceName) || SERVICE_PRICE_FALLBACK[b.serviceId] || null);

const fmtMoney = (v: number, c: Cur) => c === 'IDR'
    ? `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`
    : `$${new Intl.NumberFormat('en-US').format(Math.round(v))}`;
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Turn a stored serviceName ("Konsultasi via Chat · 3 Pertanyaan") into a clean label.
const serviceLabel = (b: Booking) => {
    const parts = (b.serviceName || '').split(' · ');
    return parts.length > 1 ? `${parts[0]} — ${parts.slice(1).join(' · ')}` : (b.serviceName || b.serviceId);
};

const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/15 text-coral-deep',
    confirmed: 'bg-sage/15 text-sage',
    done: 'bg-blue/15 text-blue',
    cancelled: 'bg-mauve/15 text-mauve line-through',
};

const SalesView: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [savingId, setSavingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || undefined;
            setBookings(await getAllBookings(token));
        } catch (e) {
            setError('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    // All orders except cancelled — newest booking date first (API already sorts desc).
    const orders = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);

    // Totals split by paid/unpaid and currency.
    const totals = useMemo(() => {
        const t = { paidIDR: 0, unpaidIDR: 0, paidUSD: 0, unpaidUSD: 0 };
        orders.forEach((b) => {
            const a = amountOf(b);
            if (!a) return;
            const paid = b.paymentStatus === 'paid';
            if (a.currency === 'IDR') { paid ? (t.paidIDR += a.amount) : (t.unpaidIDR += a.amount); }
            else { paid ? (t.paidUSD += a.amount) : (t.unpaidUSD += a.amount); }
        });
        return t;
    }, [orders]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return orders.filter((b) => {
            if (payFilter !== 'all' && (b.paymentStatus || 'unpaid') !== payFilter) return false;
            if (!needle) return true;
            return (b.name || '').toLowerCase().includes(needle)
                || (b.serviceName || '').toLowerCase().includes(needle)
                || (b.contact || '').toLowerCase().includes(needle)
                || (b.ref || '').toLowerCase().includes(needle);
        });
    }, [orders, q, payFilter]);

    const togglePaid = async (b: Booking) => {
        const next = b.paymentStatus === 'paid' ? 'unpaid' : 'paid';
        setSavingId(b.id);
        setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: next } : x))); // optimistic
        try {
            const token = localStorage.getItem('authToken') || undefined;
            await updatePaymentStatus(b.id, next, token);
        } catch (e) {
            setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paymentStatus: b.paymentStatus } : x))); // revert
            setError('Could not update payment. Try again.');
        } finally {
            setSavingId(null);
        }
    };

    const outstanding = totals.unpaidIDR > 0 || totals.unpaidUSD > 0;

    return (
        <div className="space-y-5 pt-20 md:pt-8 p-4 md:px-8">
            {/* header */}
            <div className="pb-4 border-b border-adm-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-text-light mb-2">Sales</h1>
                    <p className="text-text-subtle text-sm">{orders.length} orders · mark payments as they come in</p>
                </div>
                <button onClick={load} title="Refresh"
                    className="p-2.5 rounded-full border border-adm-line-2 text-text-subtle hover:text-text-light hover:border-adm-line-3 transition-colors">
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && <div className="text-sm text-coral-deep bg-coral/10 border border-coral/30 rounded-xl px-3 py-2.5">{error}</div>}

            {/* summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-adm-line bg-surface-1 p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><CheckCircle2 size={14} className="text-sage" /> Paid</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.paidIDR, 'IDR')}</div>
                    {totals.paidUSD > 0 && <div className="text-sm text-text-subtle tabular-nums">{fmtMoney(totals.paidUSD, 'USD')}</div>}
                </div>
                <div className="rounded-2xl border border-adm-line bg-surface-1 p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><AlertCircle size={14} className="text-coral-deep" /> Outstanding</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.unpaidIDR, 'IDR')}</div>
                    {totals.unpaidUSD > 0 && <div className="text-sm text-text-subtle tabular-nums">{fmtMoney(totals.unpaidUSD, 'USD')}</div>}
                </div>
                <div className="rounded-2xl border border-adm-line bg-surface-1 p-4">
                    <div className="flex items-center gap-2 text-text-subtle text-xs uppercase tracking-wider mb-2"><Wallet size={14} className="text-blue" /> Collected total</div>
                    <div className="text-xl font-bold text-text-light tabular-nums">{fmtMoney(totals.paidIDR, 'IDR')}</div>
                    {totals.paidUSD > 0 && <div className="text-sm text-text-subtle tabular-nums">{fmtMoney(totals.paidUSD, 'USD')}</div>}
                </div>
            </div>

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, service, contact, or ref"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none" />
                </div>
                <div className="inline-flex rounded-full border border-adm-line-2 p-0.5 bg-surface-1 self-start">
                    {(['all', 'unpaid', 'paid'] as const).map((f) => (
                        <button key={f} onClick={() => setPayFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${payFilter === f ? 'bg-lilac text-[#26242B]' : 'text-text-subtle hover:text-text-light'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* table */}
            <div className="rounded-2xl border border-adm-line bg-surface-1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead>
                            <tr className="text-left text-text-subtle text-xs uppercase tracking-wider border-b border-adm-line">
                                <th className="font-semibold px-4 py-3">Booking date</th>
                                <th className="font-semibold px-4 py-3">Customer</th>
                                <th className="font-semibold px-4 py-3">Service</th>
                                <th className="font-semibold px-4 py-3 text-right">Amount</th>
                                <th className="font-semibold px-4 py-3">Status</th>
                                <th className="font-semibold px-4 py-3 text-right">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={6} className="text-center text-text-subtle py-16">No orders found.</td></tr>
                            )}
                            {filtered.map((b) => {
                                const a = amountOf(b);
                                const paid = b.paymentStatus === 'paid';
                                return (
                                    <tr key={b.id} className="border-b border-adm-line last:border-0 hover:bg-adm-hover/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-text-subtle tabular-nums">{fmtDate(b.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-text-light">{b.name || '—'}</div>
                                            <div className="text-xs text-text-subtle truncate max-w-[12rem]">{b.contact}</div>
                                        </td>
                                        <td className="px-4 py-3 text-text-light">
                                            {serviceLabel(b)}
                                            {b.source === 'manual' && <span className="ml-2 text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded bg-adm-hover text-text-subtle align-middle">manual</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-text-light">{a ? fmtMoney(a.amount, a.currency) : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => togglePaid(b)}
                                                disabled={savingId === b.id}
                                                title="Click to toggle"
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50 ${paid
                                                    ? 'bg-sage/15 text-sage border-sage/40 hover:bg-sage/25'
                                                    : 'bg-coral/15 text-coral-deep border-coral/40 hover:bg-coral/25'}`}>
                                                {paid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                                {paid ? 'Paid' : 'Unpaid'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {outstanding && (
                <p className="text-xs text-text-subtle">Tip: click a Payment pill to mark an order paid — Revenue counts only paid orders.</p>
            )}
        </div>
    );
};

export default SalesView;
