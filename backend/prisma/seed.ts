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
