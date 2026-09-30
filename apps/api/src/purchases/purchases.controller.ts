import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { PurchasesService } from './purchases.service';
@Controller('purchases') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN') export class PurchasesController { constructor(private svc:PurchasesService){}
 @Post('suppliers') supplier(@Body() b:any){return this.svc.createSupplier(b)} @Get('suppliers') suppliers(){return this.svc.suppliers()} @Patch('suppliers/:id') updateSupplier(@Param('id') id:string,@Body() b:any){return this.svc.updateSupplier(id,b)}
 @Post() create(@Req() r:any,@Body() b:any){return this.svc.createPurchase(r.user,b)} @Get() list(){return this.svc.listPurchases()}
 @Post('suppliers/:supplierId/payments') pay(@Req() r:any,@Param('supplierId') id:string,@Body() b:any){return this.svc.paySupplier(r.user,id,b.amount)}
 @Get('suppliers/:supplierId/account') account(@Param('supplierId') id:string){return this.svc.supplierAccount(id)} }
