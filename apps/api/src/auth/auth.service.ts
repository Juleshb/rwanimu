import { Injectable, UnauthorizedException } from '@nestjs/common'; import { JwtService } from '@nestjs/jwt'; import { DatabaseService } from '../database/database.service'; import { PasswordService } from './password.service'; import { AuthUser } from './auth.types';
@Injectable() export class AuthService {
 constructor(private db:DatabaseService,private passwords:PasswordService,private jwt:JwtService){}
 async login(username:string,password:string){
  const r=await this.db.query<any>('SELECT id,username,password_hash,role,location_id,active,session_version,locked_until FROM users WHERE lower(username)=lower($1)',[username.trim()]); const u=r.rows[0];
  if(!u||!u.active) throw new UnauthorizedException('Invalid username or password');
  if(u.locked_until && new Date(u.locked_until)>new Date()) throw new UnauthorizedException('Account temporarily locked');
  if(!this.passwords.verify(password,u.password_hash)){ await this.db.query("UPDATE users SET failed_login_count=failed_login_count+1, locked_until=CASE WHEN failed_login_count+1>=5 THEN now()+interval '15 minutes' ELSE locked_until END WHERE id=$1",[u.id]); throw new UnauthorizedException('Invalid username or password'); }
  await this.db.query('UPDATE users SET failed_login_count=0,locked_until=NULL,last_login_at=now() WHERE id=$1',[u.id]);
  const payload:AuthUser={sub:u.id,username:u.username,role:u.role,locationId:u.location_id,sessionVersion:u.session_version}; return {accessToken:await this.jwt.signAsync(payload),user:payload};
 }
}
