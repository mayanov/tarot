// One colour per service, the same everywhere in the admin: the dots on Today and
// Payments, the money report's charts. Muted, so they sit well together in both themes.
export const SERVICE_COLOR: Record<string, string> = {
    chat: '#7C5CC4', call: '#3E7CC9', meetup: '#2E9E6A', special: '#D98E2B',
    '3card': '#C8578F', '5card': '#2A9DA6', payl: '#9A93A8',
};
// the Live Session (older bookings saved as 'live') is the global call: the call's colour
SERVICE_COLOR.live = SERVICE_COLOR.call;
export const colorFor = (id?: string) => (id && SERVICE_COLOR[id]) || '#B5AEC4';
