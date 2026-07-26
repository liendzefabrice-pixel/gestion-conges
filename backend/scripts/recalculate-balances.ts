import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employeeId = process.argv[2] ? Number(process.argv[2]) : undefined;

  const whereFilter = employeeId ? { employeeId } : {};
  const balances = await prisma.leaveBalance.findMany({ where: whereFilter });

  let updated = 0;
  for (const balance of balances) {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: balance.leaveTypeId } });
    if (!leaveType || !leaveType.deductsFromAnnualBalance) continue;

    const year = balance.year;

    const approvedSum = await prisma.leaveRequest.aggregate({
      where: {
        employeeId: balance.employeeId,
        leaveTypeId: balance.leaveTypeId,
        status: 'APPROUVE',
        startDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
      _sum: { duration: true },
    });

    const pendingSum = await prisma.leaveRequest.aggregate({
      where: {
        employeeId: balance.employeeId,
        leaveTypeId: balance.leaveTypeId,
        status: { in: ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
        startDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
      _sum: { duration: true },
    });

    const newUsed = approvedSum._sum.duration ?? 0;
    const newPending = pendingSum._sum.duration ?? 0;

    if (balance.usedDays !== newUsed || balance.pendingDays !== newPending) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: newUsed, pendingDays: newPending },
      });
      updated++;
      const remaining = balance.totalDays + balance.adjustedDays - newUsed - newPending;
      console.log(`  Employee ${balance.employeeId} | ${leaveType.name} ${year}: usedDays ${balance.usedDays}->${newUsed}, pendingDays ${balance.pendingDays}->${newPending}, remaining=${remaining}`);
    }
  }

  console.log(`\n${updated} solde(s) mis à jour.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
