import React, { useState, useEffect } from 'react';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar esta PWA: En tu navegador selecciona "Instalar aplicación" o "Agregar a pantalla de inicio".');
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'space-between', padding: '28px' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8' }}>📱 PWA MOBILE</span>
        <span style={{
          fontSize: '0.75rem',
          padding: '4px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: isOnline ? '#10b981' : '#ef4444'
        }}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
      </header>

      {/* Main Center Message */}
      <main style={{ textAlign: 'center', margin: 'auto 0' }}>
        <div style={{ fontSize: '3.8rem', marginBottom: '16px' }}>🎓</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', lineHeight: '1.2', marginBottom: '14px' }}>
          Bienvenidos a NextCollege
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', maxWidth: '320px', margin: '0 auto 28px' }}>
          Aplicación móvil PWA base lista para ser construida en vivo con Inteligencia Artificial.
        </p>

        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            📲 Instalar App en Inicio
          </button>
        )}
      </main>

      {/* Footer Navigation */}
      <footer style={{ textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>🌐 E-commerce</a>
          <span style={{ color: '#475569' }}>&bull;</span>
          <a href="/admin" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>⚙️ Panel Admin</a>
        </div>
      </footer>
    </div>
  );
}
