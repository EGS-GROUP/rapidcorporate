import React, { useState, useEffect } from 'react';
import { syncSingleCatalog } from '../services/idempiereSyncService';

export default function PriceListsView({ session, onNotify }) {
  const [activeTab, setActiveTab] = useState('lists'); // 'lists', 'versions', 'prices'
  const [priceLists, setPriceLists] = useState([]);
  const [versions, setVersions] = useState([]);
  const [productPrices, setProductPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('list'); // 'list', 'version', 'price'
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [listForm, setListForm] = useState({ name: '', description: '', currency: 'USD', is_active: 1 });
  const [versionForm, setVersionForm] = useState({ price_list_id: '', name: '', valid_from: '', is_active: 1 });
  const [priceForm, setPriceForm] = useState({ price_list_version_id: '', product_id: '', product_name: '', price_list: 0, price_std: 0, price_limit: 0 });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [lRes, vRes, pRes] = await Promise.all([
        fetch('/api/price-lists'),
        fetch('/api/price-list-versions'),
        fetch('/api/product-prices')
      ]);
      const lData = await lRes.json();
      const vData = await vRes.json();
      const pData = await pRes.json();

      if (lData.success) setPriceLists(lData.data || []);
      if (vData.success) setVersions(vData.data || []);
      if (pData.success) setProductPrices(pData.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Error al cargar listas de precios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSync = async () => {
    if (!session) {
      if (onNotify) onNotify('warning', 'Inicie sesión en iDempiere para sincronizar este catálogo.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncSingleCatalog('price_lists', session);
      if (onNotify) onNotify('success', `¡Sincronizado! ${result.details || result.count + ' registros'}`);
      loadAll();
    } catch (err) {
      if (onNotify) onNotify('error', `Fallo al sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Open modal for Price List
  const handleOpenListModal = (item = null) => {
    setModalType('list');
    setEditingItem(item);
    if (item) {
      setListForm({ name: item.name || '', description: item.description || '', currency: item.currency || 'USD', is_active: item.is_active ? 1 : 0 });
    } else {
      setListForm({ name: '', description: '', currency: 'USD', is_active: 1 });
    }
    setShowModal(true);
  };

  // Open modal for Version
  const handleOpenVersionModal = (item = null) => {
    setModalType('version');
    setEditingItem(item);
    if (item) {
      setVersionForm({ price_list_id: item.price_list_id, name: item.name, valid_from: item.valid_from || '', is_active: item.is_active ? 1 : 0 });
    } else {
      setVersionForm({ price_list_id: priceLists[0]?.id || '', name: 'Versión 2026', valid_from: new Date().toISOString().slice(0, 10), is_active: 1 });
    }
    setShowModal(true);
  };

  // Open modal for Product Price
  const handleOpenPriceModal = (item = null) => {
    setModalType('price');
    setEditingItem(item);
    if (item) {
      setPriceForm({
        price_list_version_id: item.price_list_version_id,
        product_id: item.product_id,
        product_name: item.product_name || '',
        price_list: item.price_list || 0,
        price_std: item.price_std || 0,
        price_limit: item.price_limit || 0
      });
    } else {
      setPriceForm({
        price_list_version_id: versions[0]?.id || '',
        product_id: '',
        product_name: '',
        price_list: 10,
        price_std: 9,
        price_limit: 8
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let method = editingItem ? 'PUT' : 'POST';
      let payload = {};

      if (modalType === 'list') {
        endpoint = editingItem ? `/api/price-lists/${editingItem.id}` : '/api/price-lists';
        payload = listForm;
      } else if (modalType === 'version') {
        endpoint = editingItem ? `/api/price-list-versions/${editingItem.id}` : '/api/price-list-versions';
        payload = versionForm;
      } else if (modalType === 'price') {
        endpoint = editingItem ? `/api/product-prices/${editingItem.id}` : '/api/product-prices';
        payload = priceForm;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (onNotify) onNotify('success', data.message);
        setShowModal(false);
        loadAll();
      } else {
        if (onNotify) onNotify('error', data.error);
      }
    } catch (err) {
      if (onNotify) onNotify('error', err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar este registro #${id}?`)) return;
    try {
      let path = '';
      if (type === 'list') path = `/api/price-lists/${id}`;
      if (type === 'version') path = `/api/price-list-versions/${id}`;
      if (type === 'price') path = `/api/product-prices/${id}`;

      const res = await fetch(path, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify('success', data.message);
        loadAll();
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
            🏷️ Catálogo de Precios (Listas, Versiones & Precios)
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Mapeo ERP: <code style={{ color: '#38bdf8' }}>M_PriceList &bull; M_PriceList_Version &bull; M_ProductPrice</code>
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
            {syncing ? '🔄 Sincronizando...' : '⚡ Sincronizar Precios ERP'}
          </button>

          {activeTab === 'lists' && (
            <button onClick={() => handleOpenListModal()} style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
              + Nueva Lista
            </button>
          )}
          {activeTab === 'versions' && (
            <button onClick={() => handleOpenVersionModal()} style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
              + Nueva Versión
            </button>
          )}
          {activeTab === 'prices' && (
            <button onClick={() => handleOpenPriceModal()} style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
              + Asignar Precio
            </button>
          )}
        </div>
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('lists')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'lists' ? '#1f2937' : 'transparent',
            color: activeTab === 'lists' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'lists' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          1. Listas de Precios ({priceLists.length})
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'versions' ? '#1f2937' : 'transparent',
            color: activeTab === 'versions' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'versions' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          2. Versiones de Listas ({versions.length})
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'prices' ? '#1f2937' : 'transparent',
            color: activeTab === 'prices' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'prices' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          3. Precios de Productos ({productPrices.length})
        </button>
      </div>

      {/* Tab 1: Listas de Precios */}
      {activeTab === 'lists' && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
                <th style={{ padding: '14px 18px' }}>ID</th>
                <th style={{ padding: '14px 18px' }}>Nombre</th>
                <th style={{ padding: '14px 18px' }}>Descripción</th>
                <th style={{ padding: '14px 18px' }}>Moneda</th>
                <th style={{ padding: '14px 18px' }}>Estado</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {priceLists.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700' }}>#{l.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{l.name}</td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{l.description || '-'}</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>{l.currency || 'USD'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: l.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: l.is_active ? '#34d399' : '#f87171' }}>
                      {l.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenListModal(l)} style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', marginRight: '8px' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete('list', l.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Versiones de Listas */}
      {activeTab === 'versions' && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
                <th style={{ padding: '14px 18px' }}>ID</th>
                <th style={{ padding: '14px 18px' }}>Lista Perteneciente</th>
                <th style={{ padding: '14px 18px' }}>Nombre Versión</th>
                <th style={{ padding: '14px 18px' }}>Válido Desde</th>
                <th style={{ padding: '14px 18px' }}>Estado</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700' }}>#{v.id}</td>
                  <td style={{ padding: '14px 18px', color: '#38bdf8', fontWeight: '600' }}>{v.price_list_name || `Lista #${v.price_list_id}`}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{v.name}</td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{v.valid_from || '-'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: v.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: v.is_active ? '#34d399' : '#f87171' }}>
                      {v.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenVersionModal(v)} style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', marginRight: '8px' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete('version', v.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Precios de Productos */}
      {activeTab === 'prices' && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#1a2234', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
                <th style={{ padding: '14px 18px' }}>ID</th>
                <th style={{ padding: '14px 18px' }}>Producto</th>
                <th style={{ padding: '14px 18px' }}>Versión de Lista</th>
                <th style={{ padding: '14px 18px' }}>Precio Lista</th>
                <th style={{ padding: '14px 18px' }}>Precio Estándar</th>
                <th style={{ padding: '14px 18px' }}>Precio Límite</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productPrices.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '700' }}>#{p.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{p.product_name || `Producto #${p.product_id}`}</td>
                  <td style={{ padding: '14px 18px', color: '#38bdf8' }}>{p.version_name || `Versión #${p.price_list_version_id}`}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: '#cbd5e1' }}>${Number(p.price_list).toFixed(2)}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '800', color: '#10b981' }}>${Number(p.price_std).toFixed(2)}</td>
                  <td style={{ padding: '14px 18px', color: '#f59e0b' }}>${Number(p.price_limit).toFixed(2)}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenPriceModal(p)} style={{ padding: '6px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', marginRight: '8px' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete('price', p.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Genérico */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: '#1e2433', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
              {modalType === 'list' && (editingItem ? 'Editar Lista de Precios' : 'Nueva Lista de Precios')}
              {modalType === 'version' && (editingItem ? 'Editar Versión de Lista' : 'Nueva Versión de Lista')}
              {modalType === 'price' && (editingItem ? 'Editar Precio de Producto' : 'Asignar Nuevo Precio')}
            </h3>

            <form onSubmit={handleSubmit}>
              {modalType === 'list' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre *</label>
                    <input type="text" value={listForm.name} onChange={(e) => setListForm({ ...listForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Moneda</label>
                    <input type="text" value={listForm.currency} onChange={(e) => setListForm({ ...listForm, currency: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Descripción</label>
                    <textarea rows="2" value={listForm.description} onChange={(e) => setListForm({ ...listForm, description: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}

              {modalType === 'version' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Lista de Precios Base *</label>
                    <select value={versionForm.price_list_id} onChange={(e) => setVersionForm({ ...versionForm, price_list_id: e.target.value })} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}>
                      {priceLists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.currency})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre Versión *</label>
                    <input type="text" value={versionForm.name} onChange={(e) => setVersionForm({ ...versionForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Válido Desde</label>
                    <input type="date" value={versionForm.valid_from} onChange={(e) => setVersionForm({ ...versionForm, valid_from: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}

              {modalType === 'price' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Versión de Lista *</label>
                    <select value={priceForm.price_list_version_id} onChange={(e) => setPriceForm({ ...priceForm, price_list_version_id: e.target.value })} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }}>
                      {versions.map(v => <option key={v.id} value={v.id}>{v.name} ({v.price_list_name})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre o ID Producto *</label>
                    <input type="text" placeholder="ej. Big King Tasty" value={priceForm.product_name} onChange={(e) => setPriceForm({ ...priceForm, product_name: e.target.value })} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>P. Lista</label>
                      <input type="number" step="0.01" value={priceForm.price_list} onChange={(e) => setPriceForm({ ...priceForm, price_list: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>P. Estándar</label>
                      <input type="number" step="0.01" value={priceForm.price_std} onChange={(e) => setPriceForm({ ...priceForm, price_std: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>P. Límite</label>
                      <input type="number" step="0.01" value={priceForm.price_limit} onChange={(e) => setPriceForm({ ...priceForm, price_limit: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: '#334155', border: 'none', borderRadius: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 18px', background: '#ff6b00', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
