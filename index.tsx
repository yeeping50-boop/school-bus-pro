
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("BusPro: Initializing Application...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  const msg = "Critical Error: Could not find root element. The HTML might be corrupted.";
  console.error(msg);
  document.body.innerHTML = `<div style="padding:20px; color:red;">${msg}</div>`;
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("BusPro: Render successful.");
  } catch (err) {
    console.error("BusPro: Render failed", err);
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
        errorDisplay.style.display = 'block';
        errorDisplay.innerText = "Startup Error: " + err.message + "\n" + err.stack;
    }
  }
}
