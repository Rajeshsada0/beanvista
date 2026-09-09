import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { Check, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Event-based helper to trigger global notifications from anywhere in the app:
 * notify.success('Title', 'Supporting message');
 * notify.error('Title', 'Supporting message');
 * notify.warning('Title', 'Supporting message');
 * notify.info('Title', 'Supporting message');
 */
export const notify = {
    show: (type, title, message = '', duration = 4500) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('app-notify', {
                    detail: { id: Date.now() + Math.random(), type, title, message, duration },
                })
            );
        }
    },
    success: (title, message = '', duration = 4500) => notify.show('success', title, message, duration),
    error: (title, message = '', duration = 5500) => notify.show('error', title, message, duration),
    warning: (title, message = '', duration = 5000) => notify.show('warning', title, message, duration),
    info: (title, message = '', duration = 4500) => notify.show('info', title, message, duration),
};

const TYPE_CONFIG = {
    success: {
        badgeBg: 'bg-emerald-600',
        badgeIcon: Check,
        border: 'border-emerald-200/90 dark:border-emerald-800/80',
        bg: 'bg-emerald-50/95 dark:bg-emerald-950/90',
        titleColor: 'text-emerald-950 dark:text-emerald-100',
        messageColor: 'text-emerald-800/90 dark:text-emerald-300',
        closeHover: 'hover:bg-emerald-100 text-emerald-800 dark:hover:bg-emerald-900/60 dark:text-emerald-300',
        role: 'status',
        ariaLive: 'polite',
    },
    error: {
        badgeBg: 'bg-red-600',
        badgeIcon: AlertCircle,
        border: 'border-red-200/90 dark:border-red-800/80',
        bg: 'bg-red-50/95 dark:bg-red-950/90',
        titleColor: 'text-red-950 dark:text-red-100',
        messageColor: 'text-red-800/90 dark:text-red-300',
        closeHover: 'hover:bg-red-100 text-red-800 dark:hover:bg-red-900/60 dark:text-red-300',
        role: 'alert',
        ariaLive: 'assertive',
    },
    warning: {
        badgeBg: 'bg-amber-500',
        badgeIcon: AlertTriangle,
        border: 'border-amber-200/90 dark:border-amber-800/80',
        bg: 'bg-amber-50/95 dark:bg-amber-950/90',
        titleColor: 'text-amber-950 dark:text-amber-100',
        messageColor: 'text-amber-800/90 dark:text-amber-300',
        closeHover: 'hover:bg-amber-100 text-amber-800 dark:hover:bg-amber-900/60 dark:text-amber-300',
        role: 'alert',
        ariaLive: 'polite',
    },
    info: {
        badgeBg: 'bg-brand-600',
        badgeIcon: Info,
        border: 'border-brand-200/90 dark:border-brand-800/80',
        bg: 'bg-brand-50/95 dark:bg-brand-950/90',
        titleColor: 'text-brand-950 dark:text-brand-100',
        messageColor: 'text-brand-800/90 dark:text-brand-300',
        closeHover: 'hover:bg-brand-100 text-brand-800 dark:hover:bg-brand-900/60 dark:text-brand-300',
        role: 'status',
        ariaLive: 'polite',
    },
};

export default function GlobalNotification() {
    const { flash } = usePage().props;
    const [notifications, setNotifications] = useState([]);
    const timersRef = useRef({});

    const removeNotification = useCallback((id) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addNotification = useCallback(
        ({ type = 'info', title, message = '', duration = 4500 }) => {
            if (!title && !message) return;
            const id = Date.now() + Math.random();
            const newNotif = {
                id,
                type: TYPE_CONFIG[type] ? type : 'info',
                title: title || (type.charAt(0).toUpperCase() + type.slice(1)),
                message,
                duration,
                entering: true,
            };

            setNotifications((prev) => [newNotif, ...prev.slice(0, 3)]);

            if (duration > 0) {
                timersRef.current[id] = setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        },
        [removeNotification]
    );

    // Watch for flash props from Inertia
    useEffect(() => {
        if (flash?.success) {
            addNotification({ type: 'success', title: 'Success', message: flash.success });
        }
        if (flash?.error) {
            addNotification({ type: 'error', title: 'Error', message: flash.error });
        }
        if (flash?.warning) {
            addNotification({ type: 'warning', title: 'Warning', message: flash.warning });
        }
        if (flash?.info) {
            addNotification({ type: 'info', title: 'Information', message: flash.info });
        }
    }, [flash, addNotification]);

    // Listen for custom app-notify events
    useEffect(() => {
        const handler = (e) => {
            if (e.detail) {
                addNotification(e.detail);
            }
        };
        window.addEventListener('app-notify', handler);
        return () => window.removeEventListener('app-notify', handler);
    }, [addNotification]);

    // Keyboard support: Escape dismisses topmost notification
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && notifications.length > 0) {
                removeNotification(notifications[0].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [notifications, removeNotification]);

    if (notifications.length === 0) return null;

    return (
        <div
            aria-label="Notifications"
            className="fixed top-4 sm:top-6 inset-x-4 sm:inset-x-auto sm:right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full"
        >
            {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const Icon = config.badgeIcon;

                return (
                    <div
                        key={notif.id}
                        role={config.role}
                        aria-live={config.ariaLive}
                        aria-atomic="true"
                        tabIndex={0}
                        onMouseEnter={() => {
                            if (timersRef.current[notif.id]) {
                                clearTimeout(timersRef.current[notif.id]);
                            }
                        }}
                        onMouseLeave={() => {
                            if (notif.duration > 0) {
                                timersRef.current[notif.id] = setTimeout(() => {
                                    removeNotification(notif.id);
                                }, notif.duration);
                            }
                        }}
                        className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${config.bg} ${config.border} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`}
                    >
                        {/* Leading Icon Badge */}
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-white shadow-sm ${config.badgeBg}`}
                        >
                            <Icon className="w-4 h-4" strokeWidth={2.5} />
                        </div>

                        {/* Title + Supporting Message */}
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className={`text-sm font-semibold leading-tight ${config.titleColor}`}>
                                {notif.title}
                            </h4>
                            {notif.message && (
                                <p className={`mt-1 text-xs leading-relaxed ${config.messageColor}`}>
                                    {notif.message}
                                </p>
                            )}
                        </div>

                        {/* Dismiss Close (×) Button */}
                        <button
                            type="button"
                            onClick={() => removeNotification(notif.id)}
                            aria-label="Close notification"
                            className={`p-1 rounded-lg shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${config.closeHover}`}
                        >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
