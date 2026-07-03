const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const serverEnc = await prisma.$queryRawUnsafe('SHOW server_encoding');
  console.log('Server encoding:', JSON.stringify(serverEnc));

  const clientEnc = await prisma.$queryRawUnsafe('SHOW client_encoding');
  console.log('Client encoding:', JSON.stringify(clientEnc));

  const types = await prisma.leaveType.findMany();
  console.log('Leave types:', JSON.stringify(types));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e.message);
  prisma.$disconnect();
});
