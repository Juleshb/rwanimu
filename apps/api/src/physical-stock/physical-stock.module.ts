import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockModule } from '../stock/stock.module';
import { PhysicalStockController } from './physical-stock.controller';
import { PhysicalStockService } from './physical-stock.service';
@Module({imports:[DatabaseModule,StockModule],controllers:[PhysicalStockController],providers:[PhysicalStockService]})
export class PhysicalStockModule {}
