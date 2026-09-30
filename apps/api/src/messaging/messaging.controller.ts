import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { MessagingService } from './messaging.service';
@Controller('messaging') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN','MANAGER') export class MessagingController {constructor(private svc:MessagingService){}
 @Post('customers/:id/consent') consent(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.updateConsent(r.user,id,b)}
 @Get('customers/:id/history') history(@Req()r:any,@Param('id')id:string){return this.svc.history(r.user,id)}
 @Post('customers/:id/send') send(@Req()r:any,@Param('id')id:string,@Body()b:any){return this.svc.send(r.user,id,b)}
 @Post('bulk/preview') preview(@Req()r:any,@Body()b:any){return this.svc.previewBulk(r.user,b)}
 @Get('campaigns') campaigns(@Req()r:any){return this.svc.listCampaigns(r.user)}
 @Post('campaigns') campaign(@Req()r:any,@Body()b:any){return this.svc.createCampaign(r.user,b)}
 @Post('campaigns/:id/confirm-send') confirm(@Req()r:any,@Param('id')id:string){return this.svc.confirmCampaign(r.user,id)}
}
