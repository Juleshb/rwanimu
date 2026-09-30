import { Module } from '@nestjs/common'; import { DatabaseModule } from '../database/database.module'; import { LocationsController, StockController } from './stock.controller'; import { StockService } from './stock.service';
@Module({imports:[DatabaseModule],controllers:[StockController,LocationsController],providers:[StockService],exports:[StockService]}) export class StockModule {}
