import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
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
