const express = require('express');
const router = express.Router();
const db = require('../db');
const os = require('os');

// ==========================================
// 1. HEALTH CHECK (Dokploy & Container Monitoring)
// ==========================================
router.get('/health', (req, res) => {
  const dbStatus = db.getDbStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    platform: 'Dokploy CI/CD Live • Production SQLite',
    database: dbStatus
  });
});

// ==========================================
// 2. PRODUCTOS (M_Product)
// ==========================================
router.get('/products', (req, res) => {
  try {
    const products = db.getProducts();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Nombre y precio son requeridos.' });
    }
    const product = db.addProduct(req.body);
    res.status(201).json({ success: true, message: 'Producto creado exitosamente', data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, message: 'Producto actualizado exitosamente', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const ok = db.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, message: `Producto ${req.params.id} eliminado.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. CATEGORÍAS DE PRODUCTOS (M_Product_Category)
// ==========================================
router.get('/product-categories', (req, res) => {
  try {
    const categories = db.getProductCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/product-categories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
    const category = db.addProductCategory(req.body);
    res.status(201).json({ success: true, message: 'Categoría creada exitosamente', data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/product-categories/:id', (req, res) => {
  try {
    const updated = db.updateProductCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, message: 'Categoría actualizada exitosamente', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/product-categories/:id', (req, res) => {
  try {
    const ok = db.deleteProductCategory(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, message: `Categoría ${req.params.id} eliminada.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. LISTAS DE PRECIOS & VERSIONES (M_PriceList, M_PriceList_Version, M_ProductPrice)
// ==========================================
router.get('/price-lists', (req, res) => {
  try {
    const lists = db.getPriceLists();
    res.json({ success: true, count: lists.length, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/price-lists', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Nombre de lista es obligatorio.' });
    const created = db.addPriceList(req.body);
    res.status(201).json({ success: true, message: 'Lista de precios creada', data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/price-lists/:id', (req, res) => {
  try {
    const updated = db.updatePriceList(req.params.id, req.body);
    res.json({ success: true, message: 'Lista de precios actualizada', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/price-lists/:id', (req, res) => {
  try {
    const ok = db.deletePriceList(req.params.id);
    res.json({ success: ok, message: `Lista de precios ${req.params.id} eliminada.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/price-list-versions', (req, res) => {
  try {
    const versions = db.getPriceListVersions(req.query.priceListId ? Number(req.query.priceListId) : null);
    res.json({ success: true, count: versions.length, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/product-prices', (req, res) => {
  try {
    const prices = db.getProductPrices(req.query.versionId ? Number(req.query.versionId) : null);
    res.json({ success: true, count: prices.length, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/product-prices', (req, res) => {
  try {
    const created = db.addProductPrice(req.body);
    res.status(201).json({ success: true, message: 'Precio de producto asignado', data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/product-prices/:id', (req, res) => {
  try {
    const updated = db.updateProductPrice(req.params.id, req.body);
    res.json({ success: true, message: 'Precio actualizado', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/product-prices/:id', (req, res) => {
  try {
    const ok = db.deleteProductPrice(req.params.id);
    res.json({ success: ok, message: `Precio ${req.params.id} eliminado.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. CATEGORÍAS DE CLIENTES (C_BP_Group)
// ==========================================
router.get('/customer-categories', (req, res) => {
  try {
    const categories = db.getCustomerCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/customer-categories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'El nombre del grupo es obligatorio.' });
    const created = db.addCustomerCategory(req.body);
    res.status(201).json({ success: true, message: 'Grupo de clientes creado', data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/customer-categories/:id', (req, res) => {
  try {
    const updated = db.updateCustomerCategory(req.params.id, req.body);
    res.json({ success: true, message: 'Grupo actualizado', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/customer-categories/:id', (req, res) => {
  try {
    const ok = db.deleteCustomerCategory(req.params.id);
    res.json({ success: ok, message: `Grupo ${req.params.id} eliminado.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. CLIENTES (C_BPartner)
// ==========================================
router.get('/customers', (req, res) => {
  try {
    const customers = db.getCustomers();
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers/:id', (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/customers', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Nombre de cliente es obligatorio.' });
    const created = db.addCustomer(req.body);
    res.status(201).json({ success: true, message: 'Cliente registrado exitosamente', data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/customers/:id', (req, res) => {
  try {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    res.json({ success: true, message: 'Cliente actualizado', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/customers/:id', (req, res) => {
  try {
    const ok = db.deleteCustomer(req.params.id);
    res.json({ success: ok, message: `Cliente ${req.params.id} eliminado.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. IMPUESTOS (C_Tax) - SOLO LECTURA
// ==========================================
router.get('/taxes', (req, res) => {
  try {
    const taxes = db.getTaxes();
    res.json({
      success: true,
      readOnly: true,
      count: taxes.length,
      message: 'Catálogo de impuestos (C_Tax) en modo de solo lectura.',
      data: taxes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. SINCRONIZACIÓN BULK DESDE IDEMPIERE ERP
// ==========================================
// Endpoint genérico para guardar lotes de registros obtenidos del ERP
router.post('/sync/:catalog', (req, res) => {
  const catalog = req.params.catalog.replace(/-/g, '_');
  const { records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Se requiere un array en "records".' });
  }

  try {
    const result = db.syncCatalogFromERP(catalog, records);
    res.json({ success: true, message: `Catálogo ${catalog} sincronizado exitosamente.`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sync/logs', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const logs = db.getSyncLogs(limit);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. PROXY LOCAL SERVER-TO-SERVER (IDEMPIERE REST)
// ==========================================
router.all('/idempiere-proxy', async (req, res) => {
  const target = req.query.target;
  if (!target) {
    return res.status(400).json({ error: 'Falta parámetro ?target=' });
  }

  try {
    const forwardHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || 'application/json'
    };
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    }

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const idempiereRes = await fetch(target, fetchOptions);
    const contentType = idempiereRes.headers.get('content-type') || '';

    res.status(idempiereRes.status);
    if (contentType.includes('application/json')) {
      const data = await idempiereRes.json();
      res.json(data);
    } else {
      const text = await idempiereRes.text();
      res.send(text);
    }
  } catch (error) {
    res.status(502).json({
      error: `Error en Proxy Local hacia iDempiere (${target}): ${error.message}`
    });
  }
});

module.exports = router;
