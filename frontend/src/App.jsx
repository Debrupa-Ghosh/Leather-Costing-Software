import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { SidebarProvider } from './contexts/SidebarContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ProductionPage from './pages/production/ProductionPage';
import AIInsightsPage from './pages/ai/AIInsightsPage';
import ProductsPage from './pages/products/ProductsPage';
import OrdersPage from './pages/orders/OrdersPage';
import CustomersPage from './pages/customers/CustomersPage';
import BOMPage from './pages/bom/BOMPage';
import QualityPage from './pages/quality/QualityPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import WarehousePage from './pages/warehouses/WarehousePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/src/assets/logo.png" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '12px', margin: '0 auto 16px', display: 'block', objectFit: 'cover' }} />
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Leather Pro AI ERP</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/production" element={<ProtectedRoute><ProductionPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/bom" element={<ProtectedRoute><BOMPage /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute><WarehousePage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
      <Route path="/quality" element={<ProtectedRoute><QualityPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <SidebarProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                },
                success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
                error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
              }}
            />
          </SidebarProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
