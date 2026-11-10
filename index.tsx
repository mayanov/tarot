import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Back from Xendit's payment page (/?bayar=<order>): that page was opened in a new tab
// by the booking form, which is still open in the first tab and has seen the payment,
// so this tab closes itself. If it can't (paid in the same tab), it's just the home page.
if (new URLSearchParams(window.location.search).has('bayar')) {
  if (window.opener) window.close();
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}

// the built page loads its stylesheet without holding up the first frame (vite.config.ts):
// the app starts once it's in, so nothing is ever drawn unstyled
const cssReady: Promise<unknown> = (window as unknown as { __cssReady?: Promise<unknown> }).__cssReady ?? Promise.resolve();
cssReady.then(() => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
