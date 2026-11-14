/**
 * apps/admin/src/services/authService.js
 * 
 * Servicio oficial de Autenticación con iDempiere REST API v1.
 * Soporta:
 * 1. Login Directo (1 Paso): POST /api/v1/auth/tokens con credenciales y parameters.
 * 2. Login Asistido (2 Pasos oficial según bxservice.github.io/idempiere-rest-docs):
 *    - Paso 1: POST /api/v1/auth/tokens (userName + password) -> Devuelve tempToken y lista de clients.
 *    - Paso 2: GET /api/v1/auth/roles?client=X con tempToken
 *              GET /api/v1/auth/organizations?client=X&role=Y con tempToken
 *              GET /api/v1/auth/warehouses?client=X&role=Y&organization=Z con tempToken
 *    - Paso 3: PUT /api/v1/auth/tokens con cuerpo plano { clientId, roleId, organizationId, warehouseId, language }
 *              y Authorization: Bearer tempToken -> Devuelve el token final operativo.
 */

const STORAGE_KEY = 'idempiere_session_context';
const CONFIG_KEY = 'idempiere_connection_config';

export const PROXY_MODES = {
  LOCAL: 'local',           // Proxy local backend (/api/idempiere-proxy) [RECOMENDADO]
  NONE: 'none',             // Conexión directa desde el navegador
  ALLORIGINS: 'allorigins', // Proxy público gratuito AllOrigins
  CORSPROXY: 'corsproxy'    // Proxy corsproxy.io (Requiere API Key)
};

export const DEFAULT_CONFIG = {
  baseUrl: 'https://test.idempiere.org:443',
  proxyMode: PROXY_MODES.LOCAL,
  userName: 'admin @ gardenworld.com',
  password: 'GardenAdmin',
  parameters: {
    clientId: 11,
    clientName: 'GardenWorld, Inc.',
    roleId: 102,
    roleName: 'GardenWorld Admin',
    organizationId: 11,
    organizationName: 'HQ - Headquarters',
    warehouseId: 103,
    warehouseName: 'HQ Warehouse',
    language: 'es_PE'
  }
};

/**
 * Normaliza y construye la URL destino aplicando la modalidad de Proxy seleccionada
 */
export function buildApiUrl(baseUrl, endpoint, proxyMode = PROXY_MODES.LOCAL) {
  const cleanBase = (baseUrl || DEFAULT_CONFIG.baseUrl).replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${cleanBase}${cleanEndpoint}`;

  switch (proxyMode) {
    case PROXY_MODES.LOCAL:
      return `/api/idempiere-proxy?target=${encodeURIComponent(targetUrl)}`;
    case PROXY_MODES.ALLORIGINS:
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    case PROXY_MODES.CORSPROXY:
      // Fallback automático al Proxy Local para prevenir error 403 keyless_legacy_url
      console.warn('corsproxy.io requiere API Key; usando Proxy Local backend.');
      return `/api/idempiere-proxy?target=${encodeURIComponent(targetUrl)}`;
    case PROXY_MODES.NONE:
    default:
      return targetUrl;
  }
}

/**
 * ========================================================
 * 1. MODALIDAD: LOGIN DIRECTO (1 PASO)
 * ========================================================
 */
export async function loginDirect({
  baseUrl = DEFAULT_CONFIG.baseUrl,
  userName,
  password,
  parameters = DEFAULT_CONFIG.parameters,
  proxyMode = PROXY_MODES.LOCAL
}) {
  const url = buildApiUrl(baseUrl, '/api/v1/auth/tokens', proxyMode);

  const payload = {
    userName: userName.trim(),
    password: password,
    parameters: {
      clientId: Number(parameters.clientId || 11),
      roleId: Number(parameters.roleId || 102),
      organizationId: Number(parameters.organizationId ?? 11),
      warehouseId: Number(parameters.warehouseId || 103),
      language: parameters.language || 'es_PE'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.title || data.message || `Error en autenticación (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  if (!data.token) {
    throw new Error('iDempiere no devolvió un token de acceso válido.');
  }

  const session = {
    token: data.token,
    refreshToken: data.refresh_token || null,
    userId: data.userId || 101,
    userName: userName.trim(),
    clientId: payload.parameters.clientId,
    clientName: parameters.clientName || `Client #${payload.parameters.clientId}`,
    roleId: payload.parameters.roleId,
    roleName: parameters.roleName || `Role #${payload.parameters.roleId}`,
    organizationId: payload.parameters.organizationId,
    organizationName: parameters.organizationName || `Org #${payload.parameters.organizationId}`,
    warehouseId: payload.parameters.warehouseId,
    warehouseName: parameters.warehouseName || `Almacén #${payload.parameters.warehouseId}`,
    language: data.language || payload.parameters.language,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    proxyMode,
    mode: '1-step-direct',
    loginAt: new Date().toISOString()
  };

  saveSession(session);
  return session;
}

/**
 * ========================================================
 * 2. MODALIDAD: LOGIN ASISTIDO (2 PASOS OFICIAL IDEMPIERE)
 * ========================================================
 */

// Paso 1: Enviar credenciales y obtener tempToken + lista de clientes
export async function loginStep1({
  baseUrl = DEFAULT_CONFIG.baseUrl,
  userName,
  password,
  proxyMode = PROXY_MODES.LOCAL
}) {
  const url = buildApiUrl(baseUrl, '/api/v1/auth/tokens', proxyMode);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      userName: userName.trim(),
      password: password
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.title || data.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Credenciales inválidas en iDempiere: ${errorMsg}`);
  }

  if (!data.token) {
    throw new Error('iDempiere no devolvió el token temporal para el flujo asistido.');
  }

  return {
    tempToken: data.token,
    clients: data.clients || []
  };
}

// Paso 2.1: Consultar Roles disponibles para el Cliente elegido
export async function fetchRoles({ baseUrl = DEFAULT_CONFIG.baseUrl, tempToken, clientId, proxyMode = PROXY_MODES.LOCAL }) {
  const url = buildApiUrl(baseUrl, `/api/v1/auth/roles?client=${clientId}`, proxyMode);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Accept': 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Error consultando roles (HTTP ${response.status})`);
  return data.roles || [];
}

// Paso 2.2: Consultar Organizaciones disponibles para Cliente y Rol
export async function fetchOrganizations({ baseUrl = DEFAULT_CONFIG.baseUrl, tempToken, clientId, roleId, proxyMode = PROXY_MODES.LOCAL }) {
  const url = buildApiUrl(baseUrl, `/api/v1/auth/organizations?client=${clientId}&role=${roleId}`, proxyMode);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Accept': 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Error consultando organizaciones (HTTP ${response.status})`);
  return data.organizations || [];
}

// Paso 2.3: Consultar Almacenes disponibles para Organización
export async function fetchWarehouses({ baseUrl = DEFAULT_CONFIG.baseUrl, tempToken, clientId, roleId, organizationId, proxyMode = PROXY_MODES.LOCAL }) {
  const url = buildApiUrl(baseUrl, `/api/v1/auth/warehouses?client=${clientId}&role=${roleId}&organization=${organizationId}`, proxyMode);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Accept': 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Error consultando almacenes (HTTP ${response.status})`);
  return data.warehouses || [];
}

// Paso 3: Confirmación Final (PUT /api/v1/auth/tokens con objeto plano)
export async function loginStep2Confirm({
  baseUrl = DEFAULT_CONFIG.baseUrl,
  userName,
  tempToken,
  context,
  proxyMode = PROXY_MODES.LOCAL
}) {
  const url = buildApiUrl(baseUrl, '/api/v1/auth/tokens', proxyMode);

  // La documentación oficial exige PUT con objeto plano (sin parameters anidado)
  const flatPayload = {
    clientId: Number(context.clientId),
    roleId: Number(context.roleId),
    organizationId: Number(context.organizationId),
    warehouseId: Number(context.warehouseId),
    language: context.language || 'es_PE'
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${tempToken}`
    },
    body: JSON.stringify(flatPayload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.title || data.message || `Error confirmando contexto en iDempiere (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  const finalToken = data.token || tempToken;
  const session = {
    token: finalToken,
    refreshToken: data.refresh_token || null,
    userId: data.userId || 101,
    userName: userName.trim(),
    clientId: flatPayload.clientId,
    clientName: context.clientName || `Client #${flatPayload.clientId}`,
    roleId: flatPayload.roleId,
    roleName: context.roleName || `Role #${flatPayload.roleId}`,
    organizationId: flatPayload.organizationId,
    organizationName: context.organizationName || `Org #${flatPayload.organizationId}`,
    warehouseId: flatPayload.warehouseId,
    warehouseName: context.warehouseName || `Almacén #${flatPayload.warehouseId}`,
    language: data.language || flatPayload.language,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    proxyMode,
    mode: '2-step-assisted',
    loginAt: new Date().toISOString()
  };

  saveSession(session);
  return session;
}

/**
 * ========================================================
 * GESTIÓN DE SESIÓN Y PERSISTENCIA
 * ========================================================
 */
export function saveSession(session) {
  try {
    const str = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, str);
    sessionStorage.setItem(STORAGE_KEY, str);
  } catch (e) {
    console.error('Error guardando sesión:', e);
  }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const s = getSession();
  return Boolean(s && s.token);
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
}

export default {
  PROXY_MODES,
  DEFAULT_CONFIG,
  buildApiUrl,
  loginDirect,
  loginStep1,
  fetchRoles,
  fetchOrganizations,
  fetchWarehouses,
  loginStep2Confirm,
  saveSession,
  getSession,
  isAuthenticated,
  logout
};
