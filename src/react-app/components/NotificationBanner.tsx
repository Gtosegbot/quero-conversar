import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { db } from '../../firebase-config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface AdminNotification {
    id: string;
    page_section: string;
    title: string;
    message: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
}

interface NotificationBannerProps {
    pageSection: 'chat' | 'community' | 'professionals' | 'dashboard' | 'videos';
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ pageSection }) => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        loadNotifications();
    }, [pageSection]);

    const loadNotifications = async () => {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('page_section', '==', pageSection),
                where('is_active', '==', true)
            );

            const snapshot = await getDocs(q);
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AdminNotification));

            // Filter by date range
            const now = new Date();
            const activeNotifs = notifs.filter(notif => {
                if (!notif.start_date && !notif.end_date) return true;

                const startDate = notif.start_date ? new Date(notif.start_date) : null;
                const endDate = notif.end_date ? new Date(notif.end_date) : null;

                if (startDate && now < startDate) return false;
                if (endDate && now > endDate) return false;

                return true;
            });

            setNotifications(activeNotifs);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleDismiss = (id: string) => {
        setDismissedIds([...dismissedIds, id]);
        // Optionally save to localStorage
        const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
        localStorage.setItem('dismissedNotifications', JSON.stringify([...dismissed, id]));
    };

    const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

    if (visibleNotifications.length === 0) return null;

    return (
        <div className="space-y-4 mb-6">
            {visibleNotifications.map(notification => (
                <div
                    key={notification.id}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-600 rounded-lg shadow-md p-4 relative"
                >
                    <button
                        onClick={() => handleDismiss(notification.id)}
                        className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full transition-colors"
                        aria-label="Dispensar"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-start space-x-3 pr-8">
                        <div className="flex-shrink-0 mt-1">
                            <Bell className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{notification.title}</h3>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{notification.message}</p>
                            <div className="mt-2 flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Aviso do Admin
                                </span>
                                {notification.end_date && (
                                    <span className="text-xs text-gray-500">
                                        Válido até {new Date(notification.end_date).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationBanner;
