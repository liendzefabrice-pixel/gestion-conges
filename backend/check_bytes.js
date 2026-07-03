const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe('SELECT id, name::bytea FROM "LeaveType"');
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e.message);
  prisma.$disconnect();
});
