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
    { name: 'Congés annuels', description: 'Congés payés annuels', defaultDays: 25 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: { name: lt.name, description: lt.description, defaultDays: lt.defaultDays },
      create: lt,
    });
  }

  const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
  if (hrRole) {
    const hrHashed = await bcrypt.hash('rh123', 10);
    await prisma.user.upsert({
      where: { email: 'rh@siap-pharma.com' },
      update: { mustChangePassword: false },
      create: {
        email: 'rh@siap-pharma.com',
        password: hrHashed,
        roleId: hrRole.id,
        mustChangePassword: false,
      },
    });
  }

  const dirRole = await prisma.role.findUnique({ where: { name: 'DIRECTOR' } });
  if (dirRole) {
    const dirHashed = await bcrypt.hash('dir123', 10);
    await prisma.user.upsert({
      where: { email: 'directeur@siap-pharma.com' },
      update: { mustChangePassword: false },
      create: {
        email: 'directeur@siap-pharma.com',
        password: dirHashed,
        roleId: dirRole.id,
        mustChangePassword: false,
      },
    });
  }

  const empRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
  const dept = await prisma.department.findFirst();
  if (empRole && dept) {
    const empHashed = await bcrypt.hash('emp123', 10);
    await prisma.user.upsert({
      where: { email: 'employe@siap-pharma.com' },
      update: {},
      create: {
        email: 'employe@siap-pharma.com',
        password: empHashed,
        roleId: empRole.id,
        mustChangePassword: true,
      },
    });

    const empUser = await prisma.user.findUnique({ where: { email: 'employe@siap-pharma.com' } });
    if (empUser) {
      await prisma.employee.upsert({
        where: { userId: empUser.id },
        update: {},
        create: {
          matricule: 'EMP-001',
          firstName: 'Jean',
          lastName: 'Dupont',
          hireDate: new Date('2023-01-15'),
          position: 'Développeur',
          departmentId: dept.id,
          userId: empUser.id,
        },
      });
    }
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
