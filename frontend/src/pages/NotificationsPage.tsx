import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const markAsRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <p className="text-gray-500">Aucune notification.</p>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markAsRead(n.id)}
            className={`p-4 rounded-lg shadow cursor-pointer transition ${
              n.isRead ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-sm">{n.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{n.message}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
