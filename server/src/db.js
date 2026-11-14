const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = '';

// Directorio y ruta persistente para SQLite en producción
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DB_FILE = process.env.SQLITE_FILE || 'database.sqlite';

function ensureDbDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDatabase() {
  if (!db) {
    initDB();
  }
  return db;
}

function initDB() {
  if (db) return db;

  ensureDbDirectory();
  dbPath = path.join(DATA_DIR, DB_FILE);

  try {
    db = new Database(dbPath);
    // Configuración de alto rendimiento para producción
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    console.log(`[DB] Conectado exitosamente a SQLite en: ${dbPath}`);
    createTables();
    seedInitialDataIfEmpty();
    return db;
  } catch (error) {
    console.error(`[DB ERROR] Error inicializando SQLite en ${dbPath}:`, error.message);
    throw error;
  }
}

function createTables() {
  // 1. Categorías de Productos (M_Product_Category)
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY,
      value TEXT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 2. Catálogo de Productos (M_Product)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      value TEXT,
      name TEXT NOT NULL,
      category_id INTEGER,
      category_name TEXT,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 50,
      image TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
    );
  `);

  // 3. Listas de Precios (M_PriceList)
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_lists (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      currency TEXT DEFAULT 'USD',
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 4. Versiones de Listas de Precios (M_PriceList_Version)
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_list_versions (
      id INTEGER PRIMARY KEY,
      price_list_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      valid_from TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE
    );
  `);

  // 5. Precios de Productos (M_ProductPrice)
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY,
      price_list_version_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT,
      price_list REAL DEFAULT 0,
      price_std REAL DEFAULT 0,
      price_limit REAL DEFAULT 0,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (price_list_version_id) REFERENCES price_list_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // 6. Categorías de Clientes / Grupos de Socios de Negocio (C_BP_Group)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_categories (
      id INTEGER PRIMARY KEY,
      value TEXT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 7. Clientes / Socios de Negocio (C_BPartner)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      value TEXT,
      name TEXT NOT NULL,
      tax_id TEXT,
      group_id INTEGER,
      group_name TEXT,
      email TEXT,
      phone TEXT,
      is_customer INTEGER DEFAULT 1,
      is_vendor INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES customer_categories(id) ON DELETE SET NULL
    );
  `);

  // 8. Catálogo de Impuestos (C_Tax) - Solo Lectura
  db.exec(`
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      rate REAL DEFAULT 0,
      tax_indicator TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 9. Historial / Auditoría de Sincronización ERP
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catalog TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'SUCCESS',
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('[DB] Tablas SQLite inicializadas correctamente.');
}

function seedInitialDataIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (count > 0) return;

  console.log('[DB] Base de datos vacía. Sembrando datos iniciales...');

  // Sembrar Categorías de Productos
  const insertCat = db.prepare(`
    INSERT INTO product_categories (id, value, name, description, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);
  insertCat.run(109, 'Chemicals', 'Chemicals & Supplies', 'Químicos y suministros');
  insertCat.run(111, 'Doc', 'Documentation', 'Manuales y documentación');
  insertCat.run(1001, 'Burgers', 'Hamburguesas de Autor', 'Especialidades culinarias');
  insertCat.run(1002, 'Drinks', 'Bebidas & Refrescos', 'Bebidas frías y calientes');

  // Sembrar Productos Iniciales
  const insertProd = db.prepare(`
    INSERT INTO products (id, value, name, category_id, category_name, price, stock, image, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const initialProds = [
    {
      id: 101,
      value: 'BURGER-CHEF',
      name: 'Rey de las Burgers',
      category_id: 1001,
      category_name: 'Hamburguesas de Autor',
      price: 14.99,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
      description: 'Carne 100% Angus flameada a la leña de roble, queso cheddar añejo y cebolla caramelizada.'
    },
    {
      id: 102,
      value: 'BURGER-REAL',
      name: 'Hamburguesa Real Clásica',
      category_id: 1001,
      category_name: 'Hamburguesas de Autor',
      price: 11.50,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
      description: 'Doble medallón smash con costra caramelizada, queso americano y aderezo imperial.'
    },
    {
      id: 103,
      value: 'BURGER-CRISPY',
      name: 'Hamburguesa Royal Crispy',
      category_id: 1001,
      category_name: 'Hamburguesas de Autor',
      price: 12.99,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
      description: 'Pechuga marinada en suero de leche 24h, coleslaw fresco y emulsión honey mustard.'
    },
    {
      id: 136,
      value: 'Fertilizer#50',
      name: 'Fertilizer #50 (iDempiere Seed)',
      category_id: 109,
      category_name: 'Chemicals & Supplies',
      price: 24.50,
      stock: 80,
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80',
      description: '50 # Bag of Lawn Fertilizer sincronizado desde GardenWorld.'
    }
  ];

  for (const p of initialProds) {
    insertProd.run(p.id, p.value, p.name, p.category_id, p.category_name, p.price, p.stock, p.image, p.description);
  }

  // Sembrar Listas de Precios y Versiones
  db.prepare(`
    INSERT INTO price_lists (id, name, description, currency, is_active)
    VALUES (101, 'Standard Sales', 'Lista de precios de venta estándar', 'USD', 1)
  `).run();

  db.prepare(`
    INSERT INTO price_list_versions (id, price_list_id, name, valid_from, is_active)
    VALUES (101, 101, 'Standard 2026', '2026-01-01', 1)
  `).run();

  // Sembrar Precios de Productos
  const insertPrice = db.prepare(`
    INSERT INTO product_prices (id, price_list_version_id, product_id, product_name, price_list, price_std, price_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPrice.run(1001, 101, 101, 'Rey de las Burgers', 16.00, 14.99, 13.50);
  insertPrice.run(1002, 101, 102, 'Hamburguesa Real Clásica', 13.00, 11.50, 10.00);
  insertPrice.run(1003, 101, 103, 'Hamburguesa Royal Crispy', 14.50, 12.99, 11.50);
  insertPrice.run(1004, 101, 136, 'Fertilizer #50', 28.00, 24.50, 22.00);

  // Sembrar Categorías de Clientes
  db.prepare(`
    INSERT INTO customer_categories (id, value, name, description, is_active)
    VALUES (103, 'Standard', 'Clientes Estándar', 'Clientes minoristas corporativos', 1)
  `).run();
  db.prepare(`
    INSERT INTO customer_categories (id, value, name, description, is_active)
    VALUES (104, 'Vendors', 'Proveedores & Aliados', 'Proveedores de suministros', 1)
  `).run();

  // Sembrar Clientes
  const insertCust = db.prepare(`
    INSERT INTO customers (id, value, name, tax_id, group_id, group_name, email, phone, is_customer, is_vendor, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertCust.run(120, 'SeedFarm', 'Seed Farm Inc.', 'TAX-10293847', 103, 'Clientes Estándar', 'contact@seedfarm.com', '+1-555-0192', 1, 1);
  insertCust.run(121, 'GardenRetail', 'Garden World Retail Store', 'TAX-99887766', 103, 'Clientes Estándar', 'store@gardenworld.com', '+1-555-0144', 1, 0);

  // Sembrar Impuestos
  const insertTax = db.prepare(`
    INSERT INTO taxes (id, name, description, rate, tax_indicator, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  insertTax.run(106, 'GST / General Sales Tax', 'Impuesto General a las Ventas', 18.0, 'GST');
  insertTax.run(107, 'Standard Tax', 'Impuesto Estándar Reducido', 10.0, 'STD');
  insertTax.run(108, 'Exempt', 'Exonerado de Impuestos', 0.0, 'EX');

  db.prepare(`
    INSERT INTO sync_logs (catalog, count, status, message)
    VALUES ('SEED_INIT', 10, 'SUCCESS', 'Sembrado inicial de base de datos SQLite completado.')
  `).run();

  console.log('[DB] Sembrado inicial completado con éxito.');
}

// ==========================================
// 1. PRODUCTOS
// ==========================================
function getProducts() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM products ORDER BY id DESC').all();
}

function getProductById(id) {
  const d = getDatabase();
  return d.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function addProduct(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  const stmt = d.prepare(`
    INSERT INTO products (id, value, name, category_id, category_name, price, stock, image, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.value || `PROD-${id}`,
    data.name,
    data.category_id || null,
    data.category_name || null,
    parseFloat(data.price) || 0,
    parseInt(data.stock, 10) || 0,
    data.image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60',
    data.description || '',
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
  );
  return getProductById(id);
}

function updateProduct(id, data) {
  const d = getDatabase();
  const existing = getProductById(id);
  if (!existing) return null;

  const stmt = d.prepare(`
    UPDATE products SET
      value = ?,
      name = ?,
      category_id = ?,
      category_name = ?,
      price = ?,
      stock = ?,
      image = ?,
      description = ?,
      is_active = ?,
      synced_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.value !== undefined ? data.value : existing.value,
    data.name !== undefined ? data.name : existing.name,
    data.category_id !== undefined ? data.category_id : existing.category_id,
    data.category_name !== undefined ? data.category_name : existing.category_name,
    data.price !== undefined ? parseFloat(data.price) : existing.price,
    data.stock !== undefined ? parseInt(data.stock, 10) : existing.stock,
    data.image !== undefined ? data.image : existing.image,
    data.description !== undefined ? data.description : existing.description,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active,
    id
  );
  return getProductById(id);
}

function deleteProduct(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==========================================
// 2. CATEGORÍAS DE PRODUCTOS
// ==========================================
function getProductCategories() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM product_categories ORDER BY id DESC').all();
}

function getProductCategoryById(id) {
  const d = getDatabase();
  return d.prepare('SELECT * FROM product_categories WHERE id = ?').get(id);
}

function addProductCategory(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  const stmt = d.prepare(`
    INSERT INTO product_categories (id, value, name, description, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.value || `CAT-${id}`,
    data.name,
    data.description || '',
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
  );
  return getProductCategoryById(id);
}

function updateProductCategory(id, data) {
  const d = getDatabase();
  const existing = getProductCategoryById(id);
  if (!existing) return null;

  const stmt = d.prepare(`
    UPDATE product_categories SET
      value = ?,
      name = ?,
      description = ?,
      is_active = ?,
      synced_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.value !== undefined ? data.value : existing.value,
    data.name !== undefined ? data.name : existing.name,
    data.description !== undefined ? data.description : existing.description,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active,
    id
  );
  return getProductCategoryById(id);
}

function deleteProductCategory(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM product_categories WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==========================================
// 3. LISTAS DE PRECIOS Y VERSIONES
// ==========================================
function getPriceLists() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM price_lists ORDER BY id DESC').all();
}

function getPriceListVersions(priceListId = null) {
  const d = getDatabase();
  if (priceListId) {
    return d.prepare('SELECT * FROM price_list_versions WHERE price_list_id = ? ORDER BY id DESC').all(priceListId);
  }
  return d.prepare('SELECT * FROM price_list_versions ORDER BY id DESC').all();
}

function getProductPrices(versionId = null) {
  const d = getDatabase();
  if (versionId) {
    return d.prepare('SELECT * FROM product_prices WHERE price_list_version_id = ? ORDER BY id DESC').all(versionId);
  }
  return d.prepare('SELECT * FROM product_prices ORDER BY id DESC').all();
}

function addPriceList(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  d.prepare(`
    INSERT INTO price_lists (id, name, description, currency, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.name, data.description || '', data.currency || 'USD', data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1);
  return d.prepare('SELECT * FROM price_lists WHERE id = ?').get(id);
}

function updatePriceList(id, data) {
  const d = getDatabase();
  d.prepare(`
    UPDATE price_lists SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      currency = COALESCE(?, currency),
      is_active = COALESCE(?, is_active),
      synced_at = datetime('now')
    WHERE id = ?
  `).run(data.name, data.description, data.currency, data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined, id);
  return d.prepare('SELECT * FROM price_lists WHERE id = ?').get(id);
}

function deletePriceList(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM price_lists WHERE id = ?').run(id);
  return res.changes > 0;
}

function addProductPrice(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  d.prepare(`
    INSERT INTO product_prices (id, price_list_version_id, product_id, product_name, price_list, price_std, price_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.price_list_version_id,
    data.product_id,
    data.product_name || '',
    parseFloat(data.price_list) || 0,
    parseFloat(data.price_std) || 0,
    parseFloat(data.price_limit) || 0
  );
  return d.prepare('SELECT * FROM product_prices WHERE id = ?').get(id);
}

function updateProductPrice(id, data) {
  const d = getDatabase();
  d.prepare(`
    UPDATE product_prices SET
      price_list = COALESCE(?, price_list),
      price_std = COALESCE(?, price_std),
      price_limit = COALESCE(?, price_limit),
      synced_at = datetime('now')
    WHERE id = ?
  `).run(data.price_list, data.price_std, data.price_limit, id);
  return d.prepare('SELECT * FROM product_prices WHERE id = ?').get(id);
}

function deleteProductPrice(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM product_prices WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==========================================
// 4. CATEGORÍAS DE CLIENTES (C_BP_Group)
// ==========================================
function getCustomerCategories() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM customer_categories ORDER BY id DESC').all();
}

function addCustomerCategory(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  d.prepare(`
    INSERT INTO customer_categories (id, value, name, description, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.value || `GRP-${id}`, data.name, data.description || '', data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1);
  return d.prepare('SELECT * FROM customer_categories WHERE id = ?').get(id);
}

function updateCustomerCategory(id, data) {
  const d = getDatabase();
  d.prepare(`
    UPDATE customer_categories SET
      value = COALESCE(?, value),
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      is_active = COALESCE(?, is_active),
      synced_at = datetime('now')
    WHERE id = ?
  `).run(data.value, data.name, data.description, data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined, id);
  return d.prepare('SELECT * FROM customer_categories WHERE id = ?').get(id);
}

function deleteCustomerCategory(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM customer_categories WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==========================================
// 5. CLIENTES (C_BPartner)
// ==========================================
function getCustomers() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM customers ORDER BY id DESC').all();
}

function getCustomerById(id) {
  const d = getDatabase();
  return d.prepare('SELECT * FROM customers WHERE id = ?').get(id);
}

function addCustomer(data) {
  const d = getDatabase();
  const id = data.id || Date.now();
  d.prepare(`
    INSERT INTO customers (id, value, name, tax_id, group_id, group_name, email, phone, is_customer, is_vendor, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.value || `CUST-${id}`,
    data.name,
    data.tax_id || '',
    data.group_id || null,
    data.group_name || '',
    data.email || '',
    data.phone || '',
    data.is_customer !== undefined ? (data.is_customer ? 1 : 0) : 1,
    data.is_vendor !== undefined ? (data.is_vendor ? 1 : 0) : 0,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
  );
  return getCustomerById(id);
}

function updateCustomer(id, data) {
  const d = getDatabase();
  d.prepare(`
    UPDATE customers SET
      value = COALESCE(?, value),
      name = COALESCE(?, name),
      tax_id = COALESCE(?, tax_id),
      group_id = COALESCE(?, group_id),
      group_name = COALESCE(?, group_name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      is_customer = COALESCE(?, is_customer),
      is_vendor = COALESCE(?, is_vendor),
      is_active = COALESCE(?, is_active),
      synced_at = datetime('now')
    WHERE id = ?
  `).run(
    data.value,
    data.name,
    data.tax_id,
    data.group_id,
    data.group_name,
    data.email,
    data.phone,
    data.is_customer !== undefined ? (data.is_customer ? 1 : 0) : undefined,
    data.is_vendor !== undefined ? (data.is_vendor ? 1 : 0) : undefined,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined,
    id
  );
  return getCustomerById(id);
}

function deleteCustomer(id) {
  const d = getDatabase();
  const res = d.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==========================================
// 6. IMPUESTOS (C_Tax) - SOLO LECTURA
// ==========================================
function getTaxes() {
  const d = getDatabase();
  return d.prepare('SELECT * FROM taxes ORDER BY rate ASC').all();
}

// ==========================================
// 7. SINCRONIZACIÓN BULK DESDE IDEMPIERE
// ==========================================
function syncCatalogFromERP(catalogName, records) {
  const d = getDatabase();
  const timestamp = new Date().toISOString();
  let count = 0;

  const tx = d.transaction(() => {
    switch (catalogName) {
      case 'product_categories': {
        const stmt = d.prepare(`
          INSERT INTO product_categories (id, value, name, description, is_active, synced_at)
          VALUES (@id, @value, @name, @description, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            value = excluded.value,
            name = excluded.name,
            description = excluded.description,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            value: r.Value || `CAT-${r.id}`,
            name: r.Name || 'Sin Nombre',
            description: r.Description || '',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'products': {
        const stmt = d.prepare(`
          INSERT INTO products (id, value, name, category_id, category_name, price, stock, image, description, is_active, synced_at)
          VALUES (@id, @value, @name, @category_id, @category_name, @price, @stock, @image, @description, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            value = excluded.value,
            name = excluded.name,
            category_id = excluded.category_id,
            category_name = excluded.category_name,
            description = excluded.description,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            value: r.Value || `PROD-${r.id}`,
            name: r.Name || 'Sin Nombre',
            category_id: r.M_Product_Category_ID?.id || null,
            category_name: r.M_Product_Category_ID?.identifier || 'General',
            price: r.PriceStd || r.PriceList || 0,
            stock: 50,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
            description: r.Description || '',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'price_lists': {
        const stmt = d.prepare(`
          INSERT INTO price_lists (id, name, description, currency, is_active, synced_at)
          VALUES (@id, @name, @description, @currency, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            currency = excluded.currency,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            name: r.Name || 'Lista de Precios',
            description: r.Description || '',
            currency: r.C_Currency_ID?.identifier || 'USD',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'price_list_versions': {
        const stmt = d.prepare(`
          INSERT INTO price_list_versions (id, price_list_id, name, valid_from, is_active, synced_at)
          VALUES (@id, @price_list_id, @name, @valid_from, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            price_list_id = excluded.price_list_id,
            name = excluded.name,
            valid_from = excluded.valid_from,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            price_list_id: r.M_PriceList_ID?.id || 101,
            name: r.Name || 'Versión',
            valid_from: r.ValidFrom || '2026-01-01',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'product_prices': {
        const stmt = d.prepare(`
          INSERT INTO product_prices (id, price_list_version_id, product_id, product_name, price_list, price_std, price_limit, synced_at)
          VALUES (@id, @price_list_version_id, @product_id, @product_name, @price_list, @price_std, @price_limit, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            price_list_version_id = excluded.price_list_version_id,
            product_id = excluded.product_id,
            product_name = excluded.product_name,
            price_list = excluded.price_list,
            price_std = excluded.price_std,
            price_limit = excluded.price_limit,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            price_list_version_id: r.M_PriceList_Version_ID?.id || 101,
            product_id: r.M_Product_ID?.id || 0,
            product_name: r.M_Product_ID?.identifier || 'Producto',
            price_list: parseFloat(r.PriceList) || 0,
            price_std: parseFloat(r.PriceStd) || 0,
            price_limit: parseFloat(r.PriceLimit) || 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'customer_categories': {
        const stmt = d.prepare(`
          INSERT INTO customer_categories (id, value, name, description, is_active, synced_at)
          VALUES (@id, @value, @name, @description, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            value = excluded.value,
            name = excluded.name,
            description = excluded.description,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            value: r.Value || `GRP-${r.id}`,
            name: r.Name || 'Grupo',
            description: r.Description || '',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'customers': {
        const stmt = d.prepare(`
          INSERT INTO customers (id, value, name, tax_id, group_id, group_name, email, phone, is_customer, is_vendor, is_active, synced_at)
          VALUES (@id, @value, @name, @tax_id, @group_id, @group_name, @email, @phone, @is_customer, @is_vendor, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            value = excluded.value,
            name = excluded.name,
            tax_id = excluded.tax_id,
            group_id = excluded.group_id,
            group_name = excluded.group_name,
            is_customer = excluded.is_customer,
            is_vendor = excluded.is_vendor,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            value: r.Value || `BP-${r.id}`,
            name: r.Name || 'Socio de Negocio',
            tax_id: r.TaxID || r.Value || '',
            group_id: r.C_BP_Group_ID?.id || null,
            group_name: r.C_BP_Group_ID?.identifier || 'General',
            email: r.EMail || '',
            phone: r.Phone || '',
            is_customer: r.IsCustomer ? 1 : 0,
            is_vendor: r.IsVendor ? 1 : 0,
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      case 'taxes': {
        const stmt = d.prepare(`
          INSERT INTO taxes (id, name, description, rate, tax_indicator, is_active, synced_at)
          VALUES (@id, @name, @description, @rate, @tax_indicator, @is_active, @synced_at)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            rate = excluded.rate,
            tax_indicator = excluded.tax_indicator,
            is_active = excluded.is_active,
            synced_at = excluded.synced_at
        `);
        for (const r of records) {
          stmt.run({
            id: r.id,
            name: r.Name || 'Impuesto',
            description: r.Description || '',
            rate: parseFloat(r.Rate) || 0,
            tax_indicator: r.TaxIndicator || '',
            is_active: r.IsActive !== false ? 1 : 0,
            synced_at: timestamp
          });
          count++;
        }
        break;
      }

      default:
        throw new Error(`Catálogo no soportado para sincronización: ${catalogName}`);
    }

    d.prepare(`
      INSERT INTO sync_logs (catalog, count, status, message)
      VALUES (?, ?, 'SUCCESS', ?)
    `).run(catalogName, count, `Sincronizados ${count} registros desde iDempiere ERP.`);
  });

  tx();
  return { success: true, catalog: catalogName, count };
}

function getSyncLogs(limit = 20) {
  const d = getDatabase();
  return d.prepare('SELECT * FROM sync_logs ORDER BY id DESC LIMIT ?').all(limit);
}

// ==========================================
// 8. ESTADO DE BASE DE DATOS
// ==========================================
function getDbStatus() {
  const d = getDatabase();
  const prodsCount = d.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const catsCount = d.prepare('SELECT COUNT(*) as count FROM product_categories').get().count;
  const pricesCount = d.prepare('SELECT COUNT(*) as count FROM product_prices').get().count;
  const custsCount = d.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  const taxesCount = d.prepare('SELECT COUNT(*) as count FROM taxes').get().count;

  return {
    mode: 'sqlite',
    connected: true,
    engine: 'better-sqlite3',
    file: dbPath,
    stats: {
      products: prodsCount,
      categories: catsCount,
      prices: pricesCount,
      customers: custsCount,
      taxes: taxesCount
    }
  };
}

module.exports = {
  initDB,
  getDatabase,
  getDbStatus,
  // Productos
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  // Categorías de Productos
  getProductCategories,
  getProductCategoryById,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  // Listas de Precios y Precios
  getPriceLists,
  getPriceListVersions,
  getProductPrices,
  addPriceList,
  updatePriceList,
  deletePriceList,
  addProductPrice,
  updateProductPrice,
  deleteProductPrice,
  // Categorías de Clientes (C_BP_Group)
  getCustomerCategories,
  addCustomerCategory,
  updateCustomerCategory,
  deleteCustomerCategory,
  // Clientes (C_BPartner)
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  // Impuestos (C_Tax)
  getTaxes,
  // Sincronización y Logs
  syncCatalogFromERP,
  getSyncLogs
};
