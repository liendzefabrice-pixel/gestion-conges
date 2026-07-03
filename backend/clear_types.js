const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.leaveType.deleteMany({});
  await prisma.$disconnect();
  console.log('Leave types cleared');
}

main().catch(e => {
  console.error(e.message);
  prisma.$disconnect();
});
