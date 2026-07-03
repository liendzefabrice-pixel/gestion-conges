const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.leaveType.update({
    where: { id: 1 },
    data: { name: 'Congés annuels', description: 'Congés payés annuels' },
  });
  const types = await prisma.leaveType.findMany();
  console.log(JSON.stringify(types));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e.message);
  prisma.$disconnect();
});
