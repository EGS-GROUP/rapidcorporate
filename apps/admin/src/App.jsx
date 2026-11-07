import React, { useState, useEffect } from 'react';

export default function App() {
  const [serverHealth, setServerHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerHealth(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '580px', width: '100%', textAlign: 'center', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '44px 36px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'inline-block', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '18px' }}>
          ⚙️ PANEL DE CONTROL &bull; SCAFFOLD
        </div>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px', lineHeight: '1.2' }}>
          Bienvenidos a NextCollege
        </h1>
        
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '32px' }}>
          Panel administrativo base listo para generar módulos, tablas y métricas en vivo con Inteligencia Artificial.
        </p>

        {/* Database Status Card */}
        <div style={{ background: '#172033', border: '1px solid #1f2937', borderRadius: '12px', padding: '18px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
            Estado de Conexión a Base de Datos
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: serverHealth?.database?.connected ? '#10b981' : '#f59e0b' }}>
            {serverHealth?.database?.mode === 'mysql' ? '🐬 Conectado a MySQL' : '⚡ Operando en Modo In-Memory'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Host: {serverHealth?.database?.host || 'Auto'} &bull; Base de Datos: {serverHealth?.database?.database || 'demo'}
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <a href="/" style={{ background: '#2563eb', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s' }}>
            🌐 Ir al E-commerce
          </a>
          <a href="/app" style={{ background: '#1f2937', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #374151' }}>
            📱 Ir a PWA Mobile
          </a>
        </div>
      </div>
    </div>
  );
}
