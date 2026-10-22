import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'

// A lazily loaded file failed to download (usually the site was updated while this tab was open):
// reload once to pick up the new version instead of leaving the page half-rendered
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem('ik-chunk-reload')) return;
    sessionStorage.setItem('ik-chunk-reload', '1');
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});
// Once the page has been fine for a while, allow a future update to trigger one reload again
setTimeout(() => {
  try {
    sessionStorage.removeItem('ik-chunk-reload');
  } catch {
    /* ignore */
  }
}, 10000);

// Visiting the bare home page: reopen it in the language chosen last time (other links keep theirs)
try {
  if (window.location.pathname === '/' && localStorage.getItem('language') === 'es') {
    window.history.replaceState(null, '', '/es' + window.location.search + window.location.hash);
  }
} catch {
  /* storage blocked */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
