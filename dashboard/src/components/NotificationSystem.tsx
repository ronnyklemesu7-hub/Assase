import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const remove = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <Toast key={n.id} notification={n} onDismiss={() => remove(n.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

const Toast: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-400" size={18} />,
        warning: <AlertCircle className="text-amber-400" size={18} />,
        error: <AlertCircle className="text-red-400" size={18} />,
        info: <Info className="text-blue-400" size={18} />,
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-500/10',
        warning: 'border-amber-500/20 bg-amber-500/10',
        error: 'border-red-500/20 bg-red-500/10',
        info: 'border-blue-500/20 bg-blue-500/10',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[400px] ${colors[notification.type]}`}
        >
            <div className="flex-shrink-0">
                {icons[notification.type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-white leading-tight">{notification.message}</p>
            </div>
            <button 
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
