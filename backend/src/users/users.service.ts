import {
  Injectable,
  NotFoundException,
  ConflictException,
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

  async create(createUserDto: CreateUserDto) {
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
      throw new NotFoundException('Rôle introuvable');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    if (role.name !== 'ADMIN' && !createUserDto.departmentId) {
      throw new NotFoundException('Le département est requis pour ce rôle');
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
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
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

      if (role.name !== 'ADMIN' && createUserDto.departmentId) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        await tx.employee.create({
          data: {
            matricule: `${createUserDto.email.split('@')[0]}-${randomSuffix}`,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
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
        throw new NotFoundException('Rôle introuvable');
      }
    }

    const oldUser = await this.prisma.user.findUnique({
      where: { id },
      select: { isActive: true, email: true },
    });

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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

    if (oldUser && updateUserDto.isActive !== undefined && updateUserDto.isActive !== oldUser.isActive) {
      if (updateUserDto.isActive) {
        this.notificationsService.userActivated(id, updated.email);
      } else {
        this.notificationsService.userDeactivated(id, updated.email);
      }
    } else if (updateUserDto.email !== undefined || updateUserDto.firstName !== undefined || updateUserDto.lastName !== undefined || updateUserDto.roleId !== undefined) {
      this.notificationsService.userModified(id, updated.email);
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.employee.deleteMany({ where: { userId: id } });
      return tx.user.delete({ where: { id } });
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
