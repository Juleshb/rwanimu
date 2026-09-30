import { Injectable } from '@nestjs/common'; import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
@Injectable() export class PasswordService {
  hash(password:string){ if(password.length<8) throw new Error('PASSWORD_TOO_SHORT'); const salt=randomBytes(16).toString('hex'); const key=scryptSync(password,salt,64).toString('hex'); return `scrypt$${salt}$${key}`; }
  verify(password:string, encoded:string){ const [kind,salt,keyHex]=encoded.split('$'); if(kind!=='scrypt'||!salt||!keyHex) return false; const a=scryptSync(password,salt,64); const b=Buffer.from(keyHex,'hex'); return a.length===b.length && timingSafeEqual(a,b); }
}
