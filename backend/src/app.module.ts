import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';
import { LeavePlanningModule } from './leave-planning/leave-planning.module';
import { PermissionsModule } from './permissions/permissions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { PositionsModule } from './positions/positions.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { LeaveBalancesModule } from './leave-balances/leave-balances.module';
import { HolidaysModule } from './holidays/holidays.module';
import { LeaveAccrualModule } from './leave-accrual/leave-accrual.module';
import { LeaveBalanceEngineModule } from './leave-balance-engine/leave-balance-engine.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    LeaveTypesModule,
    LeaveBalancesModule,
    HolidaysModule,
    LeaveAccrualModule,
    LeaveBalanceEngineModule,
    MailModule,
    EmployeesModule,
    LeaveModule,
    LeavePlanningModule,
    PermissionsModule,
    NotificationsModule,
    DashboardModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}