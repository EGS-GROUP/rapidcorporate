import React, { useState, useEffect } from 'react';
import { syncSingleCatalog } from '../services/idempiereSyncService';

export default function TaxesView({ session, onNotify }) {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxes');
      const data = await res.json();
      if (data.success) {
        setTaxes(data.data || []);
      }
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error cargando impuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    if (!session) {
      if (onNotify) onNotify('warning', 'Inicie sesión en iDempiere para sincronizar este catálogo.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncSingleCatalog('taxes', session);
      if (onNotify) onNotify('success', `¡Sincronizado! Se procesaron ${result.count} tasas de impuestos desde iDempiere.`);
      loadData();
    } catch (err) {
      if (onNotify) onNotify('error', `Fallo al sincronizar impuestos: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '8px' }}>
            🔒 SOLO LECTURA &bull; MAESTRO ERP
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: '800' }}>
            ⚖️ Catálogo de Impuestos (C_Tax)
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Este catálogo se sincroniza directamente desde el ERP iDempiere para garantizar la consistencia fiscal. No permite mutaciones manuales locales.
          </p>
        </div>

        <div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 18px',
              background: syncing ? '#475569' : '#0284c7',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {syncing ? '🔄 Sincronizando...' : '⚡ Sincronizar Impuestos desde ERP'}
          </button>
        </div>
      </div>

      {/* Tabla Solo Lectura */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '14px 18px' }}>ID ERP</th>
              <th style={{ padding: '14px 18px' }}>Indicador / Código</th>
              <th style={{ padding: '14px 18px' }}>Nombre del Impuesto</th>
              <th style={{ padding: '14px 18px' }}>Descripción</th>
              <th style={{ padding: '14px 18px' }}>Tasa / Porcentaje</th>
              <th style={{ padding: '14px 18px' }}>Estado</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Modo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Cargando catálogo de impuestos desde SQLite...
                </td>
              </tr>
            ) : taxes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No hay impuestos sincronizados en SQLite. Haz clic en "Sincronizar Impuestos desde ERP".
                </td>
              </tr>
            ) : (
              taxes.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: '#cbd5e1' }}>#{t.id}</td>
                  <td style={{ padding: '14px 18px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: '700' }}>
                    {t.tax_indicator || 'STD'}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{t.name}</td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{t.description || '-'}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '800', color: '#10b981', fontSize: '0.95rem' }}>
                    {t.rate}%
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: t.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: t.is_active ? '#34d399' : '#f87171'
                    }}>
                      {t.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: '#1f2937',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      border: '1px solid #374151'
                    }}>
                      👁️ Solo Lectura
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
