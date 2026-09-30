import React from 'react';
import { api } from './api';

export function Badge({ value }: { value?: string | null }) {
  const v = String(value || '—');
  const kind = /OUT|FAIL|REJECT|VOID|NOT_MATCH|CRITICAL|INACTIVE/.test(v) ? 'bad'
    : /LOW|PENDING|REQUEST|WARN|PARTIAL|NEEDS|DRAFT|IN_TRANSIT|OPEN/.test(v) ? 'warn'
    : /IN_STOCK|CONFIRM|COMPLETED|MATCHED|SUCCEEDED|ACTIVE|SENT|PUBLISHED|APPROVED/.test(v) ? 'ok' : '';
  return <span className={'badge ' + kind}>{v.replaceAll('_', ' ')}</span>;
}

export function Feedback({ err, ok }: { err?: string; ok?: string }) {
  return <>{err ? <div className="error">{err}</div> : null}{ok ? <p className="banner">{ok}</p> : null}</>;
}

export function Table({ columns, rows }: { columns: { label: string; render: (row: any) => React.ReactNode }[]; rows?: any[] | null }) {
  const list = rows || [];
  if (!list.length) return <p className="empty">Nothing here yet.</p>;
  return <div className="tablewrap"><table className="data"><thead><tr>{columns.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead>
    <tbody>{list.map((row, i) => <tr key={(row.product_id || row.id || row.sale_number || 'row') + '-' + i}>{columns.map(c => <td key={c.label}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>;
}

export function useData<T = any>(path: string, token: string) {
  const [data, setData] = React.useState<T | null>(null);
  const [err, setErr] = React.useState('');
  const load = React.useCallback(() => {
    setErr('');
    return api(path, token).then(d => { setData(d as T); return d as T; }).catch((e: Error) => { setErr(e.message); throw e; });
  }, [path, token]);
  React.useEffect(() => { load().catch(() => undefined); }, [load]);
  return { data, err, setErr, load };
}

export type DraftLine = { productId: string; quantity: string; amount: string };
export const blankLine = (): DraftLine => ({ productId: '', quantity: '', amount: '' });

export function LineEditor({ products, lines, setLines, amountLabel }: { products: any[]; lines: DraftLine[]; setLines: (v: DraftLine[]) => void; amountLabel?: string }) {
  const set = (i: number, patch: Partial<DraftLine>) => setLines(lines.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  return <div className="lines">
    {lines.map((l, i) => <div className="line" key={i}>
      <label>Product<select value={l.productId} onChange={e => { const p = products.find(x => x.id === e.target.value); set(i, { productId: e.target.value, amount: amountLabel && p ? String(p.selling_price ?? '') : l.amount }); }}><option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Quantity<input type="number" min="0" step="any" value={l.quantity} onChange={e => set(i, { quantity: e.target.value })} /></label>
      {amountLabel ? <label>{amountLabel}<input type="number" min="0" step="any" value={l.amount} onChange={e => set(i, { amount: e.target.value })} /></label> : <span />}
      <button type="button" className="ghost" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>Remove</button>
    </div>)}
    <button type="button" className="ghost" onClick={() => setLines([...lines, blankLine()])}>Add line</button>
  </div>;
}

export function readyLines(lines: DraftLine[], withAmount: boolean) {
  const items = lines.filter(l => l.productId);
  if (!items.length || items.some(l => !(Number(l.quantity) > 0) || (withAmount && !(Number(l.amount) >= 0)))) throw new Error('Each line needs a product, a quantity above zero, and a valid price');
  if (new Set(items.map(l => l.productId)).size !== items.length) throw new Error('Each product can appear only once. Combine the quantity on one line.');
  return items;
}
