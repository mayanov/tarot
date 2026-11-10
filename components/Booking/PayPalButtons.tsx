import React, { useEffect, useRef, useState } from 'react';
import type { Booking, BookingInput } from '../../services/booking';
import { PayPalConfig, loadPayPal, createPayPalOrder, capturePayPalOrder } from '../../services/paypal';

interface Props {
  config: PayPalConfig;
  input: BookingInput;
  onStart: () => void;
  onPaid: (booking: Booking) => void;
  onError: (code: string) => void;
  /** the buyer closed PayPal's window, or PayPal declined their card (and asks again) */
  onIssue?: (reason: 'closed' | 'declined') => void;
}

// PayPal's own buttons (PayPal + debit/credit card) on the review step. The order is
// made and captured by the API, so the amount can't be changed in the browser; a
// declined card goes back to PayPal to pick another way to pay. Starting a payment saves
// the booking (pending, unpaid, in the dashboard); closing PayPal's window leaves it so,
// and it's cancelled by itself if it isn't paid within the hour. Trying again reuses it.
const PayPalButtons: React.FC<Props> = ({ config, input, onStart, onPaid, onError, onIssue }) => {
  const box = useRef<HTMLDivElement>(null);
  // the buttons are drawn once; their callbacks read the latest form values from here
  const latest = useRef({ input, onStart, onPaid, onError, onIssue });
  latest.current = { input, onStart, onPaid, onError, onIssue };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let buttons: any = null;
    // the last order made here (its booking is reused by the next one), and why making
    // one failed, if it did (PayPal only reports that it failed)
    let order: string | null = null;
    let orderFail: string | null = null;
    loadPayPal(config, () => latest.current.input.serviceId)
      .then((paypal) => {
        if (!alive || !box.current) return;
        buttons = paypal.Buttons({
          style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 44, tagline: false },
          createOrder: async () => {
            latest.current.onStart();
            orderFail = null;
            try {
              order = await createPayPalOrder(latest.current.input, order);
              return order;
            } catch (e) {
              orderFail = e instanceof Error ? e.message : 'ORDER_FAILED';
              throw e;
            }
          },
          onApprove: async (data: { orderID: string }, actions: { restart: () => void }) => {
            try {
              const booking = await capturePayPalOrder(data.orderID, latest.current.input);
              order = null; // paid: the booking is done with
              latest.current.onPaid(booking);
            } catch (e) {
              const code = e instanceof Error ? e.message : 'CAPTURE_FAILED';
              if (code === 'DECLINED') { latest.current.onIssue?.('declined'); return actions.restart(); }
              latest.current.onError(code);
            }
          },
          onCancel: () => { latest.current.onIssue?.('closed'); },
          onError: () => { latest.current.onError(orderFail || 'PAYPAL'); },
        });
        return buttons.render(box.current).then(() => { if (alive) setReady(true); });
      })
      .catch(() => { if (alive) latest.current.onError('PAYPAL_SDK'); });
    return () => { alive = false; buttons?.close?.().catch?.(() => {}); };
  }, [config]);

  return (
    <div className="relative min-h-[104px]">
      {!ready && <span className="letterpress absolute inset-0 grid place-items-center text-sm text-ink/50">Loading PayPal…</span>}
      <div ref={box} className="relative z-[1]" />
    </div>
  );
};

export default PayPalButtons;
