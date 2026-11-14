# 🤖 AGENTS.md — Protocolo y Guía Operativa para Agentes de IA en RapidCorporate

> **REGLA MANDATORIA DE ORO**:  
> Cada cambio, refactorización, adición de endpoints, actualización de base de datos o modificación arquitectónica que se realice en este repositorio **DEBE actualizar este archivo (`AGENTS.md`)** y, si impacta el diseño técnico del sistema, el archivo [`ARCHITECTURE.md`](file:///d:/BDeveloper/rapidcorporate/ARCHITECTURE.md).

---

## 📌 1. Visión General del Proyecto

- **Nombre del Proyecto**: `rapidcorporate` (NextCollege Rapid Platform Scaffold)
- **Autor / Propietario**: Pablo Valdivia (Pabloksy)
- **Objetivo**: Monorepo unificado fullstack preparado para desarrollo ágil, demostraciones en vivo (masterclasses/webinars) y despliegue automatizado en **Dokploy** vía Docker multi-stage.
- **Modelo de Entrega**: **Single Port Monolith** (puerto único `3000` por defecto). Un solo proceso Node.js/Express expone la API REST, sincroniza con ERP iDempiere y sirve simultáneamente las tres aplicaciones frontend compiladas.

---

## 🗺️ 2. Mapa de Estructura del Monorepo

```
rapidcorporate/
├── apps/
│   ├── admin/             # Panel Administrativo (React 18 + Vite) -> Servido en /admin
│   │   └── src/
│   │       ├── components/# Vistas de gestión: Productos, Categorías, Precios, Clientes, Impuestos, etc.
│   │       └── services/  # authService.js (1 y 2 pasos) e idempiereSyncService.js
│   ├── ecommerce/         # Portal Web / Tienda (Astro 4)          -> Servido en /
│   └── pwa/               # Aplicación Móvil PWA (React 18 + Vite) -> Servido en /app
├── server/
│   ├── data/
│   │   └── database.sqlite# Base de datos SQLite de producción (modo WAL)
│   ├── public/            # Destino de compilación (generado con npm run build:all)
│   │   ├── admin/
│   │   ├── ecommerce/
│   │   └── pwa/
│   ├── src/
│   │   ├── app.js         # Entrypoint Express, enrutador estático y fallback SPA
│   │   ├── db.js          # Capa de datos SQLite (better-sqlite3) con tablas y CRUD
│   │   └── routes/
│   │       └── api.js     # Endpoints REST (/api/health, catálogos, /api/sync/*, /api/idempiere-proxy)
│   └── package.json       # Dependencias exclusivas backend (express, cors, better-sqlite3)
├── Dockerfile             # Multi-stage build (4 etapas) con dependencias nativas para Dokploy
├── package.json           # Scripts de orquestación raíz del monorepo
├── AGENTS.md              # [ESTE ARCHIVO] Protocolo operativo para Agentes IA
├── ARCHITECTURE.md        # Documento detallado de diseño y arquitectura de software
└── README.md              # Documentación general del repositorio
```

---

## 🎯 3. Catálogo de Aplicaciones y Rutas

| Capa / Aplicación | Tecnología | Base URL / Ruta en Express | Configuración Base Requerida |
| :--- | :--- | :--- | :--- |
| **E-commerce** | Astro 4 (Static SSG) | `/` (raíz) | `astro.config.mjs` (`format: 'directory'`) |
| **PWA Mobile** | React 18 + Vite | `/app` | `base: '/app/'` en `vite.config.js` |
| **Panel Admin** | React 18 + Vite | `/admin` | `base: '/admin/'` en `vite.config.js` |
| **API Backend** | Node.js + Express | `/api/*` | Endpoints JSON REST (CRUD de 6 catálogos) |
| **Proxy ERP Local** | Express | `/api/idempiere-proxy?target=` | Bypass CORS server-to-server para iDempiere REST |
| **Sincronización ERP** | Express | `/api/sync/:catalog` | Bulk Upsert de registros traídos de iDempiere |
| **Auditoría de Sync** | Express | `/api/sync/logs` | Trazabilidad histórica de sincronizaciones |
| **Health Check** | Express | `/api/health` | Utilizado por Dokploy / Docker health checks |

---

## 💾 4. Capa de Datos: SQLite de Producción (`better-sqlite3`)

Se ha descartado completamente el uso de MySQL. La plataforma utiliza **SQLite** para todos los entornos:

1. **Configuración de Alto Rendimiento**: Opera con `WAL` (Write-Ahead Logging) y `synchronous = NORMAL` para soportar alta concurrencia de lecturas y escrituras sin bloqueo de base de datos.
2. **Relaciones e Integridad Referencial**: Activa `PRAGMA foreign_keys = ON;`.
3. **Catálogos Implementados**:
   - `product_categories` (con mantenimiento en app)
   - `products` (con mantenimiento en app)
   - `price_lists`, `price_list_versions`, `product_prices` (con mantenimiento en app)
   - `customer_categories` (con mantenimiento en app)
   - `customers` (con mantenimiento en app)
   - `taxes` (🔒 **Estrictamente Solo Lectura**, sincronizado desde `C_Tax` de iDempiere)
   - `sync_logs` (tabla de auditoría y trazabilidad)

---

## 🔐 5. Autenticación con iDempiere ERP (1 y 2 Pasos)

El servicio `apps/admin/src/services/authService.js` soporta:

1. **Login Asistido en 2 Pasos (Oficial iDempiere)**:
   - **Paso 1**: `POST /api/v1/auth/tokens` con `{ userName, password }`. Retorna `token` temporal y array de `clients`.
   - **Cascada**: Consulta `GET /roles?client=X`, `GET /organizations?client=X&role=Y` y `GET /warehouses?client=X&role=Y&organization=Z`.
   - **Paso 2**: `PUT /api/v1/auth/tokens` con cuerpo plano `{ clientId, roleId, organizationId, warehouseId, language }` y cabecera `Authorization: Bearer <tempToken>`. Retorna el token JWT operativo final.
2. **Login Directo en 1 Paso**:
   - `POST /api/v1/auth/tokens` con `{ userName, password, parameters: { clientId, roleId, organizationId, warehouseId, language } }`.

---

## 🌐 6. Conectividad y Bypass de CORS

- **Proxy Local (`/api/idempiere-proxy?target=`) [POR DEFECTO]**: Envía peticiones server-to-server desde Express a iDempiere, inmune a directivas CORS del navegador y a bloqueos por falta de API keys de terceros (mitigación definitiva al error 403 `keyless_legacy_url` de corsproxy.io).
- Opciones adicionales disponibles en el modal: Conexión directa y AllOrigins.

---

## ⚙️ 7. Comandos y Ciclos de Trabajo

Todos los comandos raíz deben ejecutarse desde la raíz del proyecto (`d:/BDeveloper/rapidcorporate`):

```bash
# 1. Instalación de todas las dependencias (apps + server)
npm run install:all

# 2. Compilación individual por frontend
npm run build:ecommerce
npm run build:pwa
npm run build:admin

# 3. Compilación unificada y sincronización en server/public
npm run build:all

# 4. Iniciar servidor backend unificado
npm start
# o
npm run server
```

---

## 📋 8. Normas de Actuación para Agentes de IA

1. **Regla de Oro de Documentación**: Siempre actualizar `AGENTS.md` y `ARCHITECTURE.md` al realizar cambios estructurales o añadir endpoints/modelos.
2. **Respeto a Catálogo de Impuestos**: La tabla `taxes` (`C_Tax`) debe mantenerse como **Solo Lectura** en todas las vistas de usuario; no añadir funciones de mutación manual.
3. **Respeto a las Rutas Base de Vite**: `apps/admin` debe compilar con `base: '/admin/'`, y `apps/pwa` con `base: '/app/'`.
4. **Validación de Compilación**: Antes de dar por finalizada una tarea, verificar con `npm run build:all`.
5. **Verificación Operativa Local Continua**: En cada interacción o respuesta al usuario, el agente debe verificar que la aplicación esté desplegada y respondiendo en `http://localhost:3000` (incluyendo `/api/health`, `/admin`, `/app` y `/`). Si el proceso no está corriendo, levantarlo en segundo plano como daemon con `npm start`.

---

*Última actualización: Noviembre 2026 — Migración total a SQLite (better-sqlite3), implementación de autenticación en 2 pasos oficial con iDempiere ERP, sincronización de 6 catálogos maestros y vistas CRUD completas en Admin Panel.*
