export type UserRole = 'ADMIN' | 'MANAGER' | 'STOREKEEPER' | 'BRANCH_USER';
export type LocationType = 'MAIN_SHOP' | 'BRANCH';
export interface UserScope { userId: string; role: UserRole; locationId: string; }
