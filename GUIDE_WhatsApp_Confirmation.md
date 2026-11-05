# WhatsApp booking confirmation (Indonesian site)

When a booking on the Indonesian site is paid through Midtrans, the site sends the
customer a WhatsApp message from Mayanov's business number confirming it. It uses
WhatsApp's official API (WhatsApp Business Platform, from Meta) — code in
`server/whatsapp.js`, sent from `confirmPaidHold` in `server/bookingStore.js`, once per
payment. Until the two Vercel variables below exist, nothing is sent.

## 1. Meta: WhatsApp on Mayanov's business

Signed in to Facebook as the person who manages Mayanov's business:

1. https://business.facebook.com → create (or pick) the business **Mayanov Tarot**.
2. https://developers.facebook.com/apps → **Create app** → use case **Connect with
   customers through WhatsApp** → link it to that business.
3. In the app: **WhatsApp → API Setup** → **Add phone number**.
   - Mayanov's current number (0877-8628-0310): choose the option to connect the
     **existing WhatsApp Business app** number if Meta offers it, so the WhatsApp
     Business app keeps working alongside.
   - Or a new number that isn't on WhatsApp yet.
   Verify it with the code Meta sends, and set the display name **Mayanov Tarot**.
4. Add a payment method in WhatsApp Manager (**Billing**) — Meta charges per
   confirmation sent (a few hundred rupiah each in Indonesia).

## 2. The message template

WhatsApp Manager → **Message templates** → **Create template**:

- Category: **Utility**
- Name: `booking_terkonfirmasi`
- Language: **Indonesian**
- Body (copy exactly; the `{{n}}` are filled in by the site):

```
Halo {{1}}, booking kamu di Mayanov Tarot sudah terkonfirmasi ✨

Layanan: {{2}}
Jadwal: {{3}}
Total dibayar: {{4}}
Kode booking: {{5}}

Kalau ada yang perlu ditanyakan atau mau ganti jadwal, balas saja pesan ini ya. Sampai ketemu!
```

- Sample values Meta asks for: `Sasa` · `Sesi Tatap Muka · 2 Jam` ·
  `Jumat, 13 Nov 2026 · 14:00–16:00 WIB` · `Rp 810.000` · `MYV-3F9A2C7B1D`

Submit. Approval usually takes minutes to a day. Replies to the message arrive on the
number from step 1.3.

## 3. A token that doesn't expire

1. https://business.facebook.com/settings → **Users → System users** → **Add** (Admin).
2. **Assign assets**: the app (full control) and the WhatsApp account (full control).
3. **Generate token** → the app → permissions `whatsapp_business_messaging` and
   `whatsapp_business_management` → expiry **Never**. Copy it.
4. From **WhatsApp → API Setup**, copy the **Phone number ID** (a long number — not the
   phone number itself).

## 4. Vercel

Project **mayanov-tarot** → Settings → Environment Variables → **Production** only:

| Key | Value |
|---|---|
| `WHATSAPP_TOKEN` | the system user token (mark Sensitive) |
| `WHATSAPP_PHONE_NUMBER_ID` | the Phone number ID |

Publish staging again. A failed send never blocks a booking: the reason is logged and
saved on the booking as `waConfirmError`; a sent one as `waConfirmSentAt`.
