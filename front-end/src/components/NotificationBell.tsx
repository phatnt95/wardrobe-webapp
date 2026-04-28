import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";


import { notificationsControllerGetNotifications, notificationsControllerMarkAsRead  } from "../api/endpoints/notifications/notifications";

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [bounce, setBounce] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchNotifications = async () => {
        try {
            const data = await notificationsControllerGetNotifications();
            setNotifications(data as any[]);
            setUnreadCount((data as any[]).filter((n) => !n.isRead).length);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token) fetchNotifications();
    }, [token]);

    useEffect(() => {
        // Here we simulate WebSocket event listener logic for real-time
        import('socket.io-client').then(({ io }) => {
            const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
                extraHeaders: { Authorization: `Bearer ${token}` }
            });

            socket.on("itemCompleted", () => {
                fetchNotifications();
                setBounce(true);
                setTimeout(() => setBounce(false), 2000);
            });
            
            socket.on("itemFailed", () => {
                fetchNotifications();
                setBounce(true);
                setTimeout(() => setBounce(false), 2000);
            });

            return () => {
                socket.disconnect();
            };
        });
    }, [token]);

    const handleRead = async (id: string, link: string) => {
        setIsOpen(false);
        try {
            await notificationsControllerMarkAsRead(id, { isRead: true });
            fetchNotifications();
            if (link) navigate(link);
        } catch (e) { }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${bounce ? 'animate-bounce' : ''}`}
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Notifications</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleRead(n._id, n.linkTarget)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50/30' : ''}`}
                                >
                                    <h4 className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
