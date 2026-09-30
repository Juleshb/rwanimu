import { BadRequestException,Injectable,NotFoundException } from '@nestjs/common'; import { DatabaseService } from '../database/database.service'; import { randomUUID,createHash } from 'crypto'; import { execFile } from 'child_process'; import { promisify } from 'util'; import { mkdir,readFile,copyFile,stat } from 'fs/promises'; import { join } from 'path';
const execFileAsync=promisify(execFile);
@Injectable() export class BackupService{
 constructor(private db:DatabaseService){}
 private dir(){return process.env.BACKUP_DIR||join(process.cwd(),'database','backups')}
 private second(){return process.env.BACKUP_SECOND_COPY_DIR||join(this.dir(),'second-copy')}
 async list(){return (await this.db.query(`SELECT id,backup_type,status,storage_key,second_copy_key,checksum_sha256,size_bytes,started_at,completed_at FROM backup_runs ORDER BY started_at DESC LIMIT 100`)).rows}
 async create(type:'DAILY'|'MANUAL'|'PRE_RESTORE',userId?:string){
  const id=randomUUID(); await mkdir(this.dir(),{recursive:true}); await mkdir(this.second(),{recursive:true}); const file=join(this.dir(),`${new Date().toISOString().replace(/[:.]/g,'-')}_${type}_${id}.dump`); const second=join(this.second(),file.split('/').pop()!);
  await this.db.query(`INSERT INTO backup_runs(id,backup_type,status,requested_by) VALUES($1,$2,'STARTED',$3)`,[id,type,userId||null]);
  try{await execFileAsync(process.env.PG_DUMP_BIN||'pg_dump',['--format=custom','--no-owner','--file',file,process.env.DATABASE_URL||'']); const bytes=await readFile(file); const hash=createHash('sha256').update(bytes).digest('hex'); await copyFile(file,second); const s=await stat(file); await this.db.query(`UPDATE backup_runs SET status='SUCCEEDED',storage_key=$2,second_copy_key=$3,checksum_sha256=$4,size_bytes=$5,completed_at=now() WHERE id=$1`,[id,file,second,hash,s.size]); return {id,status:'SUCCEEDED',checksumSha256:hash,sizeBytes:s.size};}
  catch(e:any){await this.db.query(`UPDATE backup_runs SET status='FAILED',error_message=$2,completed_at=now() WHERE id=$1`,[id,String(e?.message||e).slice(0,1000)]); throw e}
 }
 async restore(sourceId:string,confirmation:string,userId:string){
  if(confirmation!=='RESTORE RWANIMU DATABASE') throw new BadRequestException('Strong restore confirmation is required');
  const src=(await this.db.query(`SELECT * FROM backup_runs WHERE id=$1 AND status='SUCCEEDED'`,[sourceId])).rows[0]; if(!src) throw new NotFoundException('Usable backup not found');
  const safety=await this.create('PRE_RESTORE',userId); const rid=randomUUID(); await this.db.query(`INSERT INTO restore_runs(id,source_backup_id,safety_backup_id,status,requested_by,confirmation_text) VALUES($1,$2,$3,'STARTED',$4,$5)`,[rid,sourceId,safety.id,userId,confirmation]);
  try{await execFileAsync(process.env.PG_RESTORE_BIN||'pg_restore',['--clean','--if-exists','--no-owner','--dbname',process.env.DATABASE_URL||'',src.storage_key]); await this.db.query(`UPDATE restore_runs SET status='SUCCEEDED',completed_at=now() WHERE id=$1`,[rid]); return {id:rid,status:'SUCCEEDED',preRestoreSafetyBackupId:safety.id,note:'Offline UUID/idempotency records are restored with the database; pending devices must sync through normal server reconciliation.'};}
  catch(e:any){await this.db.query(`UPDATE restore_runs SET status='FAILED',error_message=$2,completed_at=now() WHERE id=$1`,[rid,String(e?.message||e).slice(0,1000)]); throw e}
 }
}
