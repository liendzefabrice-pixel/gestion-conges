import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { LeaveCampaignModule } from './leave-campaign/leave-campaign.module';
import { InternalEventsModule } from './internal-events/internal-events.module';
import { CalendarModule } from './calendar/calendar.module';
import { CalendarRhModule } from './calendar-rh/calendar-rh.module';
import { DecisionEngineModule } from './decision-engine/decision-engine.module';
import { SkillsModule } from './skills/skills.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    LeaveTypesModule,
    LeaveBalancesModule,
    HolidaysModule,
    LeaveAccrualModule,
    LeaveBalanceEngineModule,
    LeaveCampaignModule,
    InternalEventsModule,
    CalendarModule,
    CalendarRhModule,
    DecisionEngineModule,
    SkillsModule,
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}