-- Add adjustedDays and status to LeaveBalance
ALTER TABLE "LeaveBalance" ADD COLUMN "adjustedDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LeaveBalance" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIF';

-- Create BalanceAdjustment table
CREATE TABLE "BalanceAdjustment" (
    "id" SERIAL NOT NULL,
    "operationType" TEXT NOT NULL,
    "previousRemaining" INTEGER NOT NULL DEFAULT 0,
    "newRemaining" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "leaveBalanceId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- Create index
CREATE INDEX "BalanceAdjustment_leaveBalanceId_idx" ON "BalanceAdjustment"("leaveBalanceId");

-- Add foreign keys
ALTER TABLE "BalanceAdjustment" ADD CONSTRAINT "BalanceAdjustment_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "LeaveBalance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BalanceAdjustment" ADD CONSTRAINT "BalanceAdjustment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
