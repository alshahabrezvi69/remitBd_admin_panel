import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);

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
        setNotifications(Array.isArray(data) ? data : []);
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
    const interval = window.setInterval(() => void refreshNotifications(), 30000);
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

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, activeToast, dismissToast, markAsRead, markAllAsRead, refreshNotifications }}
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
