import React, { useState, useEffect } from 'react';
import { syncSingleCatalog } from '../services/idempiereSyncService';

export default function CustomersView({ session, onNotify }) {
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    value: '',
    name: '',
    tax_id: '',
    group_id: '',
    email: '',
    phone: '',
    is_customer: 1,
    is_vendor: 0,
    is_active: 1
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, gRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/customer-categories')
      ]);
      const cData = await cRes.json();
      const gData = await gRes.json();

      if (cData.success) setCustomers(cData.data || []);
      if (gData.success) setGroups(gData.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error cargando datos de clientes');
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
      const result = await syncSingleCatalog('customers', session);
      if (onNotify) onNotify('success', `¡Sincronizado! Se procesaron ${result.count} clientes/socios de negocio.`);
      loadData();
    } catch (err) {
      if (onNotify) onNotify('error', `Fallo al sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      id: '',
      value: `BP-${Date.now().toString().slice(-5)}`,
      name: '',
      tax_id: '20' + Math.floor(100000000 + Math.random() * 900000000),
      group_id: groups[0]?.id || '',
      email: 'contacto@cliente.com',
      phone: '+51 987 654 321',
      is_customer: 1,
      is_vendor: 0,
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      id: c.id,
      value: c.value || '',
      name: c.name || '',
      tax_id: c.tax_id || '',
      group_id: c.group_id || '',
      email: c.email || '',
      phone: c.phone || '',
      is_customer: c.is_customer ? 1 : 0,
      is_vendor: c.is_vendor ? 1 : 0,
      is_active: c.is_active ? 1 : 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al cliente #${id}?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify('success', data.message);
        loadData();
      } else {
        if (onNotify) onNotify('error', data.error);
      }
    } catch (err) {
      if (onNotify) onNotify('error', err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = '/api/customers';
      let method = 'POST';

      if (editingCustomer) {
        url = `/api/customers/${editingCustomer.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        if (onNotify) onNotify('success', data.message);
        setShowModal(false);
        loadData();
      } else {
        if (onNotify) onNotify('error', data.error);
      }
    } catch (err) {
      if (onNotify) onNotify('error', err.message);
    }
  };

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: '800' }}>
            🏢 Clientes & Socios de Negocio
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Mapeo con iDempiere ERP: <code style={{ color: '#38bdf8' }}>C_BPartner</code> &bull; Base local: <span style={{ color: '#10b981' }}>SQLite</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
              cursor: syncing ? 'not-allowed' : 'pointer'
            }}
          >
            {syncing ? '🔄 Sincronizando...' : '⚡ Sincronizar desde ERP'}
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 18px',
              background: '#ff6b00',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '14px 18px' }}>ID</th>
              <th style={{ padding: '14px 18px' }}>Código / RUC</th>
              <th style={{ padding: '14px 18px' }}>Razón Social / Nombre</th>
              <th style={{ padding: '14px 18px' }}>Grupo Cliente</th>
              <th style={{ padding: '14px 18px' }}>Contacto</th>
              <th style={{ padding: '14px 18px' }}>Tipo</th>
              <th style={{ padding: '14px 18px' }}>Estado</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Cargando clientes...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No hay clientes registrados. Haz clic en "Sincronizar desde ERP" o agrega uno nuevo.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: '#cbd5e1' }}>#{c.id}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: '700' }}>{c.value || '-'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{c.tax_id ? `RUC: ${c.tax_id}` : ''}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{c.name}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {c.group_name || 'Estándar'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{c.email || '-'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{c.phone || ''}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {c.is_customer ? (
                      <span style={{ padding: '2px 6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginRight: '4px' }}>
                        Cliente
                      </span>
                    ) : null}
                    {c.is_vendor ? (
                      <span style={{ padding: '2px 6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        Proveedor
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: c.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: c.is_active ? '#34d399' : '#f87171'
                    }}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', marginRight: '8px', fontSize: '0.8rem' }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: '#1e2433', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
              {editingCustomer ? `Editar Cliente #${editingCustomer.id}` : 'Crear Nuevo Cliente / Socio'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Código (Value) *</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>RUC / Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Razón Social / Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Grupo de Cliente</label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                >
                  <option value="">Seleccione Grupo</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: '#334155', border: 'none', borderRadius: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
                  {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
