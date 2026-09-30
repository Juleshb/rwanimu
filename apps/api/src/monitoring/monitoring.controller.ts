import { Controller,Get,Patch,Param,Req,Query,UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { MonitoringService } from './monitoring.service';
@Controller('monitoring') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN') export class MonitoringController{
 constructor(private svc:MonitoringService){}
 @Get('health-summary') summary(){return this.svc.healthSummary()}
 @Get('incidents') incidents(@Query('status')status?:string){return this.svc.incidents(status)}
 @Get('audit') audit(@Query()q:any){return this.svc.audit(q)}
 @Patch('incidents/:id/acknowledge') acknowledge(@Param('id')id:string,@Req()r:any){return this.svc.acknowledge(id,r.user.sub)}
 @Patch('incidents/:id/resolve') resolve(@Param('id')id:string,@Req()r:any){return this.svc.resolve(id,r.user.sub)}
}
