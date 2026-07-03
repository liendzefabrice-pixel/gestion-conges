import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        roleId: createUserDto.roleId,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
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

    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('Rôle introuvable');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    const employee = await this.prisma.employee.findUnique({
      where: { userId: id },
    });

    if (employee) {
      throw new ConflictException(
        'Cet utilisateur est lié à un employé. Supprimez d\'abord l\'employé.',
      );
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
