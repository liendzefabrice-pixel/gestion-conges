import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPositionDto: CreatePositionDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: createPositionDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
    }

    const existing = await this.prisma.position.findUnique({
      where: { name_departmentId: { name: createPositionDto.name, departmentId: createPositionDto.departmentId } },
    });

    if (existing) {
      throw new ConflictException('Ce poste existe déjà dans ce département');
    }

    const position = await this.prisma.position.create({
      data: createPositionDto,
      include: {
        department: true,
        _count: { select: { employees: true } },
      },
    });

    this.notificationsService.positionCreated(position.id, position.name);

    return position;
  }

  async findAll() {
    return this.prisma.position.findMany({
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findActive() {
    return this.prisma.position.findMany({
      where: { isActive: true },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!position) {
      throw new NotFoundException('Poste introuvable');
    }

    return position;
  }

  async update(id: number, updatePositionDto: UpdatePositionDto) {
    await this.findOne(id);

    if (updatePositionDto.name || updatePositionDto.departmentId !== undefined) {
      const name = updatePositionDto.name;
      const departmentId = updatePositionDto.departmentId;
      if (name && departmentId !== undefined) {
        const existing = await this.prisma.position.findUnique({
          where: { name_departmentId: { name, departmentId } },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException('Ce nom de poste existe déjà dans ce département');
        }
      }
    }

    return this.prisma.position.update({
      where: { id },
      data: updatePositionDto,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const hasEmployees = await this.prisma.employee.findFirst({
      where: { positionId: id },
    });

    if (hasEmployees) {
      throw new ConflictException(
        'Impossible de supprimer ce poste : des employés y sont rattachés',
      );
    }

    return this.prisma.position.delete({ where: { id } });
  }
}
