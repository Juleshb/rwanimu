import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { DeviceTokenService } from './device-token.service';
import { AuthUser } from '../auth/auth.types';
@Injectable()
export class TrustedDevicesService {
 constructor(private db:DatabaseService,private tokens:DeviceTokenService){}
 async register(actor:AuthUser,input:{deviceName:string;locationId:string;userIds:string[]}){
  if(actor.role!=='ADMIN') throw new ForbiddenException();
  if(!input.deviceName?.trim()||!input.locationId||!input.userIds?.length) throw new BadRequestException('Device name, location and authorized users are required');
  const deviceId=randomUUID(), issued=this.tokens.issue();
  return this.db.transaction(async c=>{
   const d=await c.query<any>('INSERT INTO trusted_devices(device_id,device_name,location_id,token_hash,registered_by) VALUES($1,$2,$3,$4,$5) RETURNING id,device_id,device_name,location_id,active,registered_at',[deviceId,input.deviceName.trim(),input.locationId,issued.hash,actor.sub]);
   for(const userId of [...new Set(input.userIds)]){
    const u=await c.query<any>('SELECT id,role,location_id,active FROM users WHERE id=$1',[userId]); const user=u.rows[0];
    if(!user?.active) throw new BadRequestException('Authorized user must be active');
    if((user.role==='BRANCH_USER'||user.role==='STOREKEEPER') && user.location_id!==input.locationId) throw new BadRequestException('Branch User location must match device location');
    await c.query('INSERT INTO trusted_device_users(device_id,user_id,authorized_by) VALUES($1,$2,$3)',[d.rows[0].id,userId,actor.sub]);
   }
   await c.query("INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id,metadata) VALUES($1,'TRUSTED_DEVICE_REGISTERED','TRUSTED_DEVICE',$2,$3,$4)",[actor.sub,d.rows[0].id,input.locationId,JSON.stringify({deviceName:input.deviceName,userCount:input.userIds.length})]);
   return {...d.rows[0],deviceToken:issued.token};
  });
 }
 async revoke(actor:AuthUser,id:string){
  if(actor.role!=='ADMIN') throw new ForbiddenException();
  await this.db.transaction(async c=>{ const r=await c.query<any>('UPDATE trusted_devices SET active=false,revoked_at=now(),revoked_by=$2 WHERE id=$1 AND active=true RETURNING id,location_id',[id,actor.sub]); if(!r.rows[0]) throw new BadRequestException('Trusted device not found or already revoked'); await c.query('UPDATE offline_authorizations SET revoked_at=now() WHERE device_id=$1 AND revoked_at IS NULL',[id]); await c.query("INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,location_id) VALUES($1,'TRUSTED_DEVICE_REVOKED','TRUSTED_DEVICE',$2,$3)",[actor.sub,id,r.rows[0].location_id]); });
  return {ok:true};
 }
 async authorizeOffline(user:AuthUser,deviceId:string,deviceToken:string){
  const tokenHash=this.tokens.hash(deviceToken||'');
  const r=await this.db.query<any>(`SELECT d.id,d.location_id,d.active,du.active AS user_authorized FROM trusted_devices d JOIN trusted_device_users du ON du.device_id=d.id AND du.user_id=$2 WHERE d.device_id=$1 AND d.token_hash=$3`,[deviceId,user.sub,tokenHash]); const d=r.rows[0];
  if(!d?.active||!d.user_authorized) throw new UnauthorizedException('This device is not authorized for offline use');
  if((user.role==='BRANCH_USER'||user.role==='STOREKEEPER')&&user.locationId!==d.location_id) throw new UnauthorizedException('User and device locations do not match');
  const offline=this.tokens.issue();
  await this.db.query(`INSERT INTO offline_authorizations(device_id,user_id,location_id,authorization_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '72 hours')`,[d.id,user.sub,d.location_id,offline.hash]);
  await this.db.query('UPDATE trusted_devices SET last_seen_at=now() WHERE id=$1',[d.id]);
  return {offlineAuthorization:offline.token,expiresInHours:72,deviceLocationId:d.location_id};
 }
 async verifyOffline(userId:string,deviceId:string,offlineAuthorization:string){
  const h=this.tokens.hash(offlineAuthorization||'');
  const r=await this.db.query<any>(`SELECT d.active,d.location_id,u.active AS user_active,du.active AS user_authorized,oa.expires_at,oa.revoked_at,u.role,u.location_id AS user_location FROM offline_authorizations oa JOIN trusted_devices d ON d.id=oa.device_id JOIN trusted_device_users du ON du.device_id=d.id AND du.user_id=oa.user_id JOIN users u ON u.id=oa.user_id WHERE d.device_id=$1 AND oa.user_id=$2 AND oa.authorization_hash=$3`,[deviceId,userId,h]); const x=r.rows[0];
  if(!x||!x.active||!x.user_active||!x.user_authorized||x.revoked_at||new Date(x.expires_at)<=new Date()) return {valid:false};
  if((x.role==='BRANCH_USER'||x.role==='STOREKEEPER')&&x.user_location!==x.location_id) return {valid:false};
  return {valid:true,locationId:x.location_id,expiresAt:x.expires_at};
 }
 async list(actor:AuthUser){ if(actor.role!=='ADMIN') throw new ForbiddenException(); const r=await this.db.query<any>(`SELECT d.id,d.device_id,d.device_name,d.location_id,d.active,d.registered_at,d.revoked_at,d.last_seen_at,d.last_sync_at,count(du.user_id) FILTER (WHERE du.active) AS authorized_users FROM trusted_devices d LEFT JOIN trusted_device_users du ON du.device_id=d.id GROUP BY d.id ORDER BY d.registered_at DESC`); return r.rows; }
}
