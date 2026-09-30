import { listPending, updateQueueItem } from './local-store';
export async function syncPending(apiBase:string, accessToken:string, deviceId:string, deviceToken:string){
 if(!navigator.onLine) return {synced:0,failed:0}; let synced=0,failed=0;
 for(const item of await listPending()){
  await updateQueueItem(item.id,{status:'SYNCING',attempts:item.attempts+1,lastError:undefined});
  try { const r=await fetch(`${apiBase}/sync/transactions`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${accessToken}`,'x-device-id':deviceId,'x-device-token':deviceToken},body:JSON.stringify(item)}); const body=await r.json();
   if(r.ok && body.status==='SYNCED'){await updateQueueItem(item.id,{status:'SYNCED',serverReference:body.serverReference});synced++;}
   else {const status=body.status==='REJECTED'?'REJECTED':'NEEDS_REVIEW';await updateQueueItem(item.id,{status,lastError:body.message??'Server review required'});failed++;}
  } catch(e){await updateQueueItem(item.id,{status:'PENDING',lastError:e instanceof Error?e.message:'Network error'});failed++;break;}
 } return {synced,failed};
}
export function installReconnectSync(run:()=>Promise<unknown>){const h=()=>void run();window.addEventListener('online',h);return()=>window.removeEventListener('online',h);}
