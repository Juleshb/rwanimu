import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow, types } from 'pg';
types.setTypeParser(1082, value => value);
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });
  query<T extends QueryResultRow = any>(text:string, params:any[]=[]){ return this.pool.query<T>(text, params); }
  async transaction<T>(work:(c:PoolClient)=>Promise<T>):Promise<T>{
    const c=await this.pool.connect(); try { await c.query('BEGIN'); const v=await work(c); await c.query('COMMIT'); return v; }
    catch(e){ await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  }
  async onModuleDestroy(){ await this.pool.end(); }
}
