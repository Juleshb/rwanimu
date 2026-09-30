import { Controller,Get,Query,Req,UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { ReportsService } from './reports.service';
@Controller('reports') @UseGuards(JwtAuthGuard,RolesGuard) export class ReportsController{
 constructor(private svc:ReportsService){}
 @Get('dashboard') @Roles('ADMIN','MANAGER','STOREKEEPER','BRANCH_USER') dashboard(@Req()r:any,@Query('locationId')l?:string){return this.svc.dashboard(r.user,l)}
 @Get('sales') @Roles('ADMIN','MANAGER','BRANCH_USER') sales(@Req()r:any,@Query()q:any){return this.svc.sales(r.user,q)}
 @Get('financial') @Roles('ADMIN') financial(@Req()r:any,@Query()q:any){return this.svc.financial(r.user,q)}
 @Get('expenses') @Roles('ADMIN','MANAGER','BRANCH_USER') expenses(@Req()r:any,@Query()q:any){return this.svc.expenses(r.user,q)}
 @Get('physical-counts') @Roles('ADMIN','STOREKEEPER') physical(@Req()r:any,@Query()q:any){return this.svc.physicalCounts(r.user,q)}
}
