/**
 * apps/admin/src/services/idempiereSyncService.js
 * 
 * Servicio de Sincronización de Catálogos Maestros desde iDempiere ERP hacia SQLite local:
 * 1. Categorías de Productos (M_Product_Category)
 * 2. Catálogo de Productos (M_Product)
 * 3. Listas y Precios (M_PriceList, M_PriceList_Version, M_ProductPrice)
 * 4. Categorías de Clientes (C_BP_Group)
 * 5. Clientes / Socios de Negocio (C_BPartner)
 * 6. Catálogo de Impuestos (C_Tax) [Solo lectura]
 */

import { buildApiUrl, getSession, PROXY_MODES } from './authService';

/**
 * Consulta un modelo de iDempiere a través del proxy y devuelve sus registros
 */
async function fetchIdempiereModel(modelName, session, top = 100) {
  const token = session?.token;
  if (!token) {
    throw new Error('No hay una sesión activa de iDempiere para sincronizar.');
  }

  const endpoint = `/api/v1/models/${modelName}?$top=${top}`;
  const url = buildApiUrl(session.baseUrl, endpoint, session.proxyMode || PROXY_MODES.LOCAL);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Error consultando ${modelName} en iDempiere (HTTP ${res.status}): ${errorData.detail || res.statusText}`);
  }

  const data = await res.json();
  return data.records || [];
}

/**
 * Envía los registros obtenidos al backend Express para insertarlos/actualizarlos en SQLite
 */
async function sendToLocalSync(catalogName, records) {
  const res = await fetch(`/api/sync/${catalogName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ records })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Error sincronizando ${catalogName} en SQLite`);
  }
  return data;
}

/**
 * Sincroniza un catálogo individual
 */
export async function syncSingleCatalog(catalogKey, session) {
  const currentSession = session || getSession();
  if (!currentSession) {
    throw new Error('Inicie sesión en iDempiere antes de sincronizar.');
  }

  switch (catalogKey) {
    case 'product_categories': {
      const records = await fetchIdempiereModel('m_product_category', currentSession);
      const result = await sendToLocalSync('product_categories', records);
      return { catalog: 'Categorías de Productos', count: result.data?.count || records.length };
    }

    case 'products': {
      const records = await fetchIdempiereModel('m_product', currentSession);
      const result = await sendToLocalSync('products', records);
      return { catalog: 'Productos', count: result.data?.count || records.length };
    }

    case 'price_lists': {
      const lists = await fetchIdempiereModel('m_pricelist', currentSession);
      await sendToLocalSync('price_lists', lists);

      let versionsCount = 0;
      let pricesCount = 0;
      try {
        const versions = await fetchIdempiereModel('m_pricelist_version', currentSession, 50);
        await sendToLocalSync('price_list_versions', versions);
        versionsCount = versions.length;

        const prices = await fetchIdempiereModel('m_productprice', currentSession, 100);
        await sendToLocalSync('product_prices', prices);
        pricesCount = prices.length;
      } catch (e) {
        console.warn('Sincronización complementaria de versiones/precios:', e);
      }

      return {
        catalog: 'Listas de Precios',
        count: lists.length,
        details: `${lists.length} listas, ${versionsCount} versiones, ${pricesCount} precios`
      };
    }

    case 'customer_categories': {
      const records = await fetchIdempiereModel('c_bp_group', currentSession);
      const result = await sendToLocalSync('customer_categories', records);
      return { catalog: 'Categorías de Clientes', count: result.data?.count || records.length };
    }

    case 'customers': {
      const records = await fetchIdempiereModel('c_bpartner', currentSession);
      const result = await sendToLocalSync('customers', records);
      return { catalog: 'Clientes / Socios de Negocio', count: result.data?.count || records.length };
    }

    case 'taxes': {
      const records = await fetchIdempiereModel('c_tax', currentSession);
      const result = await sendToLocalSync('taxes', records);
      return { catalog: 'Catálogo de Impuestos', count: result.data?.count || records.length, readOnly: true };
    }

    default:
      throw new Error(`Catálogo desconocido: ${catalogKey}`);
  }
}

/**
 * Sincroniza todos los 6 catálogos en secuencia controlada
 */
export async function syncAllCatalogs(session, onProgress) {
  const currentSession = session || getSession();
  if (!currentSession) {
    throw new Error('Debe iniciar sesión en iDempiere para ejecutar la sincronización.');
  }

  const catalogs = [
    { key: 'product_categories', name: 'Categorías de Productos' },
    { key: 'products', name: 'Productos' },
    { key: 'price_lists', name: 'Listas y Precios' },
    { key: 'customer_categories', name: 'Categorías de Clientes' },
    { key: 'customers', name: 'Clientes / Socios de Negocio' },
    { key: 'taxes', name: 'Impuestos (Solo Lectura)' }
  ];

  const results = [];
  for (let i = 0; i < catalogs.length; i++) {
    const item = catalogs[i];
    if (onProgress) onProgress({ current: i + 1, total: catalogs.length, name: item.name });

    try {
      const res = await syncSingleCatalog(item.key, currentSession);
      results.push({ ...res, success: true });
    } catch (err) {
      console.error(`Error sincronizando ${item.name}:`, err);
      results.push({ catalog: item.name, success: false, error: err.message });
    }
  }

  return results;
}

export default {
  syncSingleCatalog,
  syncAllCatalogs
};
