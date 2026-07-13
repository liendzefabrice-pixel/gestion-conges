import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseChannel } from './channels/database.channel';
import { NotificationPayload } from './interfaces/notification-channel.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private databaseChannel: DatabaseChannel,
  ) {}

  private async send(payload: NotificationPayload): Promise<void> {
    if (payload.userIds.length === 0) return;
    await this.databaseChannel.send(payload);
  }

  private async getAdminUserIds(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { name: 'ADMIN' }, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getHrUserIds(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { name: 'HR' }, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getDirectorUserIds(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { name: 'DIRECTOR' }, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getEmployeeUserId(employeeId: number): Promise<number | null> {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true },
    });
    return emp?.userId ?? null;
  }

  // ---------------------------------------------------------------------------
  // LEAVE events
  // ---------------------------------------------------------------------------

  async leaveCreated(leaveRequestId: number, employeeId: number, employeeName: string, leaveTypeName: string, startDate: Date, endDate: Date) {
    const period = `${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`;
    const [hrIds, adminIds] = await Promise.all([this.getHrUserIds(), this.getAdminUserIds()]);
    await this.send({
      userIds: [...new Set([...hrIds, ...adminIds])],
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a soumis une demande de ${leaveTypeName} du ${period}`,
      type: 'LEAVE_CREATED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  async leaveRhReviewed(leaveRequestId: number, employeeId: number, rhName: string) {
    const userId = await this.getEmployeeUserId(employeeId);
    if (!userId) return;
    await this.send({
      userIds: [userId],
      title: 'Demande de congé examinée',
      message: `Votre demande de congé a été examinée par le RH (${rhName}). En attente de décision de la direction.`,
      type: 'LEAVE_RH_REVIEWED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  async leaveSentToDirector(leaveRequestId: number, employeeId: number, employeeName: string, leaveTypeName: string) {
    const [directorIds, adminIds] = await Promise.all([this.getDirectorUserIds(), this.getAdminUserIds()]);
    await this.send({
      userIds: [...new Set([...directorIds, ...adminIds])],
      title: 'Avis RH donné — Décision requise',
      message: `Le RH a transmis la demande de ${leaveTypeName} de ${employeeName}. Décision requise.`,
      type: 'LEAVE_TRANSMITTED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  async leaveApproved(leaveRequestId: number, employeeId: number, leaveTypeName: string, directorName: string) {
    const userId = await this.getEmployeeUserId(employeeId);
    if (!userId) return;
    await this.send({
      userIds: [userId],
      title: 'Demande de congé approuvée',
      message: `Votre demande de ${leaveTypeName} a été approuvée par ${directorName}.`,
      type: 'LEAVE_DECIDED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  async leaveRefused(leaveRequestId: number, employeeId: number, leaveTypeName: string, directorName: string) {
    const userId = await this.getEmployeeUserId(employeeId);
    if (!userId) return;
    await this.send({
      userIds: [userId],
      title: 'Demande de congé refusée',
      message: `Votre demande de ${leaveTypeName} a été refusée par ${directorName}.`,
      type: 'LEAVE_DECIDED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  async leaveCancelled(leaveRequestId: number, employeeId: number, employeeName: string, leaveTypeName: string) {
    const [hrIds, adminIds] = await Promise.all([this.getHrUserIds(), this.getAdminUserIds()]);
    const userId = await this.getEmployeeUserId(employeeId);
    const recipientIds = [...new Set([...(userId ? [userId] : []), ...hrIds, ...adminIds])];
    await this.send({
      userIds: recipientIds,
      title: 'Demande de congé annulée',
      message: `${employeeName} a annulé sa demande de ${leaveTypeName}.`,
      type: 'LEAVE_CANCELLED',
      link: '/leave',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequestId,
    });
  }

  // ---------------------------------------------------------------------------
  // PERMISSION events
  // ---------------------------------------------------------------------------

  async permissionCreated(permissionRequestId: number, employeeId: number, employeeName: string, startDate: Date, endDate: Date) {
    const period = `${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`;
    const [hrIds, adminIds] = await Promise.all([this.getHrUserIds(), this.getAdminUserIds()]);
    await this.send({
      userIds: [...new Set([...hrIds, ...adminIds])],
      title: 'Nouvelle demande de permission',
      message: `${employeeName} a soumis une demande de permission du ${period}`,
      type: 'PERMISSION_CREATED',
      link: '/permissions',
      entityType: 'PERMISSION_REQUEST',
      entityId: permissionRequestId,
    });
  }

  async permissionRhReviewed(permissionRequestId: number, employeeId: number, rhName: string) {
    const userId = await this.getEmployeeUserId(employeeId);
    if (!userId) return;
    await this.send({
      userIds: [userId],
      title: 'Demande de permission examinée',
      message: `Votre demande de permission a été examinée par le RH (${rhName}). En attente de décision de la direction.`,
      type: 'PERMISSION_RH_REVIEWED',
      link: '/permissions',
      entityType: 'PERMISSION_REQUEST',
      entityId: permissionRequestId,
    });
  }

  async permissionDecided(permissionRequestId: number, employeeId: number, decision: string, directorName: string) {
    const userId = await this.getEmployeeUserId(employeeId);
    if (!userId) return;
    const label = decision === 'APPROUVE' ? 'approuvée' : 'refusée';
    await this.send({
      userIds: [userId],
      title: `Demande de permission ${label}`,
      message: `Votre demande de permission a été ${label} par ${directorName}.`,
      type: 'PERMISSION_DECIDED',
      link: '/permissions',
      entityType: 'PERMISSION_REQUEST',
      entityId: permissionRequestId,
    });
  }

  // ---------------------------------------------------------------------------
  // USER events
  // ---------------------------------------------------------------------------

  async userCreated(userId: number, userEmail: string, roleName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Utilisateur créé',
      message: `L'utilisateur ${userEmail} a été créé avec le rôle ${roleName}.`,
      type: 'USER_CREATED',
      link: '/users',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async userActivated(userId: number, userEmail: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Utilisateur activé',
      message: `Le compte de ${userEmail} a été activé.`,
      type: 'USER_ACTIVATED',
      link: '/users',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async userDeactivated(userId: number, userEmail: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Utilisateur désactivé',
      message: `Le compte de ${userEmail} a été désactivé.`,
      type: 'USER_DEACTIVATED',
      link: '/users',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async userModified(userId: number, userEmail: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Utilisateur modifié',
      message: `Le compte de ${userEmail} a été modifié.`,
      type: 'USER_MODIFIED',
      link: '/users',
      entityType: 'USER',
      entityId: userId,
    });
  }

  async welcomeNotification(userId: number) {
    await this.send({
      userIds: [userId],
      title: 'Bienvenue sur Gestion Congés',
      message: 'Bienvenue ! Vous pouvez dès à présent soumettre vos demandes de congés et permissions depuis votre espace.',
      type: 'INFO',
    });
  }

  // ---------------------------------------------------------------------------
  // EMPLOYEE events
  // ---------------------------------------------------------------------------

  async employeeCreated(employeeId: number, employeeName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Employé créé',
      message: `L'employé ${employeeName} a été ajouté.`,
      type: 'EMPLOYEE_CREATED',
      link: '/employees',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
    });
  }

  async employeeModified(employeeId: number, employeeName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Employé modifié',
      message: `Les informations de ${employeeName} ont été mises à jour.`,
      type: 'EMPLOYEE_MODIFIED',
      link: '/employees',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
    });
  }

  // ---------------------------------------------------------------------------
  // SETTING events
  // ---------------------------------------------------------------------------

  async departmentCreated(departmentId: number, departmentName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Département créé',
      message: `Le département ${departmentName} a été créé.`,
      type: 'DEPARTMENT_CREATED',
      link: '/departments',
      entityType: 'DEPARTMENT',
      entityId: departmentId,
    });
  }

  async positionCreated(positionId: number, positionName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Poste créé',
      message: `Le poste ${positionName} a été créé.`,
      type: 'POSITION_CREATED',
      link: '/departments',
      entityType: 'POSITION',
      entityId: positionId,
    });
  }

  async leaveTypeCreated(leaveTypeId: number, leaveTypeName: string) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Type de congé créé',
      message: `Le type de congé ${leaveTypeName} a été créé.`,
      type: 'LEAVE_TYPE_CREATED',
      link: '/leave',
      entityType: 'LEAVE_TYPE',
      entityId: leaveTypeId,
    });
  }

  async holidayAdded(holidayId: number, holidayName: string, holidayDate: Date) {
    const adminIds = await this.getAdminUserIds();
    await this.send({
      userIds: adminIds,
      title: 'Jour férié ajouté',
      message: `Le jour férié ${holidayName} (${holidayDate.toLocaleDateString()}) a été ajouté.`,
      type: 'HOLIDAY_ADDED',
      entityType: 'HOLIDAY',
      entityId: holidayId,
    });
  }

  async notifyCampaignOpened(userIds: number[], campaignLabel: string) {
    await this.send({
      userIds,
      title: 'Programmation annuelle des congés',
      message: `La campagne ${campaignLabel} est ouverte. Veuillez proposer votre période souhaitée de départ en congé.`,
      type: 'CAMPAIGN_OPENED',
      entityType: 'CAMPAIGN',
      entityId: 0,
      link: '/my-campaign',
    });
  }

  // ---------------------------------------------------------------------------
  // STANDARD CRUD (retained)
  // ---------------------------------------------------------------------------

  async findByUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
