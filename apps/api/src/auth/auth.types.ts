export type UserRole='ADMIN'|'MANAGER'|'STOREKEEPER'|'BRANCH_USER';
export interface AuthUser { sub:string; username:string; role:UserRole; locationId:string|null; sessionVersion:number; }
