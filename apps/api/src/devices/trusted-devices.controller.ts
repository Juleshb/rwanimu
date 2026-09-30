import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrustedDevicesService } from './trusted-devices.service';
@Controller('trusted-devices') @UseGuards(JwtAuthGuard)
export class TrustedDevicesController { constructor(private s:TrustedDevicesService){}
 @Get() list(@Req() req:any){ return this.s.list(req.user); }
 @Post() register(@Req() req:any,@Body() body:any){ return this.s.register(req.user,body); }
 @Post(':id/revoke') revoke(@Req() req:any,@Param('id') id:string){ return this.s.revoke(req.user,id); }
 @Post('offline/authorize') authorize(@Req() req:any,@Body() b:any){ return this.s.authorizeOffline(req.user,b.deviceId,b.deviceToken); }
}
