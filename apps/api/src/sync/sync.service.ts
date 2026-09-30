import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';

const ALLOWED = new Set(['SALE','CUSTOMER_UPSERT','DEBT_PAYMENT','BRANCH_STOCK_REQUEST','EXPENSE']);
type Outcome = {status:'SYNCED'|'NEEDS_REVIEW'|'REJECTED'; serverReference?:string; message:string; duplicate?:boolean};

@Injectable()
export class SyncService {
  constructor(private readonly db: DatabaseService) {}

  async accept(input:any, authUser:any, deviceId:string, deviceToken:string): Promise<Outcome> {
    this.validateEnvelope(input);
    if (!deviceId || !deviceToken) return {status:'REJECTED', message:'Trusted device credentials are required'};
    if (String(input.deviceId) !== String(deviceId)) return {status:'REJECTED', message:'Device mismatch'};
    if (input.userId !== authUser.sub) return {status:'REJECTED', message:'User mismatch'};

    const existing = await this.db.query(
      'SELECT status,server_reference,reason FROM sync_transactions WHERE client_transaction_id=$1', [input.id]);
    if (existing.rowCount) return {status:existing.rows[0].status, serverReference:existing.rows[0].server_reference,
      message:existing.rows[0].reason || 'Already processed', duplicate:true};

    return this.db.transaction(async c => {
      // Serialize retries of the same client UUID inside PostgreSQL as an extra idempotency barrier.
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [String(input.id)]);
      const replay = await c.query('SELECT status,server_reference,reason FROM sync_transactions WHERE client_transaction_id=$1', [input.id]);
      if (replay.rowCount) return {status:replay.rows[0].status, serverReference:replay.rows[0].server_reference,
        message:replay.rows[0].reason || 'Already processed', duplicate:true} as Outcome;

      const dev = await c.query(`SELECT td.id,td.location_id,td.active,u.active AS user_active,du.active AS user_authorized,
        u.role,u.location_id AS user_location
        FROM trusted_devices td
        JOIN trusted_device_users du ON du.device_id=td.id AND du.user_id=$2
        JOIN users u ON u.id=du.user_id
        WHERE td.device_id=$1 AND td.token_hash=$3 FOR UPDATE OF td`, [deviceId, authUser.sub, createHash('sha256').update(deviceToken).digest('hex')]);
      const d = dev.rows[0];
      if (!d?.active || !d.user_active || !d.user_authorized)
        return this.finish(c,input,d?.id || null,authUser.sub,'REJECTED','DEVICE_OR_USER_NOT_AUTHORIZED','Device or user is not authorized');
      if (String(d.location_id) !== String(input.locationId))
        return this.finish(c,input,d.id,authUser.sub,'REJECTED','LOCATION_MISMATCH','Location mismatch');
      if (['BRANCH_USER','STOREKEEPER'].includes(d.role) && String(d.user_location) !== String(d.location_id))
        return this.finish(c,input,d.id,authUser.sub,'REJECTED','USER_SCOPE_MISMATCH','User scope mismatch');
      const roleError = this.validateRoleForOperation(d.role,input.operation);
      if (roleError) return this.finish(c,input,d.id,authUser.sub,'REJECTED','ROLE_NOT_ALLOWED',roleError);

      try {
        const ref = input.operation === 'SALE'
          ? await this.reconcileSale(c,input,authUser.sub)
          : await this.reconcileEvent(c,input,authUser.sub,d.role);
        await c.query(`INSERT INTO sync_transactions(client_transaction_id,operation,device_id,user_id,location_id,occurred_at,payload,status,server_reference,reason)
          VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,'SYNCED',$8,'Accepted by server reconciliation')`,
          [input.id,input.operation,d.id,authUser.sub,input.locationId,input.occurredAt,JSON.stringify(input.payload),ref]);
        await c.query('UPDATE trusted_devices SET last_sync_at=now(),last_seen_at=now() WHERE id=$1',[d.id]);
        await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata)
          VALUES($1,'OFFLINE_TRANSACTION_SYNCED','SYNC_TRANSACTION',NULL,$2,$3::jsonb)`,
          [authUser.sub,input.locationId,JSON.stringify({clientTransactionId:input.id,operation:input.operation,serverReference:ref})]);
        return {status:'SYNCED',serverReference:ref,message:'Synced successfully'};
      } catch (e:any) {
        if (e instanceof ReconciliationConflict)
          return this.finish(c,input,d.id,authUser.sub,'NEEDS_REVIEW',e.code,e.message);
        throw e;
      }
    });
  }


  private validateRoleForOperation(role:string, operation:string): string | null {
    const allowed:Record<string,string[]> = {
      SALE:['ADMIN','MANAGER','BRANCH_USER'],
      CUSTOMER_UPSERT:['ADMIN','MANAGER','BRANCH_USER'],
      DEBT_PAYMENT:['ADMIN','MANAGER','BRANCH_USER'],
      BRANCH_STOCK_REQUEST:['BRANCH_USER'],
      EXPENSE:['ADMIN','MANAGER','BRANCH_USER']
    };
    return (allowed[operation] || []).includes(role) ? null : `Role ${role} cannot sync ${operation}`;
  }

  private validateEnvelope(input:any) {
    if (!input?.id || !ALLOWED.has(input.operation)) throw new BadRequestException('Unsupported offline transaction');
    if (!input.userId || !input.locationId || !input.occurredAt || !input.payload) throw new BadRequestException('Incomplete offline transaction');
    if (Number.isNaN(Date.parse(input.occurredAt))) throw new BadRequestException('Invalid transaction time');
  }

  private async reconcileSale(c:PoolClient,input:any,userId:string):Promise<string> {
    const items = input.payload?.items;
    if (!Array.isArray(items) || items.length === 0) throw new ReconciliationConflict('INVALID_SALE','Sale has no items');
    const normalized = new Map<string,number>();
    for (const x of items) {
      const productId=String(x?.productId || ''); const qty=Number(x?.quantity);
      if (!productId || !Number.isFinite(qty) || qty <= 0) throw new ReconciliationConflict('INVALID_SALE_ITEM','Sale contains an invalid item');
      normalized.set(productId,(normalized.get(productId)||0)+qty);
    }
    // Lock stock rows in stable product-id order to reduce deadlocks when devices reconnect together.
    for (const [productId,qty] of [...normalized.entries()].sort(([a],[b])=>a.localeCompare(b))) {
      const stock=await c.query(`SELECT ib.quantity,p.active FROM inventory_balances ib JOIN products p ON p.id=ib.product_id
        WHERE ib.location_id=$1 AND ib.product_id=$2 FOR UPDATE OF ib`,[input.locationId,productId]);
      if (!stock.rowCount || !stock.rows[0].active) throw new ReconciliationConflict('PRODUCT_OR_STOCK_NOT_FOUND',`Product ${productId} is unavailable at this location`);
      if (Number(stock.rows[0].quantity) < qty) throw new ReconciliationConflict('INSUFFICIENT_STOCK',`Insufficient central stock for product ${productId}`);
    }
    const sale=await c.query(`INSERT INTO offline_sales_staging(client_transaction_id,location_id,user_id,occurred_at,payload)
      VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id`,[input.id,input.locationId,userId,input.occurredAt,JSON.stringify(input.payload)]);
    for (const [productId,qty] of normalized.entries()) {
      await c.query(`UPDATE inventory_balances SET quantity=quantity-$3,updated_at=now() WHERE location_id=$1 AND product_id=$2`,[input.locationId,productId,qty]);
      await c.query(`INSERT INTO inventory_movements(client_transaction_id,location_id,product_id,movement_type,quantity_delta)
        VALUES($1,$2,$3,'OFFLINE_SALE',$4)`,[input.id,input.locationId,productId,-qty]);
    }
    return `offline-sale:${sale.rows[0].id}`;
  }

  private async reconcileEvent(c:PoolClient,input:any,userId:string,role:string):Promise<string> {
    this.validateNonSale(input.operation,input.payload);
    if (input.operation === 'EXPENSE') {
      if (!['ADMIN','MANAGER','BRANCH_USER'].includes(role)) throw new ReconciliationConflict('ROLE_NOT_ALLOWED','This role cannot create expenses');
      const description=String(input.payload.description??'').trim(); const amount=Number(input.payload.amount);
      if (!description || description.length>300) throw new ReconciliationConflict('INVALID_EXPENSE','Expense description is invalid');
      const e=await c.query(`INSERT INTO expenses(location_id,description,amount,created_by,expense_date) VALUES($1,$2,$3,$4,$5::timestamptz::date) RETURNING id`,[input.locationId,description,amount,userId,input.occurredAt]);
      await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata) VALUES($1,'EXPENSE_CREATED_OFFLINE','EXPENSE',$2,$3,$4::jsonb)`,[userId,e.rows[0].id,input.locationId,JSON.stringify({clientTransactionId:input.id,description,amount})]);
      return `expense:${e.rows[0].id}`;
    }
    const r=await c.query(`INSERT INTO offline_business_events(client_transaction_id,operation,location_id,user_id,occurred_at,payload)
      VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id`,[input.id,input.operation,input.locationId,userId,input.occurredAt,JSON.stringify(input.payload)]);
    return `offline-event:${r.rows[0].id}`;
  }

  private validateNonSale(operation:string,p:any) {
    const required:Record<string,string[]>={CUSTOMER_UPSERT:['name'],DEBT_PAYMENT:['customerId','amount'],BRANCH_STOCK_REQUEST:['items'],EXPENSE:['description','amount']};
    for (const key of required[operation] || []) if (p?.[key] === undefined || p?.[key] === null || p?.[key] === '')
      throw new ReconciliationConflict('INVALID_PAYLOAD',`${operation} is missing ${key}`);
    if ((operation==='DEBT_PAYMENT'||operation==='EXPENSE') && (!Number.isFinite(Number(p.amount)) || Number(p.amount)<=0))
      throw new ReconciliationConflict('INVALID_AMOUNT',`${operation} amount must be greater than zero`);
    if (operation==='BRANCH_STOCK_REQUEST' && (!Array.isArray(p.items)||!p.items.length))
      throw new ReconciliationConflict('INVALID_REQUEST','Stock request has no items');
  }

  private async finish(c:PoolClient,input:any,deviceDbId:string|null,userId:string,status:'NEEDS_REVIEW'|'REJECTED',code:string,reason:string):Promise<Outcome> {
    if (!deviceDbId) return {status,message:reason};
    await c.query(`INSERT INTO sync_transactions(client_transaction_id,operation,device_id,user_id,location_id,occurred_at,payload,status,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) ON CONFLICT(client_transaction_id) DO NOTHING`,
      [input.id,input.operation,deviceDbId,userId,input.locationId,input.occurredAt,JSON.stringify(input.payload),status,reason]);
    if (status==='NEEDS_REVIEW') await c.query(`INSERT INTO sync_conflicts(client_transaction_id,device_id,user_id,location_id,operation,reason_code,reason,payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT(client_transaction_id) DO NOTHING`,
      [input.id,deviceDbId,userId,input.locationId,input.operation,code,reason,JSON.stringify(input.payload)]);
    await c.query(`INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata)
      VALUES($1,$2,'SYNC_TRANSACTION',NULL,$3,$4::jsonb)`,[userId,status==='REJECTED'?'OFFLINE_TRANSACTION_REJECTED':'OFFLINE_TRANSACTION_NEEDS_REVIEW',input.locationId,JSON.stringify({clientTransactionId:input.id,operation:input.operation,reasonCode:code,reason})]);
    return {status,message:reason};
  }
}

class ReconciliationConflict extends Error { constructor(public readonly code:string,message:string){super(message);} }
