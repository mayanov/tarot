import React, { useEffect, useRef, useState } from 'react';
import type { Booking, BookingInput } from '../../services/booking';
import { PayPalConfig, loadPayPal, createPayPalOrder, capturePayPalOrder } from '../../services/paypal';

interface Props {
  config: PayPalConfig;
  input: BookingInput;
  onStart: () => void;
  onPaid: (booking: Booking) => void;
  onError: (code: string) => void;
}

// PayPal's own buttons (PayPal + debit/credit card) on the review step. The order is
// made and captured by the API, so the amount can't be changed in the browser; a
// declined card goes back to PayPal to pick another way to pay.
const PayPalButtons: React.FC<Props> = ({ config, input, onStart, onPaid, onError }) => {
  const box = useRef<HTMLDivElement>(null);
  // the buttons are drawn once; their callbacks read the latest form values from here
  const latest = useRef({ input, onStart, onPaid, onError });
  latest.current = { input, onStart, onPaid, onError };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let buttons: any = null;
    loadPayPal(config)
      .then((paypal) => {
        if (!alive || !box.current) return;
        buttons = paypal.Buttons({
          style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 44, tagline: false },
          createOrder: () => { latest.current.onStart(); return createPayPalOrder(latest.current.input.serviceId); },
          onApprove: async (data: { orderID: string }, actions: { restart: () => void }) => {
            try {
              latest.current.onPaid(await capturePayPalOrder(data.orderID, latest.current.input));
            } catch (e) {
              const code = e instanceof Error ? e.message : 'CAPTURE_FAILED';
              if (code === 'DECLINED') return actions.restart();
              latest.current.onError(code);
            }
          },
          onError: () => latest.current.onError('PAYPAL'),
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
