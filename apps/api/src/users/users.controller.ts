import { Body,Controller,Get,Param,Patch,Post,Req,UseGuards } from '@nestjs/common'; import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { UsersService } from './users.service';
@Controller('users') @UseGuards(JwtAuthGuard,RolesGuard) export class UsersController { constructor(private users:UsersService){}
 @Get() @Roles('ADMIN') list(){return this.users.list();}
 @Post() @Roles('ADMIN') create(@Req() r:any,@Body() b:any){return this.users.create(r.user.sub,b);}
 @Patch(':id') @Roles('ADMIN') update(@Req() r:any,@Param('id') id:string,@Body() b:any){return this.users.update(r.user.sub,id,b);}
 @Patch(':id/status') @Roles('ADMIN') status(@Req() r:any,@Param('id') id:string,@Body() b:{active:boolean}){return this.users.setActive(r.user.sub,id,!!b.active);}
 @Post(':id/reset-password') @Roles('ADMIN') reset(@Req() r:any,@Param('id') id:string,@Body() b:{newPassword:string}){return this.users.resetPassword(r.user.sub,id,b.newPassword);}
 @Post('me/change-password') change(@Req() r:any,@Body() b:{oldPassword:string;newPassword:string}){return this.users.changeOwnPassword(r.user.sub,b.oldPassword,b.newPassword);}
}
