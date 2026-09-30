import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
@Injectable()
export class DeviceTokenService {
  issue(){ const token=randomBytes(32).toString('base64url'); return {token,hash:this.hash(token)}; }
  hash(token:string){ return createHash('sha256').update(token).digest('hex'); }
}
