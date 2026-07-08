import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Notification } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardContent } from '../components/ui/card';
import { CheckCheck } from 'lucide-react';

const notificationTypeConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'default' | 'danger' }> = {
  LEAVE_REQUEST: { label: 'Congé', variant: 'info' },
  PERMISSION_REQUEST: { label: 'Permission', variant: 'warning' },
  APPROVAL: { label: 'Approbation', variant: 'success' },
  REJECTION: { label: 'Refus', variant: 'danger' },
  SYSTEM: { label: 'Système', variant: 'default' },
};

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

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Consultez vos notifications"
        actions={
          notifications.some((n) => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="size-4" />
              Tout marquer comme lu
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune notification.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`animate-slide-in-up cursor-pointer transition-all duration-150 hover:shadow-md ${
                n.isRead ? '' : 'ring-1 ring-primary/20 bg-primary/[0.02]'
              }`}
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={notificationTypeConfig[n.type]?.variant || 'default'}>
                      {notificationTypeConfig[n.type]?.label || n.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-foreground">{n.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
