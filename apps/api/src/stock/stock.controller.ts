import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { StockService } from './stock.service';
import { DatabaseService } from '../database/database.service';

@Controller('stock') @UseGuards(JwtAuthGuard,RolesGuard)
export class StockController {
  constructor(private svc:StockService){}
  @Get() @Roles('ADMIN','MANAGER','BRANCH_USER') list(@Req() req:any,@Query('locationId') l?:string){return this.svc.list(req.user,l)}
  @Get('movements') @Roles('ADMIN','MANAGER','BRANCH_USER') movements(@Req() req:any,@Query('locationId') l?:string){return this.svc.movements(req.user,l)}
}

@Controller('locations') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN','MANAGER','STOREKEEPER','BRANCH_USER')
export class LocationsController {
  constructor(private db:DatabaseService){}
  @Get() list(){return this.db.query(`SELECT id,name,type,active FROM locations ORDER BY active DESC,type,name`).then(r=>r.rows)}
  @Patch(':id') @Roles('ADMIN') async update(@Param('id') id:string,@Body() b:any){
    const current=(await this.db.query<any>('SELECT * FROM locations WHERE id=$1',[id])).rows[0];
    if(!current) throw new NotFoundException('Location not found');
    const name=b.name===undefined?current.name:String(b.name||'').trim();
    if(!name) throw new BadRequestException('Location name is required');
    const active=b.active===undefined?current.active:!!b.active;
    if(current.type==='MAIN_SHOP'&&active===false) throw new BadRequestException('Main Shop cannot be deactivated');
    return (await this.db.query('UPDATE locations SET name=$2,active=$3 WHERE id=$1 RETURNING id,name,type,active',[id,name,active])).rows[0];
  }
  @Post() @Roles('ADMIN') async create(@Body() b:any){
    const name=String(b?.name||'').trim();
    if(!name) throw new BadRequestException('Location name is required');
    return (await this.db.query(`INSERT INTO locations(name,type) VALUES($1,'BRANCH') RETURNING id,name,type,active`,[name])).rows[0];
  }
}
