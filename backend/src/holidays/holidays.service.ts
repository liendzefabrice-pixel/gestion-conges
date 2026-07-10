import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHolidayDto) {
    const date = new Date(dto.date);

    const existing = await this.prisma.holiday.findUnique({
      where: { name_date: { name: dto.name, date } },
    });

    if (existing) {
      throw new ConflictException('Un jour férié avec ce nom et cette date existe déjà');
    }

    return this.prisma.holiday.create({
      data: {
        name: dto.name,
        date,
        isRecurring: dto.isRecurring ?? false,
        description: dto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: number) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) throw new NotFoundException('Jour férié introuvable');
    return holiday;
  }

  async update(id: number, dto: UpdateHolidayDto) {
    await this.findOne(id);

    if (dto.name || dto.date) {
      const date = dto.date ? new Date(dto.date) : undefined;
      const name = dto.name;

      if (name && date) {
        const existing = await this.prisma.holiday.findUnique({
          where: { name_date: { name, date } },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException('Un jour férié avec ce nom et cette date existe déjà');
        }
      }
    }

    return this.prisma.holiday.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.holiday.delete({ where: { id } });
  }
}
