import { Injectable,NotFoundException } from '@nestjs/common'; import { DatabaseService } from '../database/database.service';
@Injectable() export class MonitoringService{
 constructor(private db:DatabaseService){}
 async healthSummary(){
  const q=await this.db.query(`SELECT
   (SELECT count(*)::int FROM sync_conflicts WHERE resolved_at IS NULL) open_sync_conflicts,
   (SELECT count(*)::int FROM sync_transactions WHERE status='NEEDS_REVIEW') sync_needs_review,
   (SELECT count(*)::int FROM sync_transactions WHERE status='REJECTED' AND received_at>now()-interval '24 hours') rejected_sync_24h,
   (SELECT count(*)::int FROM backup_runs WHERE status='FAILED' AND started_at>now()-interval '7 days') backup_failures_7d,
   (SELECT count(*)::int FROM trusted_devices WHERE active=true AND (last_seen_at IS NULL OR last_seen_at<now()-interval '7 days')) trusted_devices_attention,
   (SELECT count(*)::int FROM system_incidents WHERE status<>'RESOLVED') open_incidents`);
  return q.rows[0];
 }
 async incidents(status?:string){const p:any[]=[]; let where=''; if(status){p.push(status);where='WHERE status=$1'} return (await this.db.query(`SELECT id,incident_type,severity,title,safe_message,entity_type,entity_id,location_id,status,created_at,acknowledged_at,resolved_at FROM system_incidents ${where} ORDER BY CASE severity WHEN 'CRITICAL' THEN 0 ELSE 1 END,created_at DESC LIMIT 200`,p)).rows}
 async audit(q:any){const p:any[]=[]; const w:string[]=[]; if(q.action){p.push(q.action);w.push(`a.action=$${p.length}`)} if(q.userId){p.push(q.userId);w.push(`a.actor_user_id=$${p.length}`)} if(q.locationId){p.push(q.locationId);w.push(`a.location_id=$${p.length}`)} return (await this.db.query(`SELECT a.id,a.actor_user_id,u.username,a.action,a.entity_type,a.entity_id,a.location_id,a.severity,a.metadata,a.created_at FROM audit_events a LEFT JOIN users u ON u.id=a.actor_user_id ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY a.created_at DESC LIMIT 300`,p)).rows}
 async acknowledge(id:string,userId:string){const r=await this.db.query(`UPDATE system_incidents SET status='ACKNOWLEDGED',acknowledged_at=now(),acknowledged_by=$2 WHERE id=$1 AND status='OPEN' RETURNING id,status`,[id,userId]); if(!r.rowCount)throw new NotFoundException('Open incident not found'); return r.rows[0]}
 async resolve(id:string,userId:string){const r=await this.db.query(`UPDATE system_incidents SET status='RESOLVED',resolved_at=now(),resolved_by=$2 WHERE id=$1 AND status<>'RESOLVED' RETURNING id,status`,[id,userId]); if(!r.rowCount)throw new NotFoundException('Active incident not found'); return r.rows[0]}
 async recordIncident(v:{incidentType:string;severity:'WARNING'|'CRITICAL';title:string;safeMessage:string;technicalDetails?:string;entityType?:string;entityId?:string;locationId?:string}){await this.db.query(`INSERT INTO system_incidents(incident_type,severity,title,safe_message,technical_details,entity_type,entity_id,location_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[v.incidentType,v.severity,v.title,v.safeMessage,v.technicalDetails||null,v.entityType||null,v.entityId||null,v.locationId||null])}
}
