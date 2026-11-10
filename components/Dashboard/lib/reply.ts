// Where a reading is answered: the customer's emails in the business Gmail (the thread
// with their question, to reply to with the reading), or their WhatsApp chat for a chat
// question or when there's no email.
import type { Booking } from '../../../services/booking';
import { emailOf } from './format';
import { waNumberOf } from '../WaConfirmButton';

const BUSINESS_GMAIL = 'tarotreadingbymayanov@gmail.com';
export const replyLink = (b: Booking): { href: string; kind: 'email' | 'wa'; to: string } | null => {
    const email = emailOf(b.contact);
    const wa = waNumberOf(b.contact);
    if (wa && (b.serviceId === 'chat' || !email)) return { kind: 'wa', to: wa, href: `https://wa.me/${wa}` }; // a chat is answered on WhatsApp
    return email ? { kind: 'email', to: email, href: `https://mail.google.com/mail/?authuser=${encodeURIComponent(BUSINESS_GMAIL)}#search/${encodeURIComponent(email)}` } : null;
};
