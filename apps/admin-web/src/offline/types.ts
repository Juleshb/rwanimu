export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'NEEDS_REVIEW' | 'REJECTED';
export type OfflineOperation = 'SALE' | 'CUSTOMER_UPSERT' | 'DEBT_PAYMENT' | 'BRANCH_STOCK_REQUEST' | 'EXPENSE';
export interface OfflineQueueItem {
  id: string; operation: OfflineOperation; payload: unknown; deviceId: string; userId: string; locationId: string;
  occurredAt: string; createdAt: string; updatedAt: string; status: SyncStatus; attempts: number;
  lastError?: string; serverReference?: string;
}
