import { Module } from '@nestjs/common'; import { ConfigModule } from '@nestjs/config'; import { HealthController } from './health.controller'; import { DatabaseModule } from './database/database.module'; import { AuthModule } from './auth/auth.module'; import { TrustedDevicesModule } from './devices/trusted-devices.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TransfersModule } from './transfers/transfers.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { MessagingModule } from './messaging/messaging.module';
import { WebsiteContentModule } from './website-content/website-content.module';
import { BackupModule } from './backup/backup.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { SalesModule } from './sales/sales.module'; import { CustomersModule } from './customers/customers.module';
import { SyncModule } from './sync/sync.module'; import { PhysicalStockModule } from './physical-stock/physical-stock.module'; import { UsersModule } from './users/users.module'; import { ProductsModule } from './products/products.module'; import { StockModule } from './stock/stock.module';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),DatabaseModule,AuthModule,UsersModule,TrustedDevicesModule, SyncModule, ProductsModule, StockModule, PhysicalStockModule, PurchasesModule, CustomersModule, SalesModule, TransfersModule, ExpensesModule, ReportsModule, MessagingModule, WebsiteContentModule, BackupModule, MonitoringModule],controllers:[HealthController]}) export class AppModule {}
