import React, { useState, useEffect } from 'react';
import { syncSingleCatalog } from '../services/idempiereSyncService';

export default function ProductsView({ session, onNotify }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    value: '',
    name: '',
    category_id: '',
    price: 0,
    stock: 50,
    image: '',
    description: '',
    is_active: 1
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/product-categories')
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) setProducts(prodData.data || []);
      if (catData.success) setCategories(catData.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error cargando datos de productos');
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
      const result = await syncSingleCatalog('products', session);
      if (onNotify) onNotify('success', `¡Sincronizado! Se procesaron ${result.count} productos desde iDempiere.`);
      loadData();
    } catch (err) {
      if (onNotify) onNotify('error', `Fallo al sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      id: '',
      value: `SKU-${Date.now().toString().slice(-5)}`,
      name: '',
      category_id: categories[0]?.id || '',
      price: 9.99,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      description: '',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      id: prod.id,
      value: prod.value || '',
      name: prod.name || '',
      category_id: prod.category_id || '',
      price: prod.price || 0,
      stock: prod.stock || 0,
      image: prod.image || '',
      description: prod.description || '',
      is_active: prod.is_active ? 1 : 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el producto #${id}?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
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
      let url = '/api/products';
      let method = 'POST';

      if (editingProduct) {
        url = `/api/products/${editingProduct.id}`;
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
            🍔 Catálogo de Productos
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Mapeo con iDempiere ERP: <code style={{ color: '#38bdf8' }}>M_Product</code> &bull; Base local: <span style={{ color: '#10b981' }}>SQLite</span>
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
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '14px 18px' }}>ID / Img</th>
              <th style={{ padding: '14px 18px' }}>SKU / Código</th>
              <th style={{ padding: '14px 18px' }}>Nombre</th>
              <th style={{ padding: '14px 18px' }}>Categoría</th>
              <th style={{ padding: '14px 18px' }}>Precio</th>
              <th style={{ padding: '14px 18px' }}>Stock</th>
              <th style={{ padding: '14px 18px' }}>Estado</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Cargando productos desde SQLite...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No hay productos registrados. Haz clic en "Sincronizar desde ERP" o añade uno nuevo.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                      alt={p.name}
                      style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', background: '#1f2937' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'; }}
                    />
                    <span style={{ fontWeight: '700', color: '#94a3b8' }}>#{p.id}</span>
                  </td>
                  <td style={{ padding: '12px 18px', color: '#38bdf8', fontFamily: 'monospace' }}>{p.value || '-'}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '600' }}>{p.name}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {p.category_name || 'Sin Categoría'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: '800', color: '#10b981' }}>${Number(p.price).toFixed(2)}</td>
                  <td style={{ padding: '12px 18px', color: '#cbd5e1' }}>{p.stock} un.</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: p.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: p.is_active ? '#34d399' : '#f87171'
                    }}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(p)}
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
                      onClick={() => handleDelete(p.id)}
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
          <div style={{ background: '#1e2433', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
              {editingProduct ? `Editar Producto #${editingProduct.id}` : 'Crear Nuevo Producto'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>SKU / Código *</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Seleccione Categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre del Producto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Stock Disponible</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>URL de Imagen</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
