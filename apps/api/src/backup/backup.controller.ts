import { Body,Controller,Get,Param,Post,Req,UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { BackupService } from './backup.service';
@Controller('backups') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN') export class BackupController{
 constructor(private svc:BackupService){}
 @Get() list(){return this.svc.list()}
 @Post('now') backup(@Req()r:any){return this.svc.create('MANUAL',r.user.sub)}
 @Post(':id/restore') restore(@Param('id')id:string,@Body()b:any,@Req()r:any){return this.svc.restore(id,b?.confirmation,r.user.sub)}
}
