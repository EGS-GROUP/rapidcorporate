const mysql = require('mysql2/promise');

const INITIAL_PRODUCTS = [
  // --- HAMBURGUESAS MAESTRAS NEXTCOLLEGE RAPID (4) ---
  {
    id: 101,
    name: 'Rey de las hamburguesas a la parrilla',
    category: 'A la Parrilla',
    price: 14.99,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    description: 'Carne 100% Angus flameada a la leña de roble, queso cheddar añejo fundido, cebolla caramelizada al bourbon y panceta crocante.'
  },
  {
    id: 102,
    name: 'Hamburguesa Real',
    category: 'A la Parrilla',
    price: 11.50,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
    description: 'Doble medallón smash con costra caramelizada, queso americano fundido, pepinillos agridulces y aderezo imperial.'
  },
  {
    id: 103,
    name: 'Hamburguesa Royal Crispy',
    category: 'Pollo Crispy',
    price: 12.99,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
    description: 'Pechuga marinada en suero de leche 24h y 11 especias, ensalada coleslaw fresca con manzana y emulsión honey mustard.'
  },
  {
    id: 104,
    name: 'HamburguesaDouble Whopper',
    category: 'Gigantes XXL',
    price: 15.50,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
    description: 'Doble medallón gigante a la parrilla de carbón vivo, lechuga romana, tomate maduro, aros de cebolla morada y salsa tártara.'
  },

  // --- COMPUTADORAS (10) ---
  {
    id: 1,
    name: 'NextCollege Pro Laptop 15"',
    category: 'Computadoras',
    price: 1199.99,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
    description: 'Portátil de alto rendimiento optimizado para desarrollo de software e inteligencia artificial.'
  },
  {
    id: 2,
    name: 'Ultrabook DevMaster M3 14"',
    category: 'Computadoras',
    price: 1449.00,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60',
    description: 'Chasis ultrafino de aluminio, pantalla Retina y 32GB de memoria unificada.'
  },
  {
    id: 3,
    name: 'Estación de Trabajo AI Titan X',
    category: 'Computadoras',
    price: 2399.00,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=60',
    description: 'Torre de cómputo para entrenamiento de modelos LLM locales y renderizado 3D.'
  },
  {
    id: 4,
    name: 'Mini PC Compact Ryzen 9 Pro',
    category: 'Computadoras',
    price: 749.50,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&auto=format&fit=crop&q=60',
    description: 'Potencia de sobremesa en la palma de tu mano, silenciosa y de bajo consumo energético.'
  },
  {
    id: 5,
    name: 'Laptop Gamer & Render RTX 4080',
    category: 'Computadoras',
    price: 1899.00,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60',
    description: 'Pantalla 240Hz QHD, refrigeración líquida y gráfica NVIDIA RTX para cargas pesadas.'
  },
  {
    id: 6,
    name: 'Tablet Pro Studio 12.9" Stylus',
    category: 'Computadoras',
    price: 899.00,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
    description: 'Pantalla OLED con lápiz óptico de baja latencia para diseño y programación táctil.'
  },
  {
    id: 7,
    name: 'All-in-One 4K Display 27" Core i7',
    category: 'Computadoras',
    price: 1299.00,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
    description: 'Elegancia minimalista todo en uno con altavoces frontales y cámara web retráctil.'
  },
  {
    id: 8,
    name: 'Servidor Doméstico HomeLab 32GB',
    category: 'Computadoras',
    price: 620.00,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
    description: 'Diseñado para Docker, contenedores y microservicios personales 24/7.'
  },
  {
    id: 9,
    name: 'Laptop Ligera Go 13" Carbon',
    category: 'Computadoras',
    price: 849.99,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60',
    description: 'Pesa menos de 1 kg con batería para más de 18 horas de trabajo remoto continuo.'
  },
  {
    id: 10,
    name: 'Portátil Dual-Screen Duo Pro',
    category: 'Computadoras',
    price: 1750.00,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop&q=60',
    description: 'Doble pantalla integrada para multitarea extrema y visualización de código en paralelo.'
  },

  // --- AUDIO (10) ---
  {
    id: 11,
    name: 'Auriculares Noise-Cancelling ANC Pro',
    category: 'Audio',
    price: 189.50,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    description: 'Cancelación activa de ruido híbrida para sesiones de programación sin distracciones.'
  },
  {
    id: 12,
    name: 'Micrófono USB Condensador Studio',
    category: 'Audio',
    price: 129.90,
    stock: 32,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60',
    description: 'Cápsula cardioide de 24 bits / 96 kHz ideal para podcasts, streaming y videollamadas.'
  },
  {
    id: 13,
    name: 'Monitores de Audio de Estudio 5" (Par)',
    category: 'Audio',
    price: 299.00,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=60',
    description: 'Respuesta en frecuencia plana para mezcla precisa y masterización de sonido.'
  },
  {
    id: 14,
    name: 'Auriculares In-Ear Hi-Fi IEM Dual Driver',
    category: 'Audio',
    price: 85.00,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=60',
    description: 'Aislamiento pasivo de -26 dB con cable trenzado desmontable chapado en plata.'
  },
  {
    id: 15,
    name: 'Micrófono Dinámico XLR Broadcast',
    category: 'Audio',
    price: 210.00,
    stock: 19,
    image: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?w=500&auto=format&fit=crop&q=60',
    description: 'Filtro antipop integrado y rechazo de ruido electromagnético para voz radial profesional.'
  },
  {
    id: 16,
    name: 'Barra de Sonido Deskbar Subwoofer RGB',
    category: 'Audio',
    price: 145.00,
    stock: 38,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=60',
    description: 'Diseño horizontal compacto para colocar debajo del monitor con iluminación ambiental.'
  },
  {
    id: 17,
    name: 'Auriculares Inalámbricos Open-Ear Sport',
    category: 'Audio',
    price: 115.00,
    stock: 42,
    image: 'https://images.unsplash.com/photo-1590658006821-04f4008d5717?w=500&auto=format&fit=crop&q=60',
    description: 'Conducción ósea para escuchar música sin aislarte de los sonidos del entorno.'
  },
  {
    id: 18,
    name: 'Interfaz de Audio USB 2 Canales 192kHz',
    category: 'Audio',
    price: 169.00,
    stock: 26,
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=60',
    description: 'Preamplificadores transparentes con alimentación Phantom +48V y latencia cero.'
  },
  {
    id: 19,
    name: 'Altavoz Portátil Bluetooth IP67',
    category: 'Audio',
    price: 79.90,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60',
    description: 'Batería de 24 horas, resistente al agua y polvo con sonido estéreo 360 grados.'
  },
  {
    id: 20,
    name: 'Cascos Gaming Espacial 7.1 con Micro',
    category: 'Audio',
    price: 139.00,
    stock: 34,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop&q=60',
    description: 'Audio posicional envolvente con almohadillas viscoelásticas y micrófono retráctil.'
  },

  // --- WEARABLES (10) ---
  {
    id: 21,
    name: 'Smartwatch NextTrack Series X',
    category: 'Wearables',
    price: 249.00,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    description: 'Monitorización de salud, ECG, SpO2 y notificaciones push sincronizadas en tiempo real.'
  },
  {
    id: 22,
    name: 'Pulsera de Actividad FitPulse Band 5',
    category: 'Wearables',
    price: 49.90,
    stock: 65,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60',
    description: 'Pantalla AMOLED a color, registro de 30 deportes y autonomía de hasta 14 días.'
  },
  {
    id: 23,
    name: 'Anillo Inteligente SmartRing Health O2',
    category: 'Wearables',
    price: 199.00,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60',
    description: 'Titanio hipoalergénico que mide sueño profundo, temperatura corporal y recuperación.'
  },
  {
    id: 24,
    name: 'Reloj Deportivo GPS Ultra Trail',
    category: 'Wearables',
    price: 389.00,
    stock: 16,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60',
    description: 'Bisel de zafiro, mapas topográficos sin conexión y carga solar integrada.'
  },
  {
    id: 25,
    name: 'Gafas Inteligentes Audio Bluetooth',
    category: 'Wearables',
    price: 159.00,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60',
    description: 'Lentes polarizadas UV400 con altavoces en las patillas y control táctil para llamadas.'
  },
  {
    id: 26,
    name: 'Banda Monitor Cardíaco Bluetooth/ANT+',
    category: 'Wearables',
    price: 69.00,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1510519138161-58446c623304?w=500&auto=format&fit=crop&q=60',
    description: 'Sensor pectoral de alta precisión para entrenamientos por zonas de frecuencia cardíaca.'
  },
  {
    id: 27,
    name: 'Smartwatch Elegance Cuero & Acero',
    category: 'Wearables',
    price: 279.00,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=60',
    description: 'Estética de reloj clásico suizo con pantalla siempre activa y caja de acero inoxidable.'
  },
  {
    id: 28,
    name: 'Rastreador GPS Mini Tag (Pack 4)',
    category: 'Wearables',
    price: 79.00,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60',
    description: 'Localización global mediante red crowdsourced con altavoz integrado para búsqueda cercana.'
  },
  {
    id: 29,
    name: 'Reloj Inteligente Infantil SOS con Cámara',
    category: 'Wearables',
    price: 89.00,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&auto=format&fit=crop&q=60',
    description: 'Llamadas 4G bidireccionales, geovalla de seguridad y botón de auxilio inmediato.'
  },
  {
    id: 30,
    name: 'Visor Realidad Aumentada Dev Edition',
    category: 'Wearables',
    price: 599.00,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&auto=format&fit=crop&q=60',
    description: 'Proyección de pantallas flotantes virtuales para programar en cualquier lugar.'
  },

  // --- ACCESORIOS (10) ---
  {
    id: 31,
    name: 'Teclado Mecánico RGB Hot-Swap',
    category: 'Accesorios',
    price: 99.90,
    stock: 58,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
    description: 'Switches mecánicos táctiles de respuesta ultrarrápida con retroiluminación personalizable.'
  },
  {
    id: 32,
    name: 'Mouse Ergonómico Vertical Inalámbrico',
    category: 'Accesorios',
    price: 59.90,
    stock: 48,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
    description: 'Postura neutra a 57 grados para prevenir la fatiga y el síndrome del túnel carpiano.'
  },
  {
    id: 33,
    name: 'Monitor Portátil USB-C 15.6" IPS FHD',
    category: 'Accesorios',
    price: 179.00,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1547119957-637f8679db17?w=500&auto=format&fit=crop&q=60',
    description: 'Segunda pantalla ultraligera con un solo cable USB-C de señal y alimentación.'
  },
  {
    id: 34,
    name: 'Docking Station Thunderbolt 4 12-en-1',
    category: 'Accesorios',
    price: 219.00,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=500&auto=format&fit=crop&q=60',
    description: 'Soporta hasta dos pantallas 4K a 60Hz, Gigabit Ethernet y carga Power Delivery de 100W.'
  },
  {
    id: 35,
    name: 'Webcam 4K Pro con IA y Micrófono',
    category: 'Accesorios',
    price: 119.00,
    stock: 36,
    image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=60',
    description: 'Encuadre automático por inteligencia artificial, sensor HDR y obturador de privacidad.'
  },
  {
    id: 36,
    name: 'Desk Pad Cuero Ecológico XL 90x40cm',
    category: 'Accesorios',
    price: 34.50,
    stock: 75,
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&auto=format&fit=crop&q=60',
    description: 'Alfombrilla antideslizante impermeable de tacto suave para teclado y ratón.'
  },
  {
    id: 37,
    name: 'Brazo Articulado para Monitor Doble',
    category: 'Accesorios',
    price: 79.00,
    stock: 42,
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=500&auto=format&fit=crop&q=60',
    description: 'Pistón de gas con soporte VESA 75/100 para monitores de hasta 32 pulgadas.'
  },
  {
    id: 38,
    name: 'Lámpara de Monitor ScreenBar LED',
    category: 'Accesorios',
    price: 49.00,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
    description: 'Iluminación asimétrica antideslumbrante con temperatura de color regulable.'
  },
  {
    id: 39,
    name: 'Soporte Elevador de Aluminio Laptop',
    category: 'Accesorios',
    price: 39.90,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
    description: 'Disipación pasiva de calor con base giratoria 360 grados y altura ajustable.'
  },
  {
    id: 40,
    name: 'Cargador GaN 100W 4 Puertos USB-C/A',
    category: 'Accesorios',
    price: 55.00,
    stock: 68,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60',
    description: 'Tecnología Nitruro de Galio compacta para cargar laptop, tablet y smartphone a la vez.'
  }
];

let inMemoryProducts = [...INITIAL_PRODUCTS];
let pool = null;
let isConnectedToMySQL = false;
let lastDbError = null;

async function initDB() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'demo';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  if (!databaseUrl && !host) {
    lastDbError = 'Variables DB_HOST ni DATABASE_URL configuradas en el entorno.';
    console.log(`ℹ️ [DB] ${lastDbError} Operando en modo In-Memory para demostración.`);
    return;
  }

  try {
    if (databaseUrl) {
      console.log(`🔄 [DB] Intentando conectar a MySQL vía DATABASE_URL...`);
      pool = mysql.createPool(databaseUrl);
    } else {
      console.log(`🔄 [DB] Intentando conectar a MySQL en ${host}:${port} con usuario "${user}" a la BD "${database}"...`);
      pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 8000
      });
    }

    // Probar conexión inmediata
    const connection = await pool.getConnection();
    console.log(`✅ [DB] Conectado exitosamente a MySQL (${host || 'URL'} - BD: ${database})`);

    // Crear tabla si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        image VARCHAR(500),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sembrar datos iniciales si la tabla está vacía
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      console.log('🌱 [DB] Inicializando datos demo en la tabla products de MySQL (40 productos)...');
      for (const p of INITIAL_PRODUCTS) {
        await connection.query(
          'INSERT INTO products (name, category, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)',
          [p.name, p.category, p.price, p.stock, p.image, p.description]
        );
      }
    }

    connection.release();
    isConnectedToMySQL = true;
    lastDbError = null;
  } catch (error) {
    console.warn(`⚠️ [DB] Conexión directa falló: ${error.message}. Escaneando red interna...`);
    try {
      const candidates = [];
      for (let i = 2; i <= 30; i++) candidates.push(`172.18.0.${i}`);
      for (let i = 1; i <= 254; i++) candidates.push(`10.0.1.${i}`);
      candidates.push('172.18.0.1', '172.17.0.1');

      const net = require('net');
      const check = (ip) => new Promise((resolve) => {
        const s = new net.Socket();
        s.setTimeout(250);
        s.once('connect', () => { s.destroy(); resolve(ip); });
        s.once('timeout', () => { s.destroy(); resolve(null); });
        s.once('error', () => { resolve(null); });
        s.connect(3306, ip);
      });

      const found = (await Promise.all(candidates.map(check))).filter(Boolean);
      if (found.length > 0) {
        const discoveredIp = found[0];
        console.log(`🎯 [DB Discovery] ¡MySQL encontrado automáticamente en IP ${discoveredIp}! Conectando...`);
        pool = mysql.createPool({
          host: discoveredIp,
          user,
          password,
          database,
          port: 3306,
          waitForConnections: true,
          connectionLimit: 10,
          connectTimeout: 5000
        });
        const conn = await pool.getConnection();
        console.log(`✅ [DB] Conectado exitosamente a MySQL en ${discoveredIp}`);
        await conn.query(`
          CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            image VARCHAR(500),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        conn.release();
        isConnectedToMySQL = true;
        lastDbError = null;
        return;
      }
    } catch (discoveryErr) {
      console.warn('Error en escaneo de red:', discoveryErr.message);
    }

    lastDbError = error.message;
    console.warn(`⚠️ [DB] No se pudo conectar a MySQL: ${error.message}. Operando en modo In-Memory.`);
    isConnectedToMySQL = false;
  }
}

async function getProducts() {
  if (!isConnectedToMySQL && (process.env.DB_HOST || process.env.DATABASE_URL)) {
    await initDB();
  }

  if (isConnectedToMySQL && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
      return rows;
    } catch (err) {
      console.error('Error consultando MySQL, recurriendo a memoria temporal:', err.message);
      lastDbError = err.message;
    }
  }
  return inMemoryProducts;
}

async function addProduct({ name, category, price, stock, image, description }) {
  if (!isConnectedToMySQL && (process.env.DB_HOST || process.env.DATABASE_URL)) {
    await initDB();
  }

  if (isConnectedToMySQL && pool) {
    const [result] = await pool.query(
      'INSERT INTO products (name, category, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, parseFloat(price) || 0, parseInt(stock, 10) || 0, image || '', description || '']
    );
    return { id: result.insertId, name, category, price: parseFloat(price) || 0, stock: parseInt(stock, 10) || 0, image, description };
  }

  const newProduct = {
    id: Date.now(),
    name,
    category: category || 'General',
    price: parseFloat(price) || 0,
    stock: parseInt(stock, 10) || 0,
    image: image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60',
    description: description || 'Producto agregado durante la demo en vivo.'
  };
  inMemoryProducts.unshift(newProduct);
  return newProduct;
}

async function deleteProduct(id) {
  const numId = parseInt(id, 10);
  if (isConnectedToMySQL && pool) {
    await pool.query('DELETE FROM products WHERE id = ?', [numId]);
    return true;
  }
  inMemoryProducts = inMemoryProducts.filter(p => p.id !== numId);
  return true;
}

async function resetProducts() {
  if (isConnectedToMySQL && pool) {
    await pool.query('TRUNCATE TABLE products');
    for (const p of INITIAL_PRODUCTS) {
      await pool.query(
        'INSERT INTO products (name, category, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)',
        [p.name, p.category, p.price, p.stock, p.image, p.description]
      );
    }
    return;
  }
  inMemoryProducts = [...INITIAL_PRODUCTS];
}

function getDbStatus() {
  return {
    mode: isConnectedToMySQL ? 'mysql' : 'in-memory',
    connected: isConnectedToMySQL,
    host: process.env.DB_HOST || (process.env.DATABASE_URL ? 'via-database-url' : 'no-configurado'),
    database: process.env.DB_NAME || 'demo',
    user: process.env.DB_USER || 'pablovaldivia',
    error: lastDbError
  };
}

module.exports = {
  initDB,
  getProducts,
  addProduct,
  deleteProduct,
  resetProducts,
  getDbStatus
};
