import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'ADMIN', description: 'Administrateur système' },
    { name: 'EMPLOYEE', description: 'Employé' },
    { name: 'HR', description: 'Service des Ressources Humaines' },
    { name: 'DIRECTOR', description: 'Direction' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (adminRole) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@siap-pharma.com' },
      update: { mustChangePassword: false },
      create: {
        email: 'admin@siap-pharma.com',
        password: hashedPassword,
        roleId: adminRole.id,
        mustChangePassword: false,
      },
    });
  }

  const leaveTypes = [
    { name: 'Congé annuel', description: 'Congés payés annuels', defaultDays: 25, color: '#0B6B3A', icon: 'Calendar', requiresRhValidation: true, requiresDirectorValidation: true, requiresJustification: false, deductsFromAnnualBalance: true, maxDuration: 30, minDuration: 1 },
    { name: 'Congé maladie', description: 'Congé pour raison médicale', defaultDays: 15, color: '#D91F26', icon: 'HeartPulse', requiresRhValidation: true, requiresDirectorValidation: false, requiresJustification: true, deductsFromAnnualBalance: false, maxDuration: null, minDuration: 1 },
    { name: 'Congé maternité', description: 'Congé pour maternité', defaultDays: 98, color: '#8DBB52', icon: 'Baby', requiresRhValidation: true, requiresDirectorValidation: false, requiresJustification: true, deductsFromAnnualBalance: false, maxDuration: 98, minDuration: 14 },
    { name: 'Permission exceptionnelle', description: 'Permission pour événement familial', defaultDays: 5, color: '#F59E0B', icon: 'Star', requiresRhValidation: false, requiresDirectorValidation: false, requiresJustification: false, deductsFromAnnualBalance: true, maxDuration: 5, minDuration: 1 },
    { name: 'Congé sans solde', description: 'Congé non rémunéré', defaultDays: 0, color: '#6B7280', icon: 'Clock', requiresRhValidation: true, requiresDirectorValidation: true, requiresJustification: false, deductsFromAnnualBalance: false, maxDuration: null, minDuration: 1 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: lt,
      create: lt,
    });
  }

  const dept = await prisma.department.upsert({
    where: { name: 'Direction Générale' },
    update: {},
    create: { name: 'Direction Générale', description: 'Direction générale de l\'entreprise' },
  });

  await prisma.department.upsert({
    where: { name: 'Ressources Humaines' },
    update: {},
    create: { name: 'Ressources Humaines', description: 'Service des Ressources Humaines' },
  });

  const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
  if (hrRole) {
    const hrHashed = await bcrypt.hash('rh123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'rh@siap-pharma.com' },
      update: { mustChangePassword: false },
      create: {
        email: 'rh@siap-pharma.com',
        password: hrHashed,
        roleId: hrRole.id,
        mustChangePassword: false,
      },
    });
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        matricule: 'RH-001',
        firstName: 'Marie',
        lastName: 'Martin',
        hireDate: new Date('2022-06-01'),
        position: 'Responsable RH',
        departmentId: dept.id,
        userId: user.id,
      },
    });
  }

  const dirRole = await prisma.role.findUnique({ where: { name: 'DIRECTOR' } });
  if (dirRole) {
    const dirHashed = await bcrypt.hash('dir123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'directeur@siap-pharma.com' },
      update: { mustChangePassword: false },
      create: {
        email: 'directeur@siap-pharma.com',
        password: dirHashed,
        roleId: dirRole.id,
        mustChangePassword: false,
      },
    });
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        matricule: 'DIR-001',
        firstName: 'Pierre',
        lastName: 'Dubois',
        hireDate: new Date('2020-01-01'),
        position: 'Directeur Général',
        departmentId: dept.id,
        userId: user.id,
      },
    });
  }

  const empRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
  if (empRole) {
    const empHashed = await bcrypt.hash('emp123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'employe@siap-pharma.com' },
      update: {},
      create: {
        email: 'employe@siap-pharma.com',
        password: empHashed,
        roleId: empRole.id,
        mustChangePassword: true,
      },
    });
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        matricule: 'EMP-001',
        firstName: 'Jean',
        lastName: 'Dupont',
        hireDate: new Date('2023-01-15'),
        position: 'Développeur',
        departmentId: dept.id,
        userId: user.id,
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@siap-pharma.com' } });
  if (admin) {
    const adminEmp = await prisma.employee.findUnique({ where: { userId: admin.id } });
    if (!adminEmp) {
      await prisma.employee.create({
        data: {
          matricule: 'ADM-001',
          firstName: 'Admin',
          lastName: 'Système',
          hireDate: new Date('2024-01-01'),
          position: 'Administrateur',
          departmentId: dept.id,
          userId: admin.id,
        },
      });
    }
  }

  const currentYear = new Date().getFullYear();
  const allEmployees = await prisma.employee.findMany();
  for (const emp of allEmployees) {
    await prisma.permissionBalance.upsert({
      where: { employeeId_year: { employeeId: emp.id, year: currentYear } },
      update: {},
      create: {
        employeeId: emp.id,
        year: currentYear,
        totalDays: 10,
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
