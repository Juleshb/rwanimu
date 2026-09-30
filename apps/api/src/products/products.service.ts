import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class ProductsService {
  constructor(private db:DatabaseService){}
  async list(activeOnly=true){ return (await this.db.query('SELECT id,name,selling_price,active,created_at,updated_at FROM products '+(activeOnly?'WHERE active=true ':'')+'ORDER BY name')).rows; }
  async create(input:{name:string;sellingPrice?:number}){
    const name=(input.name||'').trim(); if(!name) throw new BadRequestException('Product name is required');
    const price=Number(input.sellingPrice??0); if(!Number.isFinite(price)||price<0) throw new BadRequestException('Selling price must be zero or greater');
    try { return (await this.db.query('INSERT INTO products(name,selling_price) VALUES($1,$2) RETURNING *',[name,price])).rows[0]; }
    catch(e:any){ if(e?.code==='23505') throw new BadRequestException('A product with this name already exists'); throw e; }
  }
  async update(id:string,input:{name?:string;sellingPrice?:number;active?:boolean}){
    const current=(await this.db.query<any>('SELECT * FROM products WHERE id=$1',[id])).rows[0]; if(!current) throw new NotFoundException('Product not found');
    const name=input.name===undefined?current.name:String(input.name).trim(); if(!name) throw new BadRequestException('Product name is required');
    const price=input.sellingPrice===undefined?Number(current.selling_price):Number(input.sellingPrice); if(!Number.isFinite(price)||price<0) throw new BadRequestException('Invalid selling price');
    return (await this.db.query('UPDATE products SET name=$2,selling_price=$3,active=$4,updated_at=now() WHERE id=$1 RETURNING *',[id,name,price,input.active??current.active])).rows[0];
  }
}
