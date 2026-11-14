# 🤖 AGENTS.md — Protocolo y Guía Operativa para Agentes de IA en RapidCorporate

> **REGLA MANDATORIA DE ORO**:  
> Cada cambio, refactorización, adición de endpoints, actualización de base de datos o modificación arquitectónica que se realice en este repositorio **DEBE actualizar este archivo (`AGENTS.md`)** y, si impacta el diseño técnico del sistema, el archivo [`ARCHITECTURE.md`](file:///d:/BDeveloper/rapidcorporate/ARCHITECTURE.md).

---

## 📌 1. Visión General del Proyecto

- **Nombre del Proyecto**: `rapidcorporate` (NextCollege Rapid Platform Scaffold)
- **Autor / Propietario**: Pablo Valdivia (Pabloksy)
- **Objetivo**: Monorepo unificado fullstack preparado para desarrollo ágil, demostraciones en vivo (masterclasses/webinars) y despliegue automatizado en **Dokploy** vía Docker multi-stage.
- **Modelo de Entrega**: **Single Port Monolith** (puerto único `3000` por defecto). Un solo proceso Node.js/Express expone la API REST y sirve simultáneamente las tres aplicaciones frontend compiladas.

---

## 🗺️ 2. Mapa de Estructura del Monorepo

```
rapidcorporate/
├── apps/
│   ├── admin/             # Panel Administrativo (React 18 + Vite) -> Servido en /admin
│   ├── ecommerce/         # Portal Web / Tienda (Astro 4)          -> Servido en /
│   └── pwa/               # Aplicación Móvil PWA (React 18 + Vite) -> Servido en /app
├── server/
│   ├── public/            # Destino de compilación (ignorado en git, generado en build)
│   │   ├── admin/
│   │   ├── ecommerce/
│   │   └── pwa/
│   ├── src/
│   │   ├── app.js         # Entrypoint Express, enrutador estático y fallback SPA
│   │   ├── db.js          # Capa de datos dual (MySQL Pool + Mock In-Memory)
│   │   └── routes/
│   │       └── api.js     # Endpoints REST (/api/health, /api/products, etc.)
│   └── package.json       # Dependencias exclusivas del backend (express, cors, mysql2)
├── Dockerfile             # Multi-stage build (4 etapas) optimizado para Dokploy
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
| **API Backend** | Node.js + Express | `/api/*` | Endpoints JSON REST |
| **Proxy ERP Local** | Express | `/api/idempiere-proxy?target=` | Bypass CORS server-to-server para iDempiere REST |
| **Health Check** | Express | `/api/health` | Utilizado por Dokploy / Docker health checks |

---

## ⚙️ 4. Comandos y Ciclos de Trabajo

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

# 4. Iniciar servidor backend
npm run server
# o
npm start
```

---

## 🛡️ 5. Capa de Datos: Patrón Resiliente Dual (MySQL + In-Memory)

El archivo [`server/src/db.js`](file:///d:/BDeveloper/rapidcorporate/server/src/db.js) implementa un patrón de alta disponibilidad para entornos de demostración y desarrollo:

1. **Detección Automática**: Comprueba variables de entorno (`DB_HOST` o `DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
2. **Modo MySQL**: Si la conexión con MySQL es exitosa, inicializa las tablas (`products`) y opera con `mysql2/promise`.
3. **Modo In-Memory (Fallback)**: Si MySQL no está configurado o falla la conexión en red (típico en despliegues tempranos o entornos locales sin base de datos), el sistema conmuta automáticamente a una base de datos en memoria sin interrumpir el servicio ni provocar caídas HTTP 500.

> [!WARNING]
> **Para Agentes IA**: Cualquier nuevo endpoint o mutación de datos que modifique `db.js` **debe mantener la paridad en ambos modos** (tanto en la consulta SQL como en el array / estructura en memoria).

---

## 🌐 6. Estrategia de Conectividad y Bypass CORS con iDempiere ERP

Para interactuar con la API REST de iDempiere desde el navegador sin ser bloqueados por directivas CORS, la plataforma incorpora un mecanismo multi-modo:

1. **Opción 1: Sin Proxy (Conexión Directa)**: Útil cuando el servidor iDempiere expone encabezados CORS permisivos o el cliente corre sin restricciones de origen.
2. **Opción 2: Proxy Local Backend (`/api/idempiere-proxy?target=`) [RECOMENDADO POR DEFECTO]**: El navegador envía la solicitud a nuestro propio backend Node.js Express, y este ejecuta la llamada server-to-server hacia iDempiere. Elimina al 100% los bloqueos CORS del navegador y es completamente inmune a fallos o cambios de políticas en servicios externos.
3. **Opción 3: Proxy Público AllOrigins (`https://api.allorigins.win/raw?url=`)**: Alternativa libre sin API key.
4. **Opción 4: Proxy corsproxy.io**: Anteriormente gratuito anónimo; actualmente requiere suscripción/API key registrada (`keyless_legacy_url` retorna HTTP 403). El sistema aplica fallback automático a Proxy Local cuando detecta este fallo.

---

## 🐳 7. Despliegue en Dokploy / Docker Multi-Stage

El archivo [`Dockerfile`](file:///d:/BDeveloper/rapidcorporate/Dockerfile) ejecuta 4 etapas:
- **Etapa 1 (`builder-ecommerce`)**: Compila Astro hacia `/app/ecommerce/dist`.
- **Etapa 2 (`builder-pwa`)**: Compila PWA hacia `/app/pwa/dist`.
- **Etapa 3 (`builder-admin`)**: Compila React Admin hacia `/app/admin/dist`.
- **Etapa 4 (`runner`)**: Imagen limpia `node:20-alpine`, copia dependencias de producción de `server`, copia las 3 carpetas `dist` hacia `server/public/*` e inicia con `node server/src/app.js` en el puerto `3000`.

---

## 📋 8. Normas de Actuación para Agentes de IA

Cuando trabajes en este repositorio, debes cumplir estrictamente las siguientes reglas:

1. **Actualización Continua de `AGENTS.md`**:
   - Si creas un nuevo endpoint en `/api`, regístralo aquí.
   - Si agregas una variable de entorno, anótala en la sección de configuración.
   - Si agregas un paquete npm en cualquiera de los `package.json`, documenta la razón.
2. **Respeto a las Rutas Base de Vite**:
   - En `apps/admin`, nunca uses enlaces absolutos a la raíz `/` para assets internos; respeta `base: '/admin/'`.
   - En `apps/pwa`, respeta `base: '/app/'`.
3. **Validación tras Compilación**:
   - Si realizas cambios en los frontends y se desea probar el servidor unificado, ejecuta `npm run build:all`.
4. **Preservación de la Compatibilidad con Dokploy**:
   - Mantén el puerto expuesto y la ruta `/api/health` intactos, ya que Dokploy y Docker los usan para verificar la salud del contenedor.
5. **Creación de Documentos de Arquitectura**:
   - Mantén al día [`ARCHITECTURE.md`](file:///d:/BDeveloper/rapidcorporate/ARCHITECTURE.md) cuando se introduzcan decisiones de diseño relevantes.

---

*Última actualización: Noviembre 2026 — Adición de endpoint /api/idempiere-proxy y selector multi-proxy para mitigación de 403 en corsproxy.io.*

