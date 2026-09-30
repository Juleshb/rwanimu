import { Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExpensesService } from './expenses.service';
@Controller('expenses')
@UseGuards(JwtAuthGuard,RolesGuard)
export class ExpensesController {
 constructor(private svc:ExpensesService){}
 @Post() @Roles('ADMIN','MANAGER','BRANCH_USER') create(@Req()r:any,@Body()b:any){return this.svc.create(r.user,b)}
 @Get() @Roles('ADMIN','MANAGER','BRANCH_USER') list(@Req()r:any,@Query()q:any){return this.svc.list(r.user,q)}
 @Patch(':id') @Roles('ADMIN') update(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.update(r.user,id,b)}
 @Delete(':id') @Roles('ADMIN') remove(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.remove(r.user,id,b?.reason)}
}
