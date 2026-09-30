import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';
@Controller('sync') @UseGuards(JwtAuthGuard)
export class SyncController {
 constructor(private readonly sync:SyncService){}
 @Post('transactions')
 submit(@Body() body:any,@Req() req:any,@Headers('x-device-id') deviceId:string,@Headers('x-device-token') deviceToken:string){
  return this.sync.accept(body,req.user,deviceId,deviceToken);
 }
}
