import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { Roles } from '../auth/roles.decorator'; import { RolesGuard } from '../auth/roles.guard'; import { ProductsService } from './products.service';
@Controller('products') @UseGuards(JwtAuthGuard,RolesGuard)
export class ProductsController { constructor(private svc:ProductsService){} @Get() list(@Query('includeInactive') all?:string){return this.svc.list(all!=='true')} @Post() @Roles('ADMIN') create(@Body() b:any){return this.svc.create(b)} @Patch(':id') @Roles('ADMIN') update(@Param('id') id:string,@Body() b:any){return this.svc.update(id,b)} }
