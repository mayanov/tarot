import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import Card from './ui/Card';
import Button from './ui/Button';
import { CONTROL } from './ui/Field';
import InlineLoader from './ui/InlineLoader';
import { fetchEvents, createEvent, updateEvent, deleteEvent, EventItem } from '../../services/events';

// Admin — manage the "Events & Collaborations" list shown on the public site.
// Add an event (year, title, location), edit one in place, or delete it.
const FLD = `w-full px-3 py-2 ${CONTROL}`;
const LBL = 'block text-xs font-medium text-text-subtle mb-1.5';
const thisYear = String(new Date().getFullYear());
// newest year first; within a year, the most recently added first (matches the server)
const sortNewestFirst = (list: EventItem[]) =>
    [...list].sort((a, b) => (+b.year - +a.year) || (((b as any).order ?? 0) - ((a as any).order ?? 0)));

const EventsView: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    // add form
    const [draft, setDraft] = useState({ year: thisYear, title: '', loc: '' });
    const [adding, setAdding] = useState(false);

    // inline edit
    const [editId, setEditId] = useState<string | null>(null);
    const [edit, setEdit] = useState({ year: '', title: '', loc: '' });
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try { setEvents(await fetchEvents(true)); }
        catch { setError('Could not load events. Is the server running?'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(''), 2600); };

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError('');
        try {
            const created = await createEvent(draft);
            setEvents((list) => sortNewestFirst([created, ...list]));
            setDraft({ year: draft.year, title: '', loc: '' });
            load();
            flash('Event added — it’s live on the site.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not add the event.');
        } finally { setAdding(false); }
    };

    const startEdit = (ev: EventItem) => { setEditId(ev.id!); setEdit({ year: ev.year, title: ev.title, loc: ev.loc }); };
    const saveEdit = async () => {
        if (!editId) return;
        setBusyId(editId);
        setError('');
        try {
            const updated = await updateEvent(editId, edit);
            setEvents((list) => sortNewestFirst(list.map((e) => (e.id === updated.id ? updated : e))));
            setEditId(null);
            load();
            flash('Event updated.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save the event.');
        } finally { setBusyId(null); }
    };

    const remove = async (ev: EventItem) => {
        if (!ev.id || !window.confirm(`Delete “${ev.title}” (${ev.year})? This removes it from the website.`)) return;
        setBusyId(ev.id);
        setError('');
        try {
            await deleteEvent(ev.id);
            setEvents((list) => list.filter((e) => e.id !== ev.id));
            load();
            flash('Event deleted.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete the event.');
        } finally { setBusyId(null); }
    };

    // group by year (list already comes newest-first)
    const byYear = useMemo(() => {
        const groups: { year: string; items: EventItem[] }[] = [];
        events.forEach((ev) => {
            const g = groups[groups.length - 1];
            if (g && g.year === ev.year) g.items.push(ev);
            else groups.push({ year: ev.year, items: [ev] });
        });
        return groups;
    }, [events]);

    return (
        <div className="space-y-6 pt-20 md:pt-8 p-4 md:px-8 pb-16">
            <PageHeader
                title="Events & Collaborations"
                subtitle={<>The list shown on the website’s Events section. Changes go live right away · {events.length} events</>}
                onRefresh={load}
                refreshing={loading}
            />

            {/* ADD */}
            <Card className="p-5">
                <h2 className="text-sm font-semibold text-text-light mb-4">Add an event</h2>
                <form onSubmit={add} className="grid gap-4 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-end">
                    <div>
                        <label className={LBL} htmlFor="ev-year">Year</label>
                        <input id="ev-year" className={FLD} inputMode="numeric" maxLength={4} value={draft.year}
                            onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D/g, '') })} required />
                    </div>
                    <div>
                        <label className={LBL} htmlFor="ev-title">Event / collaboration</label>
                        <input id="ev-title" className={FLD} placeholder="e.g. Halloween Night at …" maxLength={140} value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
                    </div>
                    <div>
                        <label className={LBL} htmlFor="ev-loc">Venue / partner</label>
                        <input id="ev-loc" className={FLD} placeholder="e.g. Hotel Ciputra Jakarta" maxLength={140} value={draft.loc}
                            onChange={(e) => setDraft({ ...draft, loc: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={adding || !draft.title.trim() || draft.year.length !== 4}>
                        <Plus size={16} /> {adding ? 'Adding…' : 'Add event'}
                    </Button>
                </form>
            </Card>

            {(error || notice) && (
                <p className={`text-sm rounded-lg px-4 py-2.5 ${error ? 'bg-coral/10 text-coral-deep border border-coral/30' : 'bg-lilac/10 text-lilac border border-lilac/25'}`}>
                    {error || notice}
                </p>
            )}

            {/* LIST */}
            <Card className="overflow-hidden">
                {loading && !events.length ? (
                    <InlineLoader />
                ) : !events.length ? (
                    <p className="p-8 text-sm text-text-subtle">No events yet — add the first one above.</p>
                ) : (
                    byYear.map((g) => (
                        <div key={g.year} className="border-b border-adm-line last:border-0">
                            <div className="px-5 py-2.5 bg-adm-hover/40 text-xs font-semibold tracking-[0.14em] text-text-subtle">{g.year}</div>
                            <ul>
                                {g.items.map((ev) => {
                                    const editing = editId === ev.id;
                                    const busy = busyId === ev.id;
                                    return (
                                        <li key={ev.id} className="px-5 py-3.5 border-t border-adm-line first:border-t-0">
                                            {editing ? (
                                                <div className="grid gap-3 sm:grid-cols-[6rem_1fr_1fr_auto] sm:items-center">
                                                    <input className={FLD} aria-label="Year" inputMode="numeric" maxLength={4} value={edit.year}
                                                        onChange={(e) => setEdit({ ...edit, year: e.target.value.replace(/\D/g, '') })} />
                                                    <input className={FLD} aria-label="Event" maxLength={140} value={edit.title}
                                                        onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                                                    <input className={FLD} aria-label="Venue / partner" maxLength={140} value={edit.loc}
                                                        onChange={(e) => setEdit({ ...edit, loc: e.target.value })} />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={saveEdit} disabled={busy || !edit.title.trim() || edit.year.length !== 4}><Check size={14} /> Save</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={14} /> Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-text-light truncate">{ev.title}</p>
                                                        {ev.loc && <p className="text-xs font-medium text-lilac truncate mt-0.5">{ev.loc}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => startEdit(ev)} disabled={busy} title="Edit" aria-label={`Edit ${ev.title}`}
                                                            className="p-2 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover transition-colors disabled:opacity-40">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => remove(ev)} disabled={busy} title="Delete" aria-label={`Delete ${ev.title}`}
                                                            className="p-2 rounded-lg text-text-subtle hover:text-coral-deep hover:bg-coral/10 transition-colors disabled:opacity-40">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default EventsView;
