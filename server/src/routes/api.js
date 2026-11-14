const express = require('express');
const router = express.Router();
const db = require('../db');
const dns = require('dns').promises;
const os = require('os');
const net = require('net');

// Health Check Endpoint (For Dokploy Health Checks)
router.get('/health', (req, res) => {
  const dbStatus = db.getDbStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    platform: 'Dokploy CI/CD Live Demo',
    database: dbStatus
  });
});

// List products
router.get('/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new product
router.post('/products', async (req, res) => {
  try {
    const { name, category, price, stock, image, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Nombre y precio son requeridos.' });
    }
    const product = await db.addProduct({ name, category, price, stock, image, description });
    res.status(201).json({ success: true, message: 'Producto creado exitosamente', data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteProduct(id);
    res.json({ success: true, message: `Producto ${id} eliminado.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset initial products
router.post('/reset', async (req, res) => {
  try {
    await db.resetProducts();
    res.json({ success: true, message: 'Datos demo restablecidos.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper for socket testing
function checkTcpPort(host, port = 3306, timeout = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve({ host, port, open: true });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve({ host, port, open: false, reason: 'timeout' });
    });
    socket.once('error', (err) => {
      resolve({ host, port, open: false, reason: err.code || err.message });
    });
    socket.connect(port, host);
  });
}

// Diagnostic network endpoint
router.get('/debug-network', async (req, res) => {
  const hostsToTest = [
    process.env.DB_HOST,
    '172.18.0.1',
    '172.17.0.1',
    '127.0.0.1'
  ].filter(Boolean);

  const dnsResults = {};
  for (const host of hostsToTest) {
    try {
      const lookup = await dns.lookup(host);
      dnsResults[host] = { ok: true, ip: lookup.address };
    } catch (err) {
      dnsResults[host] = { ok: false, error: err.message };
    }
  }

  const candidateTargets = ['172.18.0.1', '172.17.0.1'];
  for (let i = 2; i <= 30; i++) {
    candidateTargets.push(`172.18.0.${i}`);
  }

  const portScans = await Promise.all(candidateTargets.map(ip => checkTcpPort(ip, 3306, 250)));
  const open3306 = portScans.filter(p => p.open);

  res.json({
    hostname: os.hostname(),
    interfaces: os.networkInterfaces(),
    environment: {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      HAS_PASSWORD: !!process.env.DB_PASSWORD,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL
    },
    dns_tests: dnsResults,
    open_mysql_ports_found: open3306,
    db_status: db.getDbStatus()
  });
});

// Local proxy for iDempiere REST API to bypass browser CORS in development/production
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
