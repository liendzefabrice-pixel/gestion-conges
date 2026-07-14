import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSkillDto) {
    const existing = await this.prisma.skill.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Cette compétence existe déjà');
    }

    return this.prisma.skill.create({ data: dto });
  }

  async findAll() {
    const skills = await this.prisma.skill.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });

    return skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      employeeCount: s._count.employees,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async findOne(id: number) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, matricule: true },
            },
          },
        },
      },
    });

    if (!skill) throw new NotFoundException('Compétence introuvable');
    return skill;
  }

  async update(id: number, dto: UpdateSkillDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.skill.findUnique({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Cette compétence existe déjà');
      }
    }

    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }
}
