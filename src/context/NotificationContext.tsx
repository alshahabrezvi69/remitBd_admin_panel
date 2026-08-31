import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SystemNotification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  activeToast: SystemNotification | null;
  dismissToast: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  handleNotificationClick: (notification: SystemNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);
  const [lastCount, setLastCount] = useState(0);

  const refreshNotifications = async () => {
    if (!token || !isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newNotifications = Array.isArray(data) ? data : [];
        setNotifications((prev) => {
          const prevIds = new Set(prev.map((n) => n.id));
          const newOnes = newNotifications.filter((n: SystemNotification) => !prevIds.has(n.id));
          if (newOnes.length > 0 && prev.length > 0) {
            setActiveToast(newOnes[0]);
          }
          return newNotifications;
        });
        const newUnread = newNotifications.filter((n: SystemNotification) => !n.read).length;
        if (newUnread > lastCount && lastCount > 0) {
          setActiveToast(newNotifications[0]);
        }
        setLastCount(newUnread);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    void refreshNotifications();
    const interval = window.setInterval(() => void refreshNotifications(), 15000);
    return () => window.clearInterval(interval);
  }, [token, isAuthenticated]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const dismissToast = () => setActiveToast(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = useCallback((notification: SystemNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.referenceType === 'DEPOSIT' && notification.referenceId) {
      window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { path: '/admin/deposits', depositId: notification.referenceId } }));
    } else if (notification.referenceType === 'TRANSFER' && notification.referenceId) {
      window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { path: '/admin/transfers', transferId: notification.referenceId } }));
    } else if (notification.referenceType === 'USER' && notification.userId) {
      window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { path: '/admin/users', userId: notification.userId } }));
    } else if (notification.type.includes('ACCOUNT') || notification.type.includes('KYC') || notification.type.includes('NEW_ACCOUNT')) {
      window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { path: '/admin/users' } }));
    } else if (notification.referenceType === 'USDT_SELL') {
      window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { path: '/admin/usdt-sells' } }));
    }
    setActiveToast(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, activeToast, dismissToast, markAsRead, markAllAsRead, refreshNotifications, handleNotificationClick }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
