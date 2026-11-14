import React, { useState, useEffect } from 'react';
import { syncAllCatalogs } from '../services/idempiereSyncService';

export default function DatabaseStatusView({ session, onNotify, onGlobalSyncSuccess }) {
  const [health, setHealth] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSyncing, setGlobalSyncing] = useState(false);
  const [progress, setProgress] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, lRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/sync/logs?limit=15')
      ]);
      const hData = await hRes.json();
      const lData = await lRes.json();

      setHealth(hData);
      if (lData.success) setSyncLogs(lData.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error cargando estado del servidor y SQLite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGlobalSync = async () => {
    if (!session) {
      if (onNotify) onNotify('warning', 'Inicie sesión en iDempiere para ejecutar la sincronización global.');
      return;
    }

    setGlobalSyncing(true);
    setProgress({ current: 0, total: 6, name: 'Iniciando...' });

    try {
      const results = await syncAllCatalogs(session, (p) => setProgress(p));
      const successful = results.filter(r => r.success).length;
      if (onNotify) onNotify('success', `¡Sincronización completa! Se actualizaron ${successful} de ${results.length} catálogos.`);
      loadData();
      if (onGlobalSyncSuccess) onGlobalSyncSuccess();
    } catch (err) {
      if (onNotify) onNotify('error', `Error en sincronización global: ${err.message}`);
    } finally {
      setGlobalSyncing(false);
      setProgress(null);
    }
  };

  const stats = health?.database?.stats || {
    products: 0,
    categories: 0,
    prices: 0,
    customers: 0,
    taxes: 0
  };

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: '800' }}>
            📊 Panel Central &bull; Base de Datos SQLite
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Arquitectura ligera de alto rendimiento &bull; Motor: <span style={{ color: '#10b981', fontWeight: '700' }}>better-sqlite3 (WAL Mode)</span>
          </p>
        </div>

        <div>
          <button
            onClick={handleGlobalSync}
            disabled={globalSyncing}
            style={{
              padding: '12px 24px',
              background: globalSyncing ? '#475569' : 'linear-gradient(135deg, #ff6b00 0%, #af002d 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: globalSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(255, 107, 0, 0.35)'
            }}
          >
            {globalSyncing
              ? `🔄 Sincronizando (${progress?.current}/${progress?.total}: ${progress?.name})...`
              : '⚡ Sincronizar Todos los Catálogos desde ERP'}
          </button>
        </div>
      </div>

      {/* Grid de Métricas de Catálogos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>
            🍔 Productos
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>
            {stats.products}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: '4px' }}>
            Tabla: <code>products</code>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>
            📁 Categorías Prod.
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>
            {stats.categories}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: '4px' }}>
            Tabla: <code>product_categories</code>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>
            🏷️ Precios Registrados
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>
            {stats.prices}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: '4px' }}>
            Tabla: <code>product_prices</code>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>
            🏢 Clientes / Partners
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>
            {stats.customers}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: '4px' }}>
            Tabla: <code>customers</code>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>
            ⚖️ Tasas de Impuesto
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>
            {stats.taxes}
          </div>
          <div style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '4px' }}>
            Solo Lectura: <code>taxes</code>
          </div>
        </div>
      </div>

      {/* Tarjeta de Especificación Técnica SQLite */}
      <div style={{ background: '#0d131f', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛠️</span> Especificación de Infraestructura &bull; SQLite Production
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Archivo de Base de Datos:</div>
            <code style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{health?.database?.file || 'server/data/database.sqlite'}</code>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Modo Transaccional:</div>
            <span style={{ color: '#10b981', fontWeight: '700' }}>WAL (Write-Ahead Logging) &bull; Concurrencia Total</span>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Proxy Server-to-Server:</div>
            <code style={{ color: '#a78bfa' }}>/api/idempiere-proxy?target=...</code>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Uptime del Backend:</div>
            <span style={{ color: '#f8fafc' }}>{Math.floor(health?.uptime || 0)} segundos activos</span>
          </div>
        </div>
      </div>

      {/* Historial de Auditoría de Sincronización */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
            📜 Registro de Auditoría de Sincronización (sync_logs)
          </h3>
          <button
            onClick={loadData}
            style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem' }}
          >
            Actualizar Logs
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '12px 18px' }}>ID</th>
              <th style={{ padding: '12px 18px' }}>Catálogo</th>
              <th style={{ padding: '12px 18px' }}>Registros</th>
              <th style={{ padding: '12px 18px' }}>Estado</th>
              <th style={{ padding: '12px 18px' }}>Mensaje</th>
              <th style={{ padding: '12px 18px' }}>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Cargando logs de sincronización...
                </td>
              </tr>
            ) : syncLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Aún no se han ejecutado sincronizaciones. Haz clic en "Sincronizar Todos los Catálogos".
                </td>
              </tr>
            ) : (
              syncLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#cbd5e1' }}>#{log.id}</td>
                  <td style={{ padding: '12px 18px', color: '#38bdf8', fontWeight: '700' }}>{log.catalog}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#10b981' }}>{log.count}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: log.status === 'SUCCESS' ? '#34d399' : '#f87171'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', color: '#94a3b8' }}>{log.message}</td>
                  <td style={{ padding: '12px 18px', color: '#64748b', fontSize: '0.78rem' }}>{log.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
