import React, { useState, useEffect } from 'react';
import { syncSingleCatalog } from '../services/idempiereSyncService';

export default function ProductCategoriesView({ session, onNotify }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    value: '',
    name: '',
    description: '',
    is_active: 1
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/product-categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error al cargar categorías de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSync = async () => {
    if (!session) {
      if (onNotify) onNotify('warning', 'Inicie sesión en iDempiere para sincronizar este catálogo.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncSingleCatalog('product_categories', session);
      if (onNotify) onNotify('success', `¡Sincronizado! Se procesaron ${result.count} categorías desde iDempiere.`);
      loadCategories();
    } catch (err) {
      if (onNotify) onNotify('error', `Fallo al sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      id: '',
      value: `CAT-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      id: cat.id,
      value: cat.value || '',
      name: cat.name || '',
      description: cat.description || '',
      is_active: cat.is_active ? 1 : 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría #${id}?`)) return;
    try {
      const res = await fetch(`/api/product-categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify('success', data.message);
        loadCategories();
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
      let url = '/api/product-categories';
      let method = 'POST';

      if (editingCategory) {
        url = `/api/product-categories/${editingCategory.id}`;
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
        loadCategories();
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
            📁 Categorías de Productos
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Mapeo con iDempiere ERP: <code style={{ color: '#38bdf8' }}>M_Product_Category</code> &bull; Base local: <span style={{ color: '#10b981' }}>SQLite</span>
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
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
            + Nueva Categoría
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '14px 18px' }}>ID</th>
              <th style={{ padding: '14px 18px' }}>Código (Value)</th>
              <th style={{ padding: '14px 18px' }}>Nombre</th>
              <th style={{ padding: '14px 18px' }}>Descripción</th>
              <th style={{ padding: '14px 18px' }}>Estado</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Cargando categorías...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No hay categorías registradas. Haz clic en "Sincronizar desde ERP" o agrega una nueva.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: '#cbd5e1' }}>#{c.id}</td>
                  <td style={{ padding: '14px 18px', color: '#38bdf8', fontFamily: 'monospace' }}>{c.value || '-'}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{c.name}</td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{c.description || '-'}</td>
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
                      style={{
                        padding: '6px 12px',
                        background: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        marginRight: '8px',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      🗑️ Eliminar
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{ background: '#1e2433', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '460px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
              {editingCategory ? `Editar Categoría #${editingCategory.id}` : 'Crear Nueva Categoría'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Código (Value)</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Descripción</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 16px', background: '#334155', border: 'none', borderRadius: '8px', color: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
