import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminRole, AdminUser } from '../types';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA?: boolean; tempToken?: string; error?: string }>;
  verify2FA: (tempToken: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchRole: (role: AdminRole) => Promise<void>;
  hasPermission: (action: string, resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeAdmin = (value: any): AdminUser => ({
  ...value,
  fullName: value.fullName ?? value.full_name ?? '',
  twoFactorEnabled: value.twoFactorEnabled ?? value.two_factor_enabled ?? false,
  lastLogin: value.lastLogin ?? value.last_login ?? '',
  createdAt: value.createdAt ?? value.created_at ?? '',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('remitbd_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!token) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdmin(normalizeAdmin(data.admin));
        } else {
          setAdmin(null);
          setToken(null);
          localStorage.removeItem('remitbd_admin_token');
        }
      } catch (err) {
        console.error('Failed to load admin profile', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmin();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || data.detail || 'Login failed.' };
      }

      if (data.requires2FA) {
        return { requires2FA: true, tempToken: data.tempToken };
      }

      setToken(data.token);
      setAdmin(normalizeAdmin(data.admin));
      localStorage.setItem('remitbd_admin_token', data.token);
      return {};
    } catch (err) {
      return { error: 'Network connection failed.' };
    }
  };

  const verify2FA = async (tempToken: string, code: string) => {
    try {
      const res = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || data.detail || '2FA verification failed.' };
      }

      setToken(data.token);
      setAdmin(normalizeAdmin(data.admin));
      localStorage.setItem('remitbd_admin_token', data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network connection failed.' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      // Ignore network errors during logout.
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('remitbd_admin_token');
    }
  };

  const logoutAll = async () => {
    try {
      if (token) {
        await fetch('/api/admin/logout-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      // Ignore network errors during logout.
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('remitbd_admin_token');
    }
  };

  const switchRole = async (role: AdminRole) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setAdmin(normalizeAdmin(data.admin));
        localStorage.setItem('remitbd_admin_token', data.token);
      }
    } catch (err) {
      console.error('Role switch failed', err);
    }
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'AUDITOR') return false;
    if (admin.role === 'SUPER_ADMIN') return true;

    if (admin.role === 'FINANCE_ADMIN') {
      if (['DEPOSIT', 'TRANSFER', 'FUNDING_ACCOUNT', 'PAYMENT_METHOD', 'RECONCILIATION', 'FX_RATE'].includes(resource)) {
        return true;
      }
      return false;
    }

    if (admin.role === 'COMPLIANCE_ADMIN') {
      if (['USER_KYC', 'USER_RISK', 'AUDIT_LOG'].includes(resource)) return true;
      if (resource === 'TRANSFER' && action === 'APPROVE_COMPLIANCE') return true;
      return false;
    }

    if (admin.role === 'SUPPORT_ADMIN') {
      return action === 'REQUEST_INFO' || action === 'HOLD';
    }

    if (admin.role === 'FX_ADMIN') {
      return resource === 'FX_RATE';
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!admin,
        isLoading,
        login,
        verify2FA,
        logout,
        logoutAll,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
