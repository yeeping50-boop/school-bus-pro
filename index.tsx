
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Use the global log function if available
const debugLog = (window as any).log || console.log;

debugLog("BusPro: Script execution started.");

const rootElement = document.getElementById('root');

if (!rootElement) {
  debugLog("BusPro: Root element missing!", "ERROR");
} else {
  try {
    debugLog("BusPro: Mounting React components...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    debugLog("BusPro: React render triggered.");
  } catch (err) {
    debugLog("BusPro: Crash during mount: " + err.message, "ERROR");
  }
}
