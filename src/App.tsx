import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { DashboardView } from './components/admin/DashboardView';
import { DepositsView } from './components/admin/DepositsView';
import { TransfersView } from './components/admin/TransfersView';
import { PaymentMethodsView } from './components/admin/PaymentMethodsView';
import { UserManagementView } from './components/admin/UserManagementView';
import { SettingsView } from './components/admin/SettingsView';
import { AdminSupport } from './components/admin/AdminSupport';
import { ContentManagementView } from './components/admin/ContentManagementView';
import { FundingAccountsView } from './components/admin/FundingAccountsView';
import { CustomerConfigView } from './components/admin/CustomerConfigView';
import { AdminViewErrorBoundary } from './components/admin/AdminViewErrorBoundary';
import { UsdtSellView } from './components/admin/UsdtSellView';
import { CouponManagementView } from './components/admin/CouponManagementView';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/admin/dashboard');
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path) {
        if (detail.depositId) setSelectedDepositId(detail.depositId);
        if (detail.transferId) setSelectedTransferId(detail.transferId);
        if (detail.userId) setSelectedUserId(detail.userId);
        setCurrentPath(detail.path);
      }
    };
    window.addEventListener('admin-navigate', handleNavigate);
    return () => window.removeEventListener('admin-navigate', handleNavigate);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setCurrentPath('/admin/dashboard')} />;
  }

  const renderCurrentView = () => {
    switch (currentPath) {
      case '/admin/dashboard':
        return (
          <DashboardView
            onNavigate={(p) => setCurrentPath(p)}
            onSelectDeposit={(id) => {
              setSelectedDepositId(id);
              setCurrentPath('/admin/deposits');
            }}
            onSelectTransfer={(id) => {
              setSelectedTransferId(id);
              setCurrentPath('/admin/transfers');
            }}
          />
        );
      case '/admin/deposits':
        return (
          <DepositsView
            selectedDepositId={selectedDepositId}
            onClearSelectedDeposit={() => setSelectedDepositId(null)}
          />
        );
      case '/admin/transfers':
        return (
          <TransfersView
            selectedTransferId={selectedTransferId}
            onClearSelectedTransfer={() => setSelectedTransferId(null)}
          />
        );
      case '/admin/payment-methods':
        return <PaymentMethodsView />;
      case '/admin/users':
        return <UserManagementView selectedUserId={selectedUserId} onClearSelectedUser={() => setSelectedUserId(null)} />;
      case '/admin/support':
        return <AdminSupport />;
      case '/admin/settings':
        return <SettingsView />;
      case '/admin/customer-config':
        return <CustomerConfigView />;
      case '/admin/content':
        return <ContentManagementView />;
      case '/admin/funding-accounts':
        return <FundingAccountsView />;
      case '/admin/usdt-sells':
        return <UsdtSellView />;
      case '/admin/coupons':
        return <CouponManagementView />;
      default:
        return (
          <DashboardView
            onNavigate={(p) => setCurrentPath(p)}
            onSelectDeposit={(id) => {
              setSelectedDepositId(id);
              setCurrentPath('/admin/deposits');
            }}
            onSelectTransfer={(id) => {
              setSelectedTransferId(id);
              setCurrentPath('/admin/transfers');
            }}
          />
        );
    }
  };

  return (
    <AdminLayout
      currentPath={currentPath}
      onNavigate={(path) => {
        setSelectedDepositId(null);
        setSelectedTransferId(null);
        setSelectedUserId(null);
        setCurrentPath(path);
      }}
    >
      <AdminViewErrorBoundary viewName={currentPath}>
        {renderCurrentView()}
      </AdminViewErrorBoundary>
    </AdminLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
