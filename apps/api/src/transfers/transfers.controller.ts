import { Body,Controller,Get,Param,Post,Query,Req,UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { TransfersService } from './transfers.service';
@Controller('transfers') @UseGuards(JwtAuthGuard,RolesGuard) export class TransfersController{constructor(private svc:TransfersService){}
 @Post('requests') @Roles('ADMIN','BRANCH_USER') request(@Req()r:any,@Body()b:any){return this.svc.request(r.user,b)}
 @Get() @Roles('ADMIN','MANAGER','BRANCH_USER') list(@Req()r:any,@Query('status')s?:string){return this.svc.list(r.user,s)}
 @Post(':id/approve') @Roles('ADMIN') approve(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.approve(r.user,id,b)}
 @Post(':id/reject') @Roles('ADMIN') reject(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.reject(r.user,id,b?.reason)}
 @Post(':id/dispatch') @Roles('ADMIN') dispatch(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.dispatch(r.user,id,b)}
 @Get(':id/delivery-note') @Roles('ADMIN','MANAGER','BRANCH_USER') note(@Req()r:any,@Param('id')id:string){return this.svc.deliveryNote(r.user,id)}
 @Post(':id/receive') @Roles('BRANCH_USER') receive(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.receive(r.user,id,b)}
}
