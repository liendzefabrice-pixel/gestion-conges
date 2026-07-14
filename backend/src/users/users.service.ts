import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaveBalanceEngineService } from '../leave-balance-engine/leave-balance-engine.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private leaveBalanceEngine: LeaveBalanceEngineService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUserId: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Veuillez sélectionner un rôle');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    if (role.name !== 'ADMIN' && !createUserDto.departmentId) {
      throw new BadRequestException('Le département est requis pour ce rôle');
    }

    if (createUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: createUserDto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Département introuvable');
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: createUserDto.email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: createUserDto.firstName.trim(),
          lastName: createUserDto.lastName.trim(),
          gender: createUserDto.gender,
          roleId: createUserDto.roleId,
          mustChangePassword: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          isActive: true,
          mustChangePassword: true,
          role: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_CREATED',
          entityType: 'USER',
          entityId: created.id,
          newValue: { email: created.email, role: role.name } as any,
          userId: currentUserId,
        },
      });

      if (role.name !== 'ADMIN' && createUserDto.departmentId) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        await tx.employee.create({
          data: {
            matricule: `${createUserDto.email.split('@')[0]}-${randomSuffix}`,
            firstName: createUserDto.firstName.trim(),
            lastName: createUserDto.lastName.trim(),
            hireDate: new Date(),
            userId: created.id,
            departmentId: createUserDto.departmentId,
          },
        });
      }

      return created;
    });

    this.notificationsService.userCreated(user.id, user.email, user.role.name);

    if (role.name !== 'ADMIN' && createUserDto.departmentId) {
      const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
      if (employee) {
        await this.leaveBalanceEngine.syncEmployeeBalances(employee.id);
      }
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        isActive: true,
        role: { select: { id: true, name: true, description: true } },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        isActive: true,
        role: { select: { id: true, name: true, description: true } },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUserId: number) {
    const target = await this.findOne(id);
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (id === currentUserId && updateUserDto.roleId && updateUserDto.roleId !== target.role?.id) {
      throw new ForbiddenException('Cette action est interdite pour votre propre compte Administrateur');
    }

    if (id === currentUserId && updateUserDto.isActive !== undefined && updateUserDto.isActive !== target.isActive && !updateUserDto.isActive) {
      throw new ForbiddenException('Cette action est interdite pour votre propre compte Administrateur');
    }

    if (updateUserDto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email.trim().toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Veuillez sélectionner un rôle');
      }
    }

    const oldUser = await this.prisma.user.findUnique({
      where: { id },
      select: { isActive: true, email: true, firstName: true, lastName: true, roleId: true },
    });

    if (!oldUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const data: any = { ...updateUserDto };
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (data.firstName !== undefined) data.firstName = data.firstName.trim();
    if (data.lastName !== undefined) data.lastName = data.lastName.trim();

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        isActive: true,
        role: { select: { id: true, name: true, description: true } },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    const changedFields: string[] = [];
    if (updateUserDto.email !== undefined && updateUserDto.email !== oldUser.email) changedFields.push('email');
    if (updateUserDto.firstName !== undefined && updateUserDto.firstName !== oldUser.firstName) changedFields.push('firstName');
    if (updateUserDto.lastName !== undefined && updateUserDto.lastName !== oldUser.lastName) changedFields.push('lastName');
    if (updateUserDto.roleId !== undefined && updateUserDto.roleId !== oldUser.roleId) changedFields.push('roleId');
    if (updateUserDto.isActive !== undefined && updateUserDto.isActive !== oldUser.isActive) changedFields.push('isActive');

    if (changedFields.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: updateUserDto.isActive !== undefined && updateUserDto.isActive !== oldUser.isActive
            ? (updateUserDto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED')
            : 'USER_MODIFIED',
          entityType: 'USER',
          entityId: id,
          oldValue: { email: oldUser.email, isActive: oldUser.isActive } as any,
          newValue: { email: updated.email, isActive: updated.isActive, changedFields } as any,
          userId: currentUserId,
        },
      });
    }

    if (oldUser && updateUserDto.isActive !== undefined && updateUserDto.isActive !== oldUser.isActive) {
      if (updateUserDto.isActive) {
        this.notificationsService.userActivated(id, updated.email);
      } else {
        this.notificationsService.userDeactivated(id, updated.email);
      }
    } else if (changedFields.some((f) => f !== 'isActive')) {
      this.notificationsService.userModified(id, updated.email);
    }

    return updated;
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('Cette action est interdite pour votre propre compte Administrateur');
    }

    await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          action: 'USER_DELETED',
          entityType: 'USER',
          entityId: id,
          userId: currentUserId,
        },
      });

      await tx.employee.deleteMany({ where: { userId: id } });
      return tx.user.delete({ where: { id } });
    });

    return result;
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
