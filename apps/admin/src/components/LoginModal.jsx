import React, { useState, useEffect } from 'react';
import {
  PROXY_MODES,
  DEFAULT_CONFIG,
  loginDirect,
  loginStep1,
  fetchRoles,
  fetchOrganizations,
  fetchWarehouses,
  loginStep2Confirm
} from '../services/authService';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Configuración de Servidor & Proxy
  const [baseUrl, setBaseUrl] = useState(DEFAULT_CONFIG.baseUrl);
  const [proxyMode, setProxyMode] = useState(PROXY_MODES.LOCAL);
  const [loginMode, setLoginMode] = useState('2-step'); // '1-step' o '2-step'

  // Credenciales básicas
  const [userName, setUserName] = useState('admin @ gardenworld.com');
  const [password, setPassword] = useState('GardenAdmin');

  // Estado del flujo 2 Pasos
  const [currentStep, setCurrentStep] = useState(1);
  const [tempToken, setTempToken] = useState(null);

  // Opciones cargadas desde iDempiere
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Limpiar estado al abrir
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Manejador: Login en 1 Paso
  const handleLoginDirect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await loginDirect({
        baseUrl,
        userName,
        password,
        proxyMode,
        parameters: DEFAULT_CONFIG.parameters
      });
      setSuccessMsg(`¡Autenticado con éxito como ${session.userName}!`);
      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Error en autenticación directa.');
    } finally {
      setLoading(false);
    }
  };

  // Manejador: Paso 1 del flujo 2 Pasos
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { tempToken: token, clients: clientList } = await loginStep1({
        baseUrl,
        userName,
        password,
        proxyMode
      });

      setTempToken(token);
      setClients(clientList);

      if (clientList.length > 0) {
        const firstClientId = clientList[0].id;
        setSelectedClient(firstClientId);

        // Cargar roles inmediatamente para el primer cliente
        const roleList = await fetchRoles({
          baseUrl,
          tempToken: token,
          clientId: firstClientId,
          proxyMode
        });
        setRoles(roleList);

        if (roleList.length > 0) {
          const firstRoleId = roleList[0].id;
          setSelectedRole(firstRoleId);

          // Cargar organizaciones para cliente + rol
          const orgList = await fetchOrganizations({
            baseUrl,
            tempToken: token,
            clientId: firstClientId,
            roleId: firstRoleId,
            proxyMode
          });
          setOrganizations(orgList);

          // Seleccionar organización válida (preferir HQ o la primera con ID != 0)
          const validOrg = orgList.find(o => o.id === 11) || orgList.find(o => o.id !== 0) || orgList[0];
          if (validOrg) {
            setSelectedOrg(validOrg.id);

            // Cargar almacenes
            const whList = await fetchWarehouses({
              baseUrl,
              tempToken: token,
              clientId: firstClientId,
              roleId: firstRoleId,
              organizationId: validOrg.id,
              proxyMode
            });
            setWarehouses(whList);
            if (whList.length > 0) {
              const defaultWh = whList.find(w => w.id === 103) || whList[0];
              setSelectedWarehouse(defaultWh.id);
            }
          }
        }
      }

      setCurrentStep(2);
    } catch (err) {
      setError(err.message || 'Error en Paso 1 de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  // Cambio dinámico de Cliente en Paso 2
  const handleClientChange = async (clientId) => {
    setSelectedClient(clientId);
    setLoading(true);
    setError(null);
    try {
      const roleList = await fetchRoles({ baseUrl, tempToken, clientId, proxyMode });
      setRoles(roleList);
      if (roleList.length > 0) {
        handleRoleChange(roleList[0].id, clientId);
      } else {
        setOrganizations([]);
        setWarehouses([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cambio dinámico de Rol en Paso 2
  const handleRoleChange = async (roleId, clientId = selectedClient) => {
    setSelectedRole(roleId);
    setLoading(true);
    setError(null);
    try {
      const orgList = await fetchOrganizations({ baseUrl, tempToken, clientId, roleId, proxyMode });
      setOrganizations(orgList);
      const validOrg = orgList.find(o => o.id === 11) || orgList.find(o => o.id !== 0) || orgList[0];
      if (validOrg) {
        handleOrgChange(validOrg.id, roleId, clientId);
      } else {
        setWarehouses([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cambio dinámico de Organización en Paso 2
  const handleOrgChange = async (orgId, roleId = selectedRole, clientId = selectedClient) => {
    setSelectedOrg(orgId);
    setLoading(true);
    setError(null);
    try {
      const whList = await fetchWarehouses({ baseUrl, tempToken, clientId, roleId, organizationId: orgId, proxyMode });
      setWarehouses(whList);
      if (whList.length > 0) {
        const defaultWh = whList.find(w => w.id === 103) || whList[0];
        setSelectedWarehouse(defaultWh.id);
      } else {
        setSelectedWarehouse('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejador: Paso 2 Finalización y Confirmación
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clientObj = clients.find(c => String(c.id) === String(selectedClient));
    const roleObj = roles.find(r => String(r.id) === String(selectedRole));
    const orgObj = organizations.find(o => String(o.id) === String(selectedOrg));
    const whObj = warehouses.find(w => String(w.id) === String(selectedWarehouse));

    try {
      const session = await loginStep2Confirm({
        baseUrl,
        userName,
        tempToken,
        context: {
          clientId: selectedClient,
          clientName: clientObj?.name || `Client #${selectedClient}`,
          roleId: selectedRole,
          roleName: roleObj?.name || `Role #${selectedRole}`,
          organizationId: selectedOrg,
          organizationName: orgObj?.name || `Org #${selectedOrg}`,
          warehouseId: selectedWarehouse || 103,
          warehouseName: whObj?.name || `Almacén #${selectedWarehouse}`,
          language: 'es_PE'
        },
        proxyMode
      });

      setSuccessMsg(`¡Sesión de 2 pasos iniciada exitosamente! Conectado a ${session.organizationName}`);
      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Error confirmando credenciales.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#161922',
        border: '1px solid #2d3748',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255, 107, 0, 0.15)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* Header estilo Tasty Bites / Corporate */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2230 0%, #161922 100%)',
          padding: '24px 28px',
          borderBottom: '1px solid #2d3748',
          position: 'relative',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #ff7a18 0%, #af002d 100%)',
            borderRadius: '16px',
            fontSize: '1.8rem',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(255, 122, 24, 0.35)'
          }}>
            👑
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Tasty Bites <span style={{ color: '#ff7a18' }}>• Central</span>
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Acceso seguro al Panel de Control Corporativo • iDempiere ERP
          </p>

          {/* Selector de Modo: 1 Paso vs 2 Pasos */}
          <div style={{
            display: 'flex',
            background: '#0d1117',
            padding: '4px',
            borderRadius: '10px',
            marginTop: '16px',
            border: '1px solid #2d3748'
          }}>
            <button
              type="button"
              onClick={() => { setLoginMode('2-step'); setCurrentStep(1); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: loginMode === '2-step' ? '#ff6b00' : 'transparent',
                color: loginMode === '2-step' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔐 Autenticación 2 Pasos
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('1-step'); setCurrentStep(1); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: loginMode === '1-step' ? '#ff6b00' : 'transparent',
                color: loginMode === '1-step' ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ⚡ Login Directo (1 Paso)
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px 28px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Mensajes de Alerta */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '18px',
              lineHeight: '1.4'
            }}>
              <strong style={{ color: '#ef4444' }}>Error de Acceso:</strong> {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '18px'
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* Configuración de Proxy (Visible para diagnóstico y control) */}
          <div style={{ marginBottom: '18px', background: '#0f121a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              🌐 Modo de Conexión Proxy (Anti-CORS)
            </label>
            <select
              value={proxyMode}
              onChange={(e) => setProxyMode(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1a202c',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#38bdf8',
                fontWeight: '600',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value={PROXY_MODES.LOCAL}>🛡️ Proxy Local Backend (Recomendado por defecto)</option>
              <option value={PROXY_MODES.NONE}>🔗 Conexión Directa (Sin Proxy)</option>
              <option value={PROXY_MODES.ALLORIGINS}>🌍 Proxy Público AllOrigins</option>
              <option value={PROXY_MODES.CORSPROXY}>⚠️ corsproxy.io (Redirige a Local)</option>
            </select>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
              Servidor ERP: <span style={{ color: '#cbd5e1' }}>{baseUrl}</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MODO 1: LOGIN DIRECTO (1 PASO) */}
          {/* ======================================================== */}
          {loginMode === '1-step' && (
            <form onSubmit={handleLoginDirect}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Usuario / Correo Corporativo
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#1e2533',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Contraseña de Acceso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#64748b' : 'linear-gradient(135deg, #ff6b00 0%, #e05300 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 107, 0, 0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {loading ? 'Validando Credenciales...' : 'Acceder al Panel de Control (1 Paso) →'}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODO 2: AUTENTICACIÓN ASISTIDA (2 PASOS OFICIAL) */}
          {/* ======================================================== */}
          {loginMode === '2-step' && currentStep === 1 && (
            <form onSubmit={handleStep1Submit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Usuario / Correo Corporativo
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  placeholder="ej. admin @ gardenworld.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Contraseña de Acceso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#64748b' : 'linear-gradient(135deg, #ff6b00 0%, #e05300 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 107, 0, 0.4)'
                }}
              >
                {loading ? 'Verificando con iDempiere...' : 'Continuar al Paso 2 (Roles & Almacén) →'}
              </button>
            </form>
          )}

          {/* Paso 2: Selección de Contexto (Client, Role, Org, Warehouse) */}
          {loginMode === '2-step' && currentStep === 2 && (
            <form onSubmit={handleStep2Submit}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#38bdf8',
                marginBottom: '16px'
              }}>
                🔒 Credenciales validadas. Seleccione el contexto operativo para generar el token de sesión.
              </div>

              {/* 1. Cliente / Empresa */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  1. Empresa / Cliente (Client)
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem'
                  }}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                  ))}
                </select>
              </div>

              {/* 2. Rol de Acceso */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  2. Rol de Acceso (Role)
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem'
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (ID: {r.id})</option>
                  ))}
                </select>
              </div>

              {/* 3. Organización / Sucursal */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  3. Organización / Sucursal (Org)
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1e2533',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem'
                  }}
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name} (ID: {o.id})</option>
                  ))}
                </select>
              </div>

              {/* 4. Almacén / Depósito */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  4. Almacén / Depósito (Warehouse)
                </label>
                {warehouses.length > 0 ? (
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#1e2533',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (ID: {w.id})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                    ⚠️ Esta organización no posee almacenes directos asignados. Se asignará almacén por defecto (103).
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: loading ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {loading ? 'Confirmando con ERP...' : 'Confirmar y Entrar al Sistema (Paso 2) ✔'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#0d1117',
          padding: '14px 28px',
          borderTop: '1px solid #1f2937',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#64748b'
        }}>
          🔒 Conexión cifrada de extremo a extremo &bull; Panel Corporativo v2.0 (SQLite Edition)
        </div>
      </div>
    </div>
  );
}
