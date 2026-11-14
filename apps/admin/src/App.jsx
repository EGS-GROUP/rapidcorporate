import React, { useState, useEffect } from 'react';
import { getSession, logout, isAuthenticated } from './services/authService';
import LoginModal from './components/LoginModal';
import DatabaseStatusView from './components/DatabaseStatusView';
import ProductCategoriesView from './components/ProductCategoriesView';
import ProductsView from './components/ProductsView';
import PriceListsView from './components/PriceListsView';
import CustomerCategoriesView from './components/CustomerCategoriesView';
import CustomersView from './components/CustomersView';
import TaxesView from './components/TaxesView';

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const current = getSession();
    if (current && current.token) {
      setSession(current);
    } else {
      // Si no hay sesión, abrir modal de autenticación para facilitar el acceso
      setIsLoginOpen(true);
    }
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    setIsLoginOpen(true);
    showNotification('info', 'Sesión cerrada exitosamente.');
  };

  const navItems = [
    { id: 'dashboard', label: '📊 Dashboard & SQLite', icon: '📊' },
    { id: 'product_categories', label: '📁 Categorías Prod.', icon: '📁' },
    { id: 'products', label: '🍔 Catálogo Productos', icon: '🍔' },
    { id: 'prices', label: '🏷️ Listas y Precios', icon: '🏷️' },
    { id: 'customer_categories', label: '👥 Categorías Clientes', icon: '👥' },
    { id: 'customers', label: '🏢 Clientes / Partners', icon: '🏢' },
    { id: 'taxes', label: '⚖️ Impuestos (Solo Lectura)', icon: '⚖️' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 99999,
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          fontWeight: '600',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          background: notification.type === 'error' ? '#ef4444' : notification.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{notification.type === 'error' ? '❌' : notification.type === 'warning' ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, #ff7a18 0%, #af002d 100%)',
            borderRadius: '12px',
            fontSize: '1.4rem',
            boxShadow: '0 4px 14px rgba(255, 122, 24, 0.4)'
          }}>
            👑
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Tasty Bites <span style={{ color: '#ff6b00' }}>• Central</span>
              <span style={{ fontSize: '0.68rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                ADMIN v2.0
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              NextCollege Rapid Corporate Scaffold &bull; SQLite Engine
            </div>
          </div>
        </div>

        {/* Center / Session Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {session ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#1a2234',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem'
            }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              <div>
                <strong style={{ color: '#f8fafc' }}>{session.userName}</strong>
                <span style={{ color: '#64748b' }}> &bull; </span>
                <span style={{ color: '#38bdf8' }}>{session.roleName}</span>
                <span style={{ color: '#64748b' }}> &bull; </span>
                <span style={{ color: '#cbd5e1' }}>{session.organizationName}</span>
                <span style={{ color: '#64748b' }}> ({session.mode === '2-step-assisted' ? '2 Pasos' : '1 Paso'})</span>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}>
              ⚠️ Sin sesión en iDempiere ERP
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {session ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 14px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #ff6b00 0%, #e05300 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)'
                }}
              >
                🔐 Iniciar Sesión iDempiere
              </button>
            )}

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🌐 E-commerce
            </a>

            <a
              href="/app"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📱 PWA
            </a>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + View Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          background: '#0d111b',
          borderRight: '1px solid #1f2937',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ padding: '0 10px 12px 10px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Navegación &bull; Módulos
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: currentTab === item.id ? '#1e293b' : 'transparent',
                color: currentTab === item.id ? '#38bdf8' : '#94a3b8',
                fontWeight: currentTab === item.id ? '700' : '500',
                fontSize: '0.88rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* SQLite Status Card in Sidebar */}
          <div style={{ marginTop: 'auto', background: '#131b2c', border: '1px solid #1f2a40', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>SQLite Producción</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
              Capa de persistencia unificada para E-commerce, PWA y Admin.
            </div>
          </div>
        </aside>

        {/* View Content Area */}
        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
          {currentTab === 'dashboard' && (
            <DatabaseStatusView
              session={session}
              onNotify={showNotification}
              onGlobalSyncSuccess={() => showNotification('success', 'Todos los catálogos se han sincronizado con SQLite.')}
            />
          )}

          {currentTab === 'product_categories' && (
            <ProductCategoriesView
              session={session}
              onNotify={showNotification}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              session={session}
              onNotify={showNotification}
            />
          )}

          {currentTab === 'prices' && (
            <PriceListsView
              session={session}
              onNotify={showNotification}
            />
          )}

          {currentTab === 'customer_categories' && (
            <CustomerCategoriesView
              session={session}
              onNotify={showNotification}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              session={session}
              onNotify={showNotification}
            />
          )}

          {currentTab === 'taxes' && (
            <TaxesView
              session={session}
              onNotify={showNotification}
            />
          )}
        </main>
      </div>

      {/* Modal de Autenticación */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          showNotification('success', `Conectado exitosamente con iDempiere (${newSession.organizationName})`);
        }}
      />
    </div>
  );
}
