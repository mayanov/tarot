// The admin's menu groups, each with its own colour, so a page says where it belongs
// before it's read: the menu icon and bar when it's open, and the wash behind its title.
export type Tone = 'work' | 'money' | 'people' | 'site' | 'admin';

// full class names (Tailwind only keeps classes it can read whole)
export const TONE: Record<Tone, { dot: string; bar: string; soft: string; icon: string; wash: string; wash2: string }> = {
    work: { dot: 'bg-sec-work', bar: 'bg-sec-work', soft: 'bg-sec-work/10', icon: 'text-sec-work', wash: 'bg-sec-work/[0.28]', wash2: 'bg-sec-work/[0.16]' },
    money: { dot: 'bg-sec-money', bar: 'bg-sec-money', soft: 'bg-sec-money/10', icon: 'text-sec-money', wash: 'bg-sec-money/[0.28]', wash2: 'bg-sec-money/[0.16]' },
    people: { dot: 'bg-sec-people', bar: 'bg-sec-people', soft: 'bg-sec-people/10', icon: 'text-sec-people', wash: 'bg-sec-people/[0.32]', wash2: 'bg-sec-people/[0.22]' },
    site: { dot: 'bg-sec-site', bar: 'bg-sec-site', soft: 'bg-sec-site/10', icon: 'text-sec-site', wash: 'bg-sec-site/[0.28]', wash2: 'bg-sec-site/[0.16]' },
    admin: { dot: 'bg-sec-admin', bar: 'bg-sec-admin', soft: 'bg-sec-admin/10', icon: 'text-sec-admin', wash: 'bg-sec-admin/[0.22]', wash2: 'bg-sec-admin/[0.13]' },
};
