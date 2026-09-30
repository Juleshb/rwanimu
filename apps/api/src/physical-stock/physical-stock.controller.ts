import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { PhysicalStockService } from './physical-stock.service';
@Controller('physical-stock') @UseGuards(JwtAuthGuard,RolesGuard)
export class PhysicalStockController {
 constructor(private svc:PhysicalStockService){}
 @Post('daily') @Roles('STOREKEEPER') start(@Req() r:any){return this.svc.startDaily(r.user)}
 @Get('daily') @Roles('STOREKEEPER') daily(@Req() r:any){return this.svc.getDailyForStorekeeper(r.user)}
 @Patch('daily/items/:productId') @Roles('STOREKEEPER') item(@Req() r:any,@Param('productId') productId:string,@Body() b:any){return this.svc.savePhysicalQuantity(r.user,productId,b.physicalQuantity)}
 @Post('daily/complete') @Roles('STOREKEEPER') complete(@Req() r:any){return this.svc.completeDaily(r.user)}
 @Get('admin/:countId') @Roles('ADMIN') admin(@Req() r:any,@Param('countId') id:string){return this.svc.adminDetail(r.user,id)}
 @Post('admin/:countId/adjust/:productId') @Roles('ADMIN') adjust(@Req() r:any,@Param('countId') countId:string,@Param('productId') productId:string,@Body() b:any){return this.svc.adjust(r.user,countId,productId,b.reason)}
}
