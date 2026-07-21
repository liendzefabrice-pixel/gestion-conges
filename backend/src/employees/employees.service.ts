import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaveBalanceEngineService } from '../leave-balance-engine/leave-balance-engine.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private leaveBalanceEngine: LeaveBalanceEngineService,
  ) {}

  private validateHireDate(hireDate: string | Date): Date {
    const date = new Date(hireDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('La date d\'embauche est invalide');
    }
    if (date > new Date()) {
      throw new BadRequestException('La date d\'embauche ne peut pas être dans le futur');
    }
    if (date < new Date('1900-01-01')) {
      throw new BadRequestException('La date d\'embauche est trop ancienne');
    }
    return date;
  }

  private trimNames(dto: { firstName?: string; lastName?: string }): void {
    if (dto.firstName !== undefined) dto.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) dto.lastName = dto.lastName.trim();
  }

  async create(createEmployeeDto: CreateEmployeeDto, currentUserId: number) {
    this.trimNames(createEmployeeDto);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const existingMatricule = await this.prisma.employee.findUnique({
      where: { matricule: createEmployeeDto.matricule },
    });
    if (existingMatricule) {
      throw new ConflictException('Ce matricule est déjà attribué');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });
    if (!department) {
      throw new NotFoundException('Département introuvable');
    }

    if (createEmployeeDto.positionId) {
      const pos = await this.prisma.position.findUnique({
        where: { id: createEmployeeDto.positionId },
      });
      if (!pos) {
        throw new NotFoundException('Poste introuvable');
      }
      if (pos.departmentId !== createEmployeeDto.departmentId) {
        throw new BadRequestException('Le poste sélectionné n\'appartient pas au département choisi');
      }
    }

    const hireDate = this.validateHireDate(createEmployeeDto.hireDate);
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    const employeeRole = await this.prisma.role.findUnique({
      where: { name: 'EMPLOYEE' },
    });

    const employee = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createEmployeeDto.email.trim().toLowerCase(),
          password: hashedPassword,
          roleId: employeeRole!.id,
          mustChangePassword: true,
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
        },
      });

      const { position, positionId, ...empData } = createEmployeeDto;

      const emp = await tx.employee.create({
        data: {
          ...empData,
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          position: position || null,
          positionId: positionId || null,
          hireDate,
          userId: user.id,
        },
        include: {
          user: { include: { role: true } },
          department: true,
          positionRef: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'EMPLOYEE_CREATED',
          entityType: 'EMPLOYEE',
          entityId: emp.id,
          newValue: {
            matricule: emp.matricule,
            firstName: emp.firstName,
            lastName: emp.lastName,
            departmentId: emp.departmentId,
            positionId: emp.positionId,
          } as any,
          userId: currentUserId,
        },
      });

      const employeeName = `${emp.firstName} ${emp.lastName}`;
      this.notificationsService.employeeCreated(emp.id, employeeName);

      return emp;
    });

    await this.leaveBalanceEngine.syncEmployeeBalances(employee.id);
    return employee;
  }

  async findAll(userRole?: string) {
    const where: any = {};

    if (!userRole || userRole !== 'ADMIN') {
      where.user = { role: { name: { not: 'ADMIN' } } };
    } else {
      where.user = { role: { name: { not: 'ADMIN' } } };
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, isActive: true, gender: true, role: true } },
        department: true,
        positionRef: true,
        skills: { include: { skill: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findByUserId(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
        leaveBalances: { include: { leaveType: true } },
        skills: { include: { skill: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Profil employé introuvable');
    }

    return employee;
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
        leaveBalances: { include: { leaveType: true } },
        skills: { include: { skill: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return employee;
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto, currentUserId: number) {
    const employee = await this.findOne(id);
    this.trimNames(updateEmployeeDto);

    if (updateEmployeeDto.matricule) {
      const existingMatricule = await this.prisma.employee.findUnique({
        where: { matricule: updateEmployeeDto.matricule },
      });
      if (existingMatricule && existingMatricule.id !== id) {
        throw new ConflictException('Ce matricule est déjà attribué');
      }
    }

    let newDepartmentId = updateEmployeeDto.departmentId ?? employee.departmentId;

    if (updateEmployeeDto.departmentId && updateEmployeeDto.departmentId !== employee.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateEmployeeDto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Département introuvable');
      }
    }

    let effectivePositionId = updateEmployeeDto.positionId !== undefined ? updateEmployeeDto.positionId : employee.positionId;

    if (updateEmployeeDto.departmentId && updateEmployeeDto.departmentId !== employee.departmentId) {
      if (effectivePositionId) {
        const pos = await this.prisma.position.findUnique({
          where: { id: effectivePositionId },
        });
        if (!pos || pos.departmentId !== updateEmployeeDto.departmentId) {
          effectivePositionId = null;
        }
      }
    }

    if (effectivePositionId) {
      const pos = await this.prisma.position.findUnique({
        where: { id: effectivePositionId },
      });
      if (pos && pos.departmentId !== newDepartmentId) {
        throw new BadRequestException('Le poste sélectionné n\'appartient pas au département choisi');
      }
    }

    let hireDate: Date | undefined;
    if (updateEmployeeDto.hireDate) {
      hireDate = this.validateHireDate(updateEmployeeDto.hireDate);
    }

    const { position, positionId, roleId, ...rest } = updateEmployeeDto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (roleId !== undefined) {
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role) {
          throw new NotFoundException('Rôle introuvable');
        }
        await tx.user.update({
          where: { id: employee.userId },
          data: { roleId },
        });
      }

      const firstNameChanged = updateEmployeeDto.firstName !== undefined && updateEmployeeDto.firstName !== employee.firstName;
      const lastNameChanged = updateEmployeeDto.lastName !== undefined && updateEmployeeDto.lastName !== employee.lastName;
      if (firstNameChanged || lastNameChanged) {
        const userUpdateData: any = {};
        if (firstNameChanged) userUpdateData.firstName = updateEmployeeDto.firstName;
        if (lastNameChanged) userUpdateData.lastName = updateEmployeeDto.lastName;
        await tx.user.update({
          where: { id: employee.userId },
          data: userUpdateData,
        });
      }

      return tx.employee.update({
        where: { id },
        data: {
          ...rest,
          firstName: updateEmployeeDto.firstName ?? undefined,
          lastName: updateEmployeeDto.lastName ?? undefined,
          position: position ?? undefined,
          positionId: effectivePositionId ?? undefined,
          hireDate: hireDate ?? undefined,
        },
        include: {
          user: { select: { id: true, email: true, isActive: true, role: true } },
          department: true,
          positionRef: true,
          skills: { include: { skill: true } },
        },
      });
    });

    const changedFields: string[] = [];
    if (updateEmployeeDto.firstName !== undefined && updateEmployeeDto.firstName !== employee.firstName) changedFields.push('firstName');
    if (updateEmployeeDto.lastName !== undefined && updateEmployeeDto.lastName !== employee.lastName) changedFields.push('lastName');
    if (updateEmployeeDto.departmentId !== undefined && updateEmployeeDto.departmentId !== employee.departmentId) changedFields.push('departmentId');
    if (effectivePositionId !== employee.positionId) changedFields.push('positionId');
    if (updateEmployeeDto.hireDate !== undefined) changedFields.push('hireDate');

    if (changedFields.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_MODIFIED',
          entityType: 'EMPLOYEE',
          entityId: id,
          oldValue: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            departmentId: employee.departmentId,
            positionId: employee.positionId,
          } as any,
          newValue: {
            firstName: updated.firstName,
            lastName: updated.lastName,
            departmentId: updated.departmentId,
            positionId: updated.positionId,
            changedFields,
          } as any,
          userId: currentUserId,
        },
      });
    }

    if (updateEmployeeDto.departmentId !== undefined && updateEmployeeDto.departmentId !== employee.departmentId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_DEPT_CHANGED',
          entityType: 'EMPLOYEE',
          entityId: id,
          oldValue: { departmentId: employee.departmentId, departmentName: employee.department?.name } as any,
          newValue: { departmentId: updated.departmentId, departmentName: updated.department?.name } as any,
          userId: currentUserId,
        },
      });
    }

    if (effectivePositionId !== employee.positionId) {
      const oldPosName = employee.positionRef?.name || employee.position;
      const newPosName = updated.positionRef?.name || updated.position;
      await this.prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_POSITION_CHANGED',
          entityType: 'EMPLOYEE',
          entityId: id,
          oldValue: { positionId: employee.positionId, positionName: oldPosName } as any,
          newValue: { positionId: effectivePositionId, positionName: newPosName } as any,
          userId: currentUserId,
        },
      });
    }

    const employeeName = `${updated.firstName} ${updated.lastName}`;
    this.notificationsService.employeeModified(id, employeeName);

    if (updateEmployeeDto.hireDate) {
      await this.leaveBalanceEngine.syncEmployeeBalances(id);
    }

    return updated;
  }

  async updateSkills(id: number, skillIds: number[]) {
    await this.findOne(id);

    await this.prisma.employeeSkill.deleteMany({ where: { employeeId: id } });

    if (skillIds.length > 0) {
      await this.prisma.employeeSkill.createMany({
        data: skillIds.map((skillId) => ({ employeeId: id, skillId })),
      });
    }

    return this.findOne(id);
  }

  async getReplacements(id: number) {
    await this.findOne(id);

    const [asEmployee, asReplacement] = await Promise.all([
      this.prisma.employeeReplacement.findMany({
        where: { employeeId: id },
        include: {
          replacement: {
            include: {
              positionRef: true,
              department: { select: { id: true, name: true } },
              skills: { include: { skill: true } },
            },
          },
        },
      }),
      this.prisma.employeeReplacement.findMany({
        where: { replacementId: id },
        include: {
          employee: {
            include: {
              positionRef: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return { asEmployee, asReplacement };
  }

  async setReplacements(id: number, replacementIds: number[]) {
    await this.findOne(id);

    await this.prisma.employeeReplacement.deleteMany({ where: { employeeId: id } });

    if (replacementIds.length > 0) {
      for (const replacementId of replacementIds) {
        if (replacementId === id) continue;
        await this.prisma.employeeReplacement.create({
          data: { employeeId: id, replacementId },
        });
      }
    }

    return this.getReplacements(id);
  }

  async getEligibleReplacements(employeeId: number) {
    const employee = await this.findOne(employeeId);

    if (!employee.positionId) {
      return [];
    }

    const position = await this.prisma.position.findUnique({
      where: { id: employee.positionId },
      include: {
        employees: {
          where: { id: { not: employeeId } },
          include: {
            user: { select: { id: true, email: true, isActive: true } },
            department: { select: { id: true, name: true } },
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!position) return [];

    return (position.employees || []).filter(
      (e) => e.user?.isActive,
    );
  }

  async getHistory(id: number) {
    await this.findOne(id);

    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'EMPLOYEE',
        entityId: id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, currentUserId: number) {
    const employee = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          action: 'EMPLOYEE_DELETED',
          entityType: 'EMPLOYEE',
          entityId: id,
          oldValue: {
            matricule: employee.matricule,
            firstName: employee.firstName,
            lastName: employee.lastName,
          } as any,
          userId: currentUserId,
        },
      });

      await tx.employee.delete({ where: { id } });
      await tx.user.delete({ where: { id: employee.userId } });
    });

    return { message: 'Employé supprimé' };
  }
}
