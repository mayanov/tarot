// A stand-in for PayPal's script, used only when the local API runs with
// PAYPAL_SIMULATE=1 (server/paypal.js): the same Buttons() calls as the real SDK,
// with a plain window in place of PayPal's, so the form's whole payment flow can be
// tried on localhost without keys. Never used on a deployed site.

type Handlers = {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }, actions: { restart: () => void }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (e: unknown) => void;
};

const PRICES: Record<string, string> = { '3card': '12.00', '5card': '20.00', live: '45.00' };

const btn = (label: string, bg: string, fg: string) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = `display:block;width:100%;height:44px;margin:0 0 10px;border:0;border-radius:4px;background:${bg};color:${fg};font:600 15px system-ui,sans-serif;cursor:pointer`;
  return b;
};

// the stand-in for PayPal's own window: a sheet over the site, clearly marked
function payWindow(orderId: string, amount: string, done: (r: 'pay' | 'close') => void) {
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(10,10,20,.55);display:grid;place-items:center;font:15px system-ui,sans-serif';
  const box = document.createElement('div');
  box.style.cssText = 'width:min(380px,92vw);background:#fff;color:#111;border-radius:10px;padding:22px 22px 14px;box-shadow:0 20px 60px rgba(0,0,0,.35)';
  box.innerHTML = `
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a15c00;background:#fff4e0;padding:6px 8px;border-radius:4px;margin-bottom:14px">Simulated PayPal window · localhost only · no money moves</div>
    <div style="font-size:13px;color:#555">Pay Mayanov Tarot</div>
    <div style="font-size:28px;font-weight:600;margin:4px 0 2px">$${amount} USD</div>
    <div style="font-size:12px;color:#888;margin-bottom:16px">Order ${orderId}</div>
    <div style="font-size:13px;color:#555;margin-bottom:6px">Pay with</div>
    <div style="border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:16px">Visa •••• 4242 (test card)</div>
    <div data-msg style="display:none;font-size:13px;color:#b00020;background:#fdecee;padding:8px 10px;border-radius:4px;margin-bottom:12px"></div>`;
  const pay = btn('Pay now', '#0070ba', '#fff');
  const decline = btn('Try a declined card', '#f1f1f1', '#333');
  const close = btn('Close window', 'transparent', '#555');
  const msg = box.querySelector<HTMLElement>('[data-msg]')!;
  box.append(pay, decline, close);
  veil.appendChild(box);
  document.body.appendChild(veil);
  const end = (r: 'pay' | 'close') => { veil.remove(); done(r); };
  pay.onclick = () => { pay.textContent = 'Processing…'; window.setTimeout(() => end('pay'), 900); };
  decline.onclick = () => { msg.style.display = 'block'; msg.textContent = 'This card was declined. Choose another way to pay.'; };
  close.onclick = () => end('close');
}

export function simulatedPayPal(serviceIdOf: () => string) {
  return {
    Buttons(h: Handlers) {
      let host: HTMLElement | null = null;
      return {
        render(el: HTMLElement) {
          host = el;
          const paypalBtn = btn('PayPal', '#ffc439', '#111');
          const cardBtn = btn('Debit or Credit Card', '#2c2e2f', '#fff');
          const note = document.createElement('div');
          note.textContent = 'Simulated PayPal buttons (localhost)';
          note.style.cssText = 'font:11px system-ui,sans-serif;color:#888;text-align:center';
          const start = async () => {
            let id: string;
            try { id = await h.createOrder(); } catch (e) { h.onError?.(e); return; }
            payWindow(id, PRICES[serviceIdOf()] || '', async (r) => {
              if (r === 'close') { h.onCancel?.(); return; }
              await h.onApprove({ orderID: id }, { restart: () => start() });
            });
          };
          paypalBtn.onclick = start;
          cardBtn.onclick = start;
          el.append(paypalBtn, cardBtn, note);
          return Promise.resolve();
        },
        close() { if (host) host.innerHTML = ''; return Promise.resolve(); },
      };
    },
  };
}
