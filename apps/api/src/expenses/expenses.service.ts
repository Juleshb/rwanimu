import { BadRequestException,ForbiddenException,Injectable,NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../auth/auth.types';
@Injectable()
export class ExpensesService {
 constructor(private db:DatabaseService){}
 private amount(v:any){const n=Number(v);if(!Number.isFinite(n)||n<=0)throw new BadRequestException('Amount must be greater than zero');return n;}
 private description(v:any){const s=String(v??'').trim();if(!s)throw new BadRequestException('Description/Reason is required');if(s.length>300)throw new BadRequestException('Description/Reason is too long');return s;}
 private expenseDate(v:any){if(v===undefined||v===null||v==='')return null;const s=String(v).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new BadRequestException('Expense date is invalid');return s;}
 private async mainShopId(){const r=await this.db.query<any>("SELECT id FROM locations WHERE type='MAIN_SHOP' AND active=true ORDER BY created_at LIMIT 1");if(!r.rowCount)throw new BadRequestException('Main Shop is not configured');return r.rows[0].id;}
 private async permittedLocation(u:AuthUser,requested?:string){
  if(u.role==='BRANCH_USER'){if(!u.locationId)throw new ForbiddenException('Branch scope is missing');return u.locationId;}
  if(u.role==='MANAGER')return this.mainShopId();
  if(u.role==='ADMIN'){
   const id=requested||await this.mainShopId();const r=await this.db.query('SELECT 1 FROM locations WHERE id=$1 AND active=true',[id]);if(!r.rowCount)throw new BadRequestException('Valid active location is required');return id;
  }
  throw new ForbiddenException();
 }
 async create(u:AuthUser,b:any){const locationId=await this.permittedLocation(u,b.locationId);const description=this.description(b.description);const amount=this.amount(b.amount);const expenseDate=this.expenseDate(b.expenseDate);return this.db.transaction(async c=>{const r=await c.query<any>(expenseDate?`INSERT INTO expenses(location_id,description,amount,expense_date,created_by) VALUES($1,$2,$3,$4,$5) RETURNING id,location_id,description,amount,expense_date,created_at`:`INSERT INTO expenses(location_id,description,amount,created_by) VALUES($1,$2,$3,$4) RETURNING id,location_id,description,amount,expense_date,created_at`,expenseDate?[locationId,description,amount,expenseDate,u.sub]:[locationId,description,amount,u.sub]);await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata) VALUES($1,'EXPENSE_CREATED','EXPENSE',$2,$3,$4::jsonb)`,[u.sub,r.rows[0].id,locationId,JSON.stringify({description,amount})]);return r.rows[0];});}
 async list(u:AuthUser,q:any){const p:any[]=[];let w='WHERE e.deleted_at IS NULL';
  if(u.role==='BRANCH_USER'){p.push(u.locationId);w+=` AND e.location_id=$${p.length}`;}
  else if(u.role==='MANAGER'){p.push(await this.mainShopId());w+=` AND e.location_id=$${p.length}`;}
  else if(u.role==='ADMIN'&&q.locationId){p.push(q.locationId);w+=` AND e.location_id=$${p.length}`;}
  if(q.from){p.push(q.from);w+=` AND e.expense_date >= $${p.length}::date`;}
  if(q.to){p.push(q.to);w+=` AND e.expense_date <= $${p.length}::date`;}
  if(q.userId){p.push(q.userId);w+=` AND e.created_by=$${p.length}`;}
  const r=await this.db.query<any>(`SELECT e.id,e.location_id,l.name location,e.description,e.amount,e.expense_date,e.created_at,u.full_name created_by FROM expenses e JOIN locations l ON l.id=e.location_id JOIN users u ON u.id=e.created_by ${w} ORDER BY e.expense_date DESC,e.created_at DESC`,p);return r.rows;
 }
 async update(u:AuthUser,id:string,b:any){const old=await this.db.query<any>('SELECT * FROM expenses WHERE id=$1 AND deleted_at IS NULL',[id]);if(!old.rowCount)throw new NotFoundException('Expense not found');const description=b.description===undefined?old.rows[0].description:this.description(b.description);const amount=b.amount===undefined?Number(old.rows[0].amount):this.amount(b.amount);const locationId=b.locationId===undefined?old.rows[0].location_id:await this.permittedLocation(u,b.locationId);const expenseDate=b.expenseDate===undefined?String(old.rows[0].expense_date).slice(0,10):this.expenseDate(b.expenseDate);if(!expenseDate)throw new BadRequestException('Expense date is required');return this.db.transaction(async c=>{const r=await c.query<any>('UPDATE expenses SET description=$2,amount=$3,location_id=$4,expense_date=$5,updated_by=$6,updated_at=now() WHERE id=$1 RETURNING id,location_id,description,amount,expense_date,updated_at',[id,description,amount,locationId,expenseDate,u.sub]);await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata) VALUES($1,'EXPENSE_UPDATED','EXPENSE',$2,$3,$4::jsonb)`,[u.sub,id,locationId,JSON.stringify({before:{locationId:old.rows[0].location_id,description:old.rows[0].description,amount:Number(old.rows[0].amount)},after:{locationId,description,amount}})]);return r.rows[0];});}
 async remove(u:AuthUser,id:string,reason?:string){const why=String(reason??'').trim();if(!why)throw new BadRequestException('Delete reason is required');return this.db.transaction(async c=>{const old=await c.query<any>('SELECT * FROM expenses WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id]);if(!old.rowCount)throw new NotFoundException('Expense not found');const r=await c.query<any>('UPDATE expenses SET deleted_at=now(),deleted_by=$2,delete_reason=$3 WHERE id=$1 RETURNING id,deleted_at',[id,u.sub,why]);await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata) VALUES($1,'EXPENSE_DELETED','EXPENSE',$2,$3,$4::jsonb)`,[u.sub,id,old.rows[0].location_id,JSON.stringify({reason:why,description:old.rows[0].description,amount:Number(old.rows[0].amount)})]);return {...r.rows[0],deleted:true};});}
}
