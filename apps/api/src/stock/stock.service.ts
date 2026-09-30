import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service'; import { AuthUser } from '../auth/auth.types'; import { enforceLocationScope } from '../common/location-scope';
export type MovementType='PURCHASE_IN'|'SALE_OUT'|'TRANSFER_OUT'|'TRANSFER_IN'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT';
@Injectable()
export class StockService {
  constructor(private db:DatabaseService){}
  status(q:number){ return q===0?'OUT_OF_STOCK':q<=50?'LOW_STOCK':'IN_STOCK'; }
  async list(user:AuthUser,locationId?:string){ const loc=user.role==='ADMIN'?(locationId||null):user.locationId; if(user.role!=='ADMIN') enforceLocationScope(user,loc); const params:any[]=[]; let where='WHERE p.active=true AND l.active=true'; if(loc){params.push(loc);where+=' AND l.id=$1';}
    const r=await this.db.query<any>(`SELECT p.id product_id,p.name,p.selling_price,l.id location_id,l.name location_name,COALESCE(s.quantity,0) quantity FROM products p CROSS JOIN locations l LEFT JOIN stock_balances s ON s.product_id=p.id AND s.location_id=l.id ${where} ORDER BY l.name,p.name`,params);
    return r.rows.map(x=>({...x,quantity:Number(x.quantity),stock_status:this.status(Number(x.quantity))})); }
  async movements(user:AuthUser,locationId?:string){ const loc=user.role==='ADMIN'?(locationId||null):user.locationId; if(user.role!=='ADMIN') enforceLocationScope(user,loc); const p:any[]=[]; const w=loc?(p.push(loc),'WHERE m.location_id=$1'):''; return (await this.db.query(`SELECT m.*,p.name product_name,l.name location_name FROM stock_movements m JOIN products p ON p.id=m.product_id JOIN locations l ON l.id=m.location_id ${w} ORDER BY m.created_at DESC LIMIT 500`,p)).rows; }
  async apply(user:AuthUser,input:{productId:string;locationId:string;movementType:MovementType;quantity:number;sourceType:string;sourceId:string;reason?:string}){
    enforceLocationScope(user,input.locationId); const q=Number(input.quantity); if(!Number.isFinite(q)||q<=0) throw new BadRequestException('Quantity must be greater than zero');
    const incoming=['PURCHASE_IN','TRANSFER_IN','ADJUSTMENT_IN'].includes(input.movementType); const outgoing=['SALE_OUT','TRANSFER_OUT','ADJUSTMENT_OUT'].includes(input.movementType); if(!incoming&&!outgoing) throw new BadRequestException('Invalid movement type');
    return this.db.transaction(async c=>{ const exists=await c.query('SELECT id FROM products WHERE id=$1 AND active=true',[input.productId]); if(!exists.rowCount) throw new NotFoundException('Product not found'); await c.query('INSERT INTO stock_balances(product_id,location_id,quantity) VALUES($1,$2,0) ON CONFLICT DO NOTHING',[input.productId,input.locationId]); const b=await c.query<any>('SELECT quantity FROM stock_balances WHERE product_id=$1 AND location_id=$2 FOR UPDATE',[input.productId,input.locationId]); const before=Number(b.rows[0].quantity); const after=incoming?before+q:before-q; if(after<0) throw new ConflictException('Insufficient stock. Negative stock is not allowed');
      try { const mv=await c.query<any>(`INSERT INTO stock_movements(product_id,location_id,movement_type,quantity,quantity_before,quantity_after,source_type,source_id,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[input.productId,input.locationId,input.movementType,q,before,after,input.sourceType,input.sourceId,input.reason||null,user.sub]); await c.query('UPDATE stock_balances SET quantity=$3,updated_at=now() WHERE product_id=$1 AND location_id=$2',[input.productId,input.locationId,after]); return {...mv.rows[0],stock_status:this.status(after)}; }
      catch(e:any){ if(e?.code==='23505') throw new ConflictException('This source transaction has already changed stock'); throw e; }
    }); }
}
