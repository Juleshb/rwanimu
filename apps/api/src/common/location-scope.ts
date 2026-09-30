import { ForbiddenException } from '@nestjs/common'; import { AuthUser } from '../auth/auth.types';
export function enforceLocationScope(user:AuthUser, requestedLocationId:string|null|undefined){ if(user.role==='ADMIN') return; if(!user.locationId||requestedLocationId!==user.locationId) throw new ForbiddenException('You cannot access another location'); }
