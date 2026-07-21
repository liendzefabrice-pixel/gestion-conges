import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Notification } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardContent } from '../components/ui/card';
import { CheckCheck, ExternalLink } from 'lucide-react';

const notificationTypeConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'default' | 'danger' | 'secondary' | 'outline' }> = {
  LEAVE_CREATED: { label: 'Congé créé', variant: 'info' },
  LEAVE_RH_REVIEWED: { label: 'Congé examiné', variant: 'info' },
  LEAVE_DECIDED: { label: 'Congé décidé', variant: 'success' },
  LEAVE_TRANSMITTED: { label: 'Transmis à la Direction', variant: 'warning' },
  LEAVE_CANCELLED: { label: 'Congé annulé', variant: 'outline' },
  PERMISSION_CREATED: { label: 'Permission créée', variant: 'info' },
  PERMISSION_RH_REVIEWED: { label: 'Permission examinée', variant: 'info' },
  PERMISSION_TRANSMITTED: { label: 'Permission transmise', variant: 'warning' },
  PERMISSION_CANCELLED: { label: 'Permission annulée', variant: 'outline' },
  PERMISSION_DECIDED: { label: 'Permission décidée', variant: 'success' },
  PROPOSAL_SUBMITTED: { label: 'Proposition soumise', variant: 'info' },
  USER_CREATED: { label: 'Utilisateur créé', variant: 'secondary' },
  USER_ACTIVATED: { label: 'Utilisateur activé', variant: 'success' },
  USER_DEACTIVATED: { label: 'Utilisateur désactivé', variant: 'danger' },
  USER_MODIFIED: { label: 'Utilisateur modifié', variant: 'secondary' },
  EMPLOYEE_CREATED: { label: 'Employé créé', variant: 'secondary' },
  EMPLOYEE_MODIFIED: { label: 'Employé modifié', variant: 'secondary' },
  DEPARTMENT_CREATED: { label: 'Département créé', variant: 'secondary' },
  POSITION_CREATED: { label: 'Poste créé', variant: 'secondary' },
  LEAVE_TYPE_CREATED: { label: 'Type de congé créé', variant: 'secondary' },
  HOLIDAY_ADDED: { label: 'Jour férié ajouté', variant: 'secondary' },
  CAMPAIGN_OPENED: { label: 'Campagne ouverte', variant: 'info' },
  CAMPAIGN_CLOSED: { label: 'Campagne clôturée', variant: 'info' },
  PROPOSAL_ACCEPTED: { label: 'Proposition acceptée', variant: 'success' },
  PROPOSAL_REFUSED: { label: 'Proposition refusée', variant: 'danger' },
  PROPOSAL_REPROGRAMMED: { label: 'Proposition reprogrammée', variant: 'warning' },
  INFO: { label: 'Information', variant: 'default' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) navigate(n.link);
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
              onClick={() => handleClick(n)}
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
                {n.link && (
                  <div className="shrink-0 mt-1 text-muted-foreground">
                    <ExternalLink className="size-4" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
