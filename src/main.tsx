import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const isDevelopment = import.meta.env.DEV;

{
  const nativeFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init?.headers);
    const storedToken = localStorage.getItem('remitbd_admin_token');
    if ((path.startsWith('/api/admin') || path.startsWith('/api/customer')) && storedToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${storedToken}`);
    }
    const nextInit = { ...init, headers };
    if (!isDevelopment && apiBase && path.startsWith('/api')) {
      return nativeFetch(`${apiBase}${path}`, nextInit);
    }
    return nativeFetch(input, nextInit);
  }) as typeof window.fetch;
}

function ServerRequiredGate() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  useEffect(() => {
    if (!isDevelopment && !apiBase) {
      setStatus('error');
      return;
    }
    const healthUrl = isDevelopment ? '/health' : `${apiBase}/health`;
    fetch(healthUrl, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Backend health check failed (${response.status})`);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('RemitBD backend health check failed', error);
        setStatus('error');
      });
  }, []);
  if (status !== 'ready') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui', color: '#0f172a' }}><div style={{ maxWidth: 520, textAlign: 'center' }}><h1>{status === 'checking' ? 'Connecting to RemitBD server…' : 'RemitBD server connection required'}</h1><p>{!isDevelopment && !apiBase ? 'Set VITE_API_BASE_URL to the Python API URL before building the portal.' : 'The configured Python API is unavailable. The portal will not show cached or demo data.'}</p></div></div>;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServerRequiredGate />
  </StrictMode>,
);
