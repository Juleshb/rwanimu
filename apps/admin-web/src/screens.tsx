import React from 'react';
import { api, money, User, when } from './api';
import { Badge, blankLine, DraftLine, Feedback, LineEditor, readyLines, Table, useData } from './ui';
import { WebsiteCms } from './WebsiteCms';
import { InternalSalesForm } from './InternalSalesForm';

function Panel({ title, children, onRefresh }: { title: string; children: React.ReactNode; onRefresh?: () => void }) {
  return <section><div className="sectionHead"><h2>{title}</h2>{onRefresh && <button type="button" onClick={onRefresh}>Refresh</button>}</div>{children}</section>;
}

export function DashboardScreen({ token, user }: { token: string; user: User }) {
  const { data, err, load } = useData<any>('/reports/dashboard', token);
  const d = data || {};
  const cards = user.role === 'STOREKEEPER'
    ? [['Open counts', d.physicalStock?.open], ['Matched', d.physicalStock?.matched], ['Not matched', d.physicalStock?.notMatched]]
    : [['Sales this month', money(d.salesThisMonth) + ' RWF'], ['Sales count', d.salesCount], ['Low stock', d.lowStockCount], ['Out of stock', d.outOfStockCount]];
  const admin = user.role === 'ADMIN' ? [['Gross profit', money(d.grossProfit)], ['Expenses', money(d.expenses)], ['Net profit', money(d.netProfit)], ['Stock valuation', money(d.stockValuation)], ['Supplier debt', money(d.supplierDebt)], ['Supplier credit', money(d.supplierCredit)]] : [];
  return <Panel title="Dashboard" onRefresh={() => load().catch(() => undefined)}><Feedback err={err} />
    <div className="cards">{[...cards, ...admin].map(([label, value]) => <div className="stat" key={String(label)}><span>{label}</span><b>{value ?? '—'}</b></div>)}</div>
    {user.role === 'STOREKEEPER' && <p className="notice">Storekeeper dashboard shows physical count results only. System stock quantities stay hidden.</p>}
  </Panel>;
}

export function ProductsScreen({ token }: { token: string }) {
  const { data, err, load } = useData<any[]>('/products?includeInactive=true', token);
  const [form, setForm] = React.useState({ name: '', sellingPrice: '' });
  const [edit, setEdit] = React.useState<any>(null);
  const [msg, setMsg] = React.useState(''); const [localErr, setLocalErr] = React.useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalErr(''); setMsg('');
    try { await api('/products', token, { method: 'POST', body: JSON.stringify({ name: form.name, sellingPrice: Number(form.sellingPrice || 0) }) }); setForm({ name: '', sellingPrice: '' }); setMsg('Product saved'); await load(); }
    catch (x: any) { setLocalErr(x.message); }
  };
  const update = async () => {
    setLocalErr(''); setMsg('');
    try { await api('/products/' + edit.id, token, { method: 'PATCH', body: JSON.stringify({ name: edit.name, sellingPrice: Number(edit.selling_price), active: edit.active }) }); setEdit(null); setMsg('Product updated'); await load(); }
    catch (x: any) { setLocalErr(x.message); }
  };
  return <><Panel title="Add product"><form onSubmit={save}><div className="formgrid"><label>Product name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label><label>Selling price<input type="number" min="0" step="any" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} required /></label></div><button>Save product</button></form><Feedback err={localErr || err} ok={msg} /></Panel>
    <Panel title="Products" onRefresh={() => load().catch(() => undefined)}><Table rows={data} columns={[
      { label: 'Name', render: p => edit?.id === p.id ? <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /> : p.name },
      { label: 'Selling price', render: p => edit?.id === p.id ? <input type="number" min="0" value={edit.selling_price} onChange={e => setEdit({ ...edit, selling_price: e.target.value })} /> : money(p.selling_price) },
      { label: 'Status', render: p => edit?.id === p.id ? <select value={String(edit.active)} onChange={e => setEdit({ ...edit, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select> : <Badge value={p.active ? 'ACTIVE' : 'INACTIVE'} /> },
      { label: 'Actions', render: p => <div className="row-actions">{edit?.id === p.id ? <><button type="button" onClick={update}>Save</button><button type="button" className="ghost" onClick={() => setEdit(null)}>Cancel</button></> : <button type="button" className="ghost" onClick={() => setEdit({ ...p })}>Edit</button>}</div> },
    ]} /></Panel></>;
}

export function StockScreen({ token, user }: { token: string; user: User }) {
  const [tab, setTab] = React.useState<'balances' | 'movements'>('balances');
  const [locationId, setLocationId] = React.useState('');
  const locations = useData<any[]>('/locations', token);
  const q = user.role === 'ADMIN' && locationId ? `?locationId=${locationId}` : '';
  const balances = useData<any[]>(`/stock${q}`, token);
  const movements = useData<any[]>(`/stock/movements${q}`, token);
  const current = tab === 'balances' ? balances : movements;
  return <Panel title="Stock" onRefresh={() => current.load().catch(() => undefined)}><p className="muted">Quantities change only through purchases, sales, transfers, and an admin physical-count adjustment. This screen is the record of those movements.</p>{user.role === 'ADMIN' && <label>Location<select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">All locations</option>{(Array.isArray(locations.data) ? locations.data : []).filter((l: any) => l.active !== false).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}<div className="tabs"><button type="button" className={tab === 'balances' ? 'active' : ''} onClick={() => setTab('balances')}>Balances</button><button type="button" className={tab === 'movements' ? 'active' : ''} onClick={() => setTab('movements')}>Movements</button></div><Feedback err={current.err} />
    {tab === 'balances' ? <Table rows={balances.data} columns={[{ label: 'Product', render: r => r.name }, { label: 'Location', render: r => r.location_name }, { label: 'Quantity', render: r => r.quantity }, { label: 'Status', render: r => <Badge value={r.stock_status} /> }, { label: 'Selling price', render: r => money(r.selling_price) }]} />
      : <Table rows={movements.data} columns={[{ label: 'When', render: r => when(r.created_at) }, { label: 'Product', render: r => r.product_name }, { label: 'Location', render: r => r.location_name }, { label: 'Type', render: r => <Badge value={r.movement_type} /> }, { label: 'Qty', render: r => r.quantity }, { label: 'Before', render: r => r.quantity_before }, { label: 'After', render: r => r.quantity_after }, { label: 'Reason', render: r => r.reason || '—' }]} />}
  </Panel>;
}

export function PurchasesScreen({ token }: { token: string }) {
  const suppliers = useData<any[]>('/purchases/suppliers', token);
  const products = useData<any[]>('/products', token);
  const purchases = useData<any[]>('/purchases', token);
  const [name, setName] = React.useState(''); const [phone, setPhone] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [account, setAccount] = React.useState<any>(null);
  const [supplierId, setSupplierId] = React.useState(''); const [paid, setPaid] = React.useState('0');
  const [lines, setLines] = React.useState<DraftLine[]>([blankLine()]);
  const [pay, setPay] = React.useState<Record<string, string>>({});
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const refresh = () => Promise.all([suppliers.load(), purchases.load()]).catch(() => undefined);
  return <><Panel title="Suppliers" onRefresh={() => refresh()}><Feedback err={err || suppliers.err} ok={ok} />
    <form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api('/purchases/suppliers', token, { method: 'POST', body: JSON.stringify({ name, phone }) }); setName(''); setPhone(''); setOk('Supplier saved'); await suppliers.load(); } catch (x: any) { setErr(x.message); } }}><div className="formgrid"><label>Supplier name<input value={name} onChange={e => setName(e.target.value)} required /></label><label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} /></label></div><button>Add supplier</button></form>
    {account && <div className="notice"><b>{account.name}</b> · debt {money(account.debt_balance)} · credit {money(account.credit_balance)}<div>Open debts: {(account.openDebts || []).map((d: any) => money(d.debt_remaining)).join(', ') || 'none'}</div><div>Recent payments: {(account.payments || []).map((p: any) => `${money(p.amount)} on ${when(p.created_at)}`).join('; ') || 'none'}</div><button type="button" className="ghost" onClick={() => setAccount(null)}>Close</button></div>}
    <Table rows={suppliers.data} columns={[
      { label: 'Supplier', render: s => edit?.id === s.id ? <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /> : s.name },
      { label: 'Phone', render: s => edit?.id === s.id ? <input value={edit.phone || ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} /> : (s.phone || '—') },
      { label: 'Status', render: s => edit?.id === s.id ? <select value={String(edit.active)} onChange={e => setEdit({ ...edit, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select> : <Badge value={s.active ? 'ACTIVE' : 'INACTIVE'} /> },
      { label: 'Debt', render: s => money(s.debt_balance) }, { label: 'Credit', render: s => money(s.credit_balance) },
      { label: 'Actions', render: s => <div className="row-actions">{edit?.id === s.id ? <button type="button" onClick={async () => { setErr(''); try { await api('/purchases/suppliers/' + s.id, token, { method: 'PATCH', body: JSON.stringify({ name: edit.name, phone: edit.phone, active: edit.active }) }); setEdit(null); setOk('Supplier updated'); await suppliers.load(); } catch (x: any) { setErr(x.message); } }}>Save</button> : <button type="button" className="ghost" onClick={() => setEdit(s)}>Edit</button>}<button type="button" className="ghost" onClick={async () => { try { setAccount(await api('/purchases/suppliers/' + s.id + '/account', token)); } catch (x: any) { setErr(x.message); } }}>Account</button>
        {s.active !== false && <form className="row-actions" onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api(`/purchases/suppliers/${s.id}/payments`, token, { method: 'POST', body: JSON.stringify({ amount: Number(pay[s.id]) }) }); setPay({ ...pay, [s.id]: '' }); setOk('Supplier payment recorded'); await refresh(); } catch (x: any) { setErr(x.message); } }}><input type="number" min="0" step="any" placeholder="Amount" value={pay[s.id] || ''} onChange={e => setPay({ ...pay, [s.id]: e.target.value })} required /><button>Pay</button></form>}</div> },
    ]} />
  </Panel>
    <Panel title="New purchase"><form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { const items = readyLines(lines, true).map(l => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.amount) })); await api('/purchases', token, { method: 'POST', body: JSON.stringify({ supplierId, amountPaid: Number(paid || 0), items }) }); setLines([blankLine()]); setPaid('0'); setOk('Purchase confirmed and stock received at Main Shop'); await refresh(); } catch (x: any) { setErr(x.message); } }}>
      <div className="formgrid"><label>Supplier<select value={supplierId} onChange={e => setSupplierId(e.target.value)} required><option value="">Select</option>{(suppliers.data || []).filter(s => s.active !== false).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Amount paid now<input type="number" min="0" step="any" value={paid} onChange={e => setPaid(e.target.value)} /></label></div>
      <LineEditor products={products.data || []} lines={lines} setLines={setLines} amountLabel="Buying price" /><button>Confirm purchase</button></form><Feedback err={products.err} /></Panel>
    <Panel title="Purchase history" onRefresh={() => purchases.load().catch(() => undefined)}><Feedback err={purchases.err} /><Table rows={purchases.data} columns={[{ label: 'Date', render: p => when(p.created_at) }, { label: 'Supplier', render: p => p.supplier_name }, { label: 'Location', render: p => p.location_name }, { label: 'Total', render: p => money(p.total) }, { label: 'Paid', render: p => money(p.amount_paid) }, { label: 'Debt', render: p => money(p.debt_remaining) }, { label: 'Items', render: p => (p.items || []).map((i: any) => `${i.name} × ${i.quantity}`).join(', ') || '—' }]} /></Panel></>;
}

export function SalesScreen({ token, user }: { token: string; user: User }) {
  const products = useData<any[]>('/products', token);
  const customers = useData<any[]>('/customers', token);
  const locations = useData<any[]>('/locations', token);
  const sales = useData<any[]>('/sales', token);
  const [locationId, setLocationId] = React.useState(user.locationId || '');
  const [customerId, setCustomerId] = React.useState('');
  const [walkInName, setWalkInName] = React.useState(''); const [walkInPhone, setWalkInPhone] = React.useState('');
  const [paid, setPaid] = React.useState('0');
  const [lines, setLines] = React.useState<DraftLine[]>([blankLine()]);
  const [replaces, setReplaces] = React.useState<string>('');
  const [form, setForm] = React.useState<any>(null);
  const [voiding, setVoiding] = React.useState<any>(null);
  const [reason, setReason] = React.useState('');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setOk('');
    try {
      const items = readyLines(lines, true).map(l => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.amount) }));
      const body: any = { amountPaid: Number(paid || 0), items, customerId: customerId || undefined };
      if (!customerId) { body.customerName = walkInName.trim() || 'Walk-in'; if (walkInPhone.trim()) body.customerPhone = walkInPhone.trim(); }
      if (user.role === 'ADMIN') body.locationId = locationId;
      if (replaces) body.replacesSaleId = replaces;
      await api('/sales', token, { method: 'POST', body: JSON.stringify(body) });
      setLines([blankLine()]); setPaid('0'); setReplaces(''); setOk('Sale confirmed'); await sales.load();
    } catch (x: any) { setErr(x.message); }
  };
  return <><Panel title="New sale"><form onSubmit={submit}><Feedback err={err || products.err || customers.err} ok={ok} />
    {replaces && <p className="notice">This sale redoes a voided sale. Confirm only after the lines are correct.</p>}
    <div className="formgrid">
      {user.role === 'ADMIN' && <label>Shop<select value={locationId} onChange={e => setLocationId(e.target.value)} required><option value="">Select</option>{(locations.data || []).filter(l => l.active !== false).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
      <label>Customer<select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Walk-in</option>{(customers.data || []).filter(c => c.active !== false).map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}</select></label>
      {!customerId && <><label>Walk-in name<input value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Optional" /></label><label>Walk-in phone<input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="Optional" /></label></>}
      <label>Cash paid<input type="number" min="0" step="any" value={paid} onChange={e => setPaid(e.target.value)} /></label>
    </div>
    <LineEditor products={products.data || []} lines={lines} setLines={setLines} amountLabel="Selling price" /><button>Confirm sale</button></form></Panel>
    <Panel title="Sales" onRefresh={() => sales.load().catch(() => undefined)}><Feedback err={sales.err} />
      {voiding && <form className="formgrid" onSubmit={async e => { e.preventDefault(); setErr(''); try { await api(`/sales/${voiding.id}/void`, token, { method: 'POST', body: JSON.stringify({ reason }) }); setVoiding(null); setReason(''); setOk('Sale voided'); await sales.load(); } catch (x: any) { setErr(x.message); } }}><label>Void reason for {voiding.sale_number}<input value={reason} onChange={e => setReason(e.target.value)} required /></label><div className="row-actions"><button className="danger">Confirm void</button><button type="button" className="ghost" onClick={() => setVoiding(null)}>Cancel</button></div></form>}
      <Table rows={sales.data} columns={[
        { label: 'Sale', render: s => s.sale_number }, { label: 'When', render: s => when(s.created_at) }, { label: 'Shop', render: s => s.location_name || '—' }, { label: 'Customer', render: s => `${s.customer_name || 'Walk-in'}${s.customer_phone ? ` · ${s.customer_phone}` : ''}` },
        { label: 'Total', render: s => money(s.total) }, { label: 'Paid', render: s => money(s.cash_paid) }, { label: 'Credit used', render: s => money(s.credit_used) }, { label: 'Debt', render: s => money(s.debt_remaining) }, { label: 'Status', render: s => <Badge value={s.status} /> },
        { label: 'Actions', render: s => <div className="row-actions">
          <button type="button" className="ghost" onClick={async () => { try { setForm(await api('/sales/' + s.id + '/internal-form', token)); } catch (x: any) { setErr(x.message); } }}>Sales form</button>
          {user.role === 'ADMIN' && s.status === 'CONFIRMED' && <button type="button" className="danger" onClick={() => { setVoiding(s); setReason(''); }}>Void</button>}
          {user.role === 'ADMIN' && s.status === 'VOIDED' && <button type="button" className="ghost" onClick={async () => { try { const d = await api('/sales/' + s.id + '/internal-form', token); setLocationId(d.location_id); setLines((d.items || []).map((i: any) => ({ productId: i.product_id, quantity: String(i.quantity), amount: String(i.unit_price) }))); setReplaces(s.id); setOk('Redo lines loaded. Confirm the new sale when ready.'); } catch (x: any) { setErr(x.message); } }}>Redo</button>}
        </div> },
      ]} />
      {form && <div><div className="no-print row-actions"><button type="button" className="ghost" onClick={() => setForm(null)}>Close form</button></div><InternalSalesForm sale={form} /></div>}
    </Panel></>;
}

export function CustomersScreen({ token }: { token: string }) {
  const { data, err, load } = useData<any[]>('/customers', token);
  const [name, setName] = React.useState(''); const [phone, setPhone] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null);
  const [pay, setPay] = React.useState<Record<string, string>>({});
  const [account, setAccount] = React.useState<any>(null);
  const [localErr, setLocalErr] = React.useState(''); const [ok, setOk] = React.useState('');
  return <Panel title="Customers" onRefresh={() => load().catch(() => undefined)}><Feedback err={localErr || err} ok={ok} />
    <form onSubmit={async e => { e.preventDefault(); setLocalErr(''); setOk(''); try { await api('/customers', token, { method: 'POST', body: JSON.stringify({ name, phone }) }); setName(''); setPhone(''); setOk('Customer saved'); await load(); } catch (x: any) { setLocalErr(x.message); } }}><div className="formgrid"><label>Customer name<input value={name} onChange={e => setName(e.target.value)} required /></label><label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} /></label></div><button>Add customer</button></form>
    {account && <div className="notice"><b>{account.name}</b> · {account.phone || 'no phone'} · debt {money(account.debt_balance)} RWF · credit {money(account.credit_balance)} RWF<div>Open debts: {(account.openDebts || []).map((d: any) => `${d.sale_number} ${money(d.debt_remaining)}`).join(', ') || 'none'}</div><div>Recent payments: {(account.payments || []).map((p: any) => `${money(p.amount)} on ${when(p.created_at)}`).join('; ') || 'none'}</div><button type="button" className="ghost" onClick={() => setAccount(null)}>Close</button></div>}
    <Table rows={data} columns={[
      { label: 'Name', render: c => edit?.id === c.id ? <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /> : c.name },
      { label: 'Phone', render: c => edit?.id === c.id ? <input value={edit.phone || ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} /> : (c.phone || '—') },
      { label: 'Status', render: c => edit?.id === c.id ? <select value={String(edit.active)} onChange={e => setEdit({ ...edit, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select> : <Badge value={c.active ? 'ACTIVE' : 'INACTIVE'} /> },
      { label: 'WhatsApp', render: c => <Badge value={c.whatsapp_opt_in ? 'OPTED IN' : 'NO'} /> }, { label: 'SMS', render: c => <Badge value={c.sms_opt_in ? 'OPTED IN' : 'NO'} /> },
      { label: 'Debt', render: c => money(c.debt_balance) }, { label: 'Credit', render: c => money(c.credit_balance) },
      { label: 'Actions', render: c => <div className="row-actions">{edit?.id === c.id ? <button type="button" onClick={async () => { setLocalErr(''); try { await api('/customers/' + c.id, token, { method: 'PATCH', body: JSON.stringify({ name: edit.name, phone: edit.phone, active: edit.active }) }); setEdit(null); setOk('Customer updated'); await load(); } catch (x: any) { setLocalErr(x.message); } }}>Save</button> : <button type="button" className="ghost" onClick={() => setEdit(c)}>Edit</button>}<button type="button" className="ghost" onClick={async () => { try { setAccount(await api('/customers/' + c.id + '/account', token)); } catch (x: any) { setLocalErr(x.message); } }}>Account</button>
        <form className="row-actions" onSubmit={async e => { e.preventDefault(); setLocalErr(''); setOk(''); try { await api(`/customers/${c.id}/payments`, token, { method: 'POST', body: JSON.stringify({ amount: Number(pay[c.id]) }) }); setPay({ ...pay, [c.id]: '' }); setOk('Payment recorded'); await load(); } catch (x: any) { setLocalErr(x.message); } }}><input type="number" min="0" step="any" placeholder="Payment" value={pay[c.id] || ''} onChange={e => setPay({ ...pay, [c.id]: e.target.value })} required /><button>Receive</button></form></div> },
    ]} />
  </Panel>;
}

export function TransfersScreen({ token, user }: { token: string; user: User }) {
  const transfers = useData<any[]>('/transfers', token);
  const products = useData<any[]>('/products', token);
  const locations = useData<any[]>('/locations', token);
  const branches = (locations.data || []).filter(l => l.type === 'BRANCH' && l.active !== false);
  const [toLocationId, setTo] = React.useState('');
  const [branchName, setBranchName] = React.useState('');
  const [locEdit, setLocEdit] = React.useState<any>(null);
  const [lines, setLines] = React.useState<DraftLine[]>([blankLine()]);
  const [note, setNote] = React.useState<any>(null);
  const [open, setOpen] = React.useState<any>(null);
  const [qtys, setQtys] = React.useState<Record<string, string>>({});
  const [disc, setDisc] = React.useState('');
  const [transport, setTransport] = React.useState<Record<string, string>>({});
  const [reason, setReason] = React.useState<Record<string, string>>({});
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const act = async (path: string, body: any, message: string) => { setErr(''); setOk(''); try { await api(path, token, { method: 'POST', body: JSON.stringify(body) }); setOk(message); setOpen(null); await transfers.load(); } catch (x: any) { setErr(x.message); throw x; } };
  const openQty = (t: any) => { const next: Record<string, string> = {}; for (const i of t.items || []) { const n = t.status === 'REQUESTED' ? (i.approvedQty ?? i.requestedQty) : t.status === 'APPROVED' ? (i.dispatchedQty ?? i.approvedQty) : (i.receivedQty ?? i.dispatchedQty); next[i.productId] = n == null ? '' : String(n); } setQtys(next); setOpen(t); };
  const qtyItems = (key: string) => (open?.items || []).map((i: any) => ({ productId: i.productId, [key]: Number(qtys[i.productId] || 0) }));
  const canRequest = user.role === 'ADMIN' || user.role === 'BRANCH_USER';
  return <>{canRequest && <Panel title="Request stock"><Feedback err={err || transfers.err || products.err} ok={ok} />
    {user.role === 'ADMIN' && <><form className="formgrid" onSubmit={async e => { e.preventDefault(); try { await api('/locations', token, { method: 'POST', body: JSON.stringify({ name: branchName }) }); setBranchName(''); setOk('Branch added'); await locations.load(); } catch (x: any) { setErr(x.message); } }}><label>New branch name<input value={branchName} onChange={e => setBranchName(e.target.value)} required /></label><button>Add branch</button></form>
      <Table rows={locations.data} columns={[{ label: 'Location', render: l => locEdit?.id === l.id ? <input value={locEdit.name} onChange={e => setLocEdit({ ...locEdit, name: e.target.value })} /> : l.name }, { label: 'Type', render: l => l.type }, { label: 'Status', render: l => locEdit?.id === l.id && l.type !== 'MAIN_SHOP' ? <select value={String(locEdit.active)} onChange={e => setLocEdit({ ...locEdit, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select> : <Badge value={l.active ? 'ACTIVE' : 'INACTIVE'} /> }, { label: 'Actions', render: l => locEdit?.id === l.id ? <button type="button" onClick={async () => { try { await api('/locations/' + l.id, token, { method: 'PATCH', body: JSON.stringify({ name: locEdit.name, active: l.type === 'MAIN_SHOP' ? true : locEdit.active }) }); setLocEdit(null); setOk('Location updated'); await locations.load(); } catch (x: any) { setErr(x.message); } }}>Save</button> : <button type="button" className="ghost" onClick={() => setLocEdit(l)}>Rename</button> }]} /></>}
    {!branches.length && user.role === 'ADMIN' && <p className="notice">Add a branch before requesting a transfer. Stock moves from Main Shop to that branch.</p>}
    <form onSubmit={async e => { e.preventDefault(); try { const items = readyLines(lines, false).map(l => ({ productId: l.productId, quantity: Number(l.quantity) })); await act('/transfers/requests', user.role === 'ADMIN' ? { toLocationId, items } : { items }, 'Transfer requested'); setLines([blankLine()]); } catch (x: any) { setErr(x.message); } }}>
      {user.role === 'ADMIN' && <label>Branch<select value={toLocationId} onChange={e => setTo(e.target.value)} required><option value="">Select</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
      <LineEditor products={products.data || []} lines={lines} setLines={setLines} /><button>Submit request</button></form>
  </Panel>}
    <Panel title="Transfers" onRefresh={() => transfers.load().catch(() => undefined)}>{!canRequest && <Feedback err={err || transfers.err} ok={ok} />}{user.role === 'MANAGER' && <p className="muted">You can review transfers and open delivery notes. Approval and dispatch stay with Admin. The branch confirms receipt.</p>}
      {open && <div className="notice"><b>{open.transfer_no || 'Transfer'}</b> · {open.status}{(open.items || []).map((i: any) => <label key={i.productId}>{i.name} (requested {i.requestedQty ?? '—'}, approved {i.approvedQty ?? '—'}, sent {i.dispatchedQty ?? '—'})<input type="number" min="0" step="any" value={qtys[i.productId] ?? ''} onChange={e => setQtys({ ...qtys, [i.productId]: e.target.value })} /></label>)}
        {user.role === 'ADMIN' && open.status === 'REQUESTED' && <button type="button" className="okbtn" onClick={() => act(`/transfers/${open.id}/approve`, { items: qtyItems('approvedQuantity'), note: reason[open.id] || undefined }, 'Transfer approved')}>Approve these quantities</button>}
        {user.role === 'ADMIN' && open.status === 'APPROVED' && <><label>Transport cost<input type="number" min="0" step="any" value={transport[open.id] || ''} onChange={e => setTransport({ ...transport, [open.id]: e.target.value })} /></label><button type="button" onClick={() => act(`/transfers/${open.id}/dispatch`, { transportCost: Number(transport[open.id] || 0), items: qtyItems('dispatchedQuantity') }, 'Transfer dispatched')}>Dispatch these quantities</button></>}
        {user.role === 'BRANCH_USER' && open.status === 'IN_TRANSIT' && <><label>Discrepancy note<input value={disc} onChange={e => setDisc(e.target.value)} placeholder="Required only if received quantity differs" /></label><button type="button" className="okbtn" onClick={() => act(`/transfers/${open.id}/receive`, { items: qtyItems('receivedQuantity'), discrepancyNote: disc || undefined }, 'Receipt confirmed')}>Confirm received quantities</button></>}
        <button type="button" className="ghost" onClick={() => setOpen(null)}>Close</button></div>}
      {note && <section className="sales-form-print"><div className="no-print"><button type="button" onClick={() => window.print()}>Print delivery note</button><button type="button" className="ghost" onClick={() => setNote(null)}>Close</button></div><h2>RWANIMU Company Ltd</h2><h3>{note.document}</h3><p>{note.transfer_no} · {note.from_name} → {note.to_name} · {when(note.dispatched_at)}</p><table className="data"><thead><tr><th>Product</th><th>Quantity</th></tr></thead><tbody>{(note.items || []).map((i: any, n: number) => <tr key={n}><td>{i.name}</td><td>{i.quantity}</td></tr>)}</tbody></table><p>Transport cost is internal and is not printed on this note.</p></section>}
      <Table rows={transfers.data} columns={[
        { label: 'No', render: t => t.transfer_no || t.id.slice(0, 8) }, { label: 'Branch', render: t => t.branch }, { label: 'Status', render: t => <Badge value={t.status} /> }, { label: 'Requested', render: t => when(t.requested_at) },
        { label: 'Items', render: t => (t.items || []).map((i: any) => `${i.name}: req ${i.requestedQty ?? '—'} / appr ${i.approvedQty ?? '—'} / sent ${i.dispatchedQty ?? '—'} / recv ${i.receivedQty ?? '—'}`).join('; ') || '—' },
        { label: 'Actions', render: t => <div className="row-actions">
          {user.role === 'ADMIN' && t.status === 'REQUESTED' && <><button type="button" className="ghost" onClick={() => openQty(t)}>Set quantities</button><button type="button" className="okbtn" onClick={() => act(`/transfers/${t.id}/approve`, {}, 'Transfer approved')}>Approve</button><input placeholder="Reject reason" value={reason[t.id] || ''} onChange={e => setReason({ ...reason, [t.id]: e.target.value })} /><button type="button" className="danger" onClick={() => act(`/transfers/${t.id}/reject`, { reason: reason[t.id] }, 'Transfer rejected')}>Reject</button></>}
          {user.role === 'ADMIN' && t.status === 'APPROVED' && <><button type="button" className="ghost" onClick={() => openQty(t)}>Set quantities</button><input type="number" min="0" placeholder="Transport cost" value={transport[t.id] || ''} onChange={e => setTransport({ ...transport, [t.id]: e.target.value })} /><button type="button" onClick={() => act(`/transfers/${t.id}/dispatch`, { transportCost: Number(transport[t.id] || 0) }, 'Transfer dispatched')}>Dispatch</button></>}
          {['IN_TRANSIT', 'COMPLETED', 'NEEDS_REVIEW'].includes(t.status) && <button type="button" className="ghost" onClick={async () => { try { setNote(await api(`/transfers/${t.id}/delivery-note`, token)); } catch (x: any) { setErr(x.message); } }}>Delivery note</button>}
          {user.role === 'BRANCH_USER' && t.status === 'IN_TRANSIT' && <><button type="button" className="ghost" onClick={() => openQty(t)}>Set quantities</button><button type="button" className="okbtn" onClick={() => act(`/transfers/${t.id}/receive`, {}, 'Receipt confirmed')}>Receive</button></>}
        </div> },
      ]} />
    </Panel></>;
}

export function ExpensesScreen({ token, user }: { token: string; user: User }) {
  const locations = useData<any[]>('/locations', token);
  const list = useData<any[]>('/expenses', token);
  const [description, setDescription] = React.useState(''); const [amount, setAmount] = React.useState(''); const [expenseDate, setExpenseDate] = React.useState(''); const [locationId, setLocationId] = React.useState('');
  const [edit, setEdit] = React.useState<any>(null); const [del, setDel] = React.useState<any>(null); const [reason, setReason] = React.useState('');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  return <Panel title="Expenses" onRefresh={() => list.load().catch(() => undefined)}><Feedback err={err || list.err} ok={ok} />
    <form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api('/expenses', token, { method: 'POST', body: JSON.stringify({ description, amount: Number(amount), expenseDate: expenseDate || undefined, locationId: locationId || undefined }) }); setDescription(''); setAmount(''); setExpenseDate(''); setOk('Expense saved'); await list.load(); } catch (x: any) { setErr(x.message); } }}>
      <div className="formgrid"><label>Description / reason<input value={description} onChange={e => setDescription(e.target.value)} required /></label><label>Amount<input type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} required /></label><label>Date<input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} /></label>{user.role === 'ADMIN' && <label>Location<select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Main Shop</option>{(locations.data || []).filter(l => l.active !== false).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}</div><button>Save expense</button></form>
    {del && <form className="formgrid" onSubmit={async e => { e.preventDefault(); try { await api('/expenses/' + del.id, token, { method: 'DELETE', body: JSON.stringify({ reason }) }); setDel(null); setReason(''); setOk('Expense deleted'); await list.load(); } catch (x: any) { setErr(x.message); } }}><label>Delete reason<input value={reason} onChange={e => setReason(e.target.value)} required /></label><div className="row-actions"><button className="danger">Confirm delete</button><button type="button" className="ghost" onClick={() => setDel(null)}>Cancel</button></div></form>}
    <Table rows={list.data} columns={[{ label: 'Date', render: r => edit?.id === r.id ? <input type="date" value={String(edit.expense_date).slice(0, 10)} onChange={e => setEdit({ ...edit, expense_date: e.target.value })} /> : String(r.expense_date).slice(0, 10) }, { label: 'Description', render: r => edit?.id === r.id ? <input value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} /> : r.description }, { label: 'Amount', render: r => edit?.id === r.id ? <input type="number" value={edit.amount} onChange={e => setEdit({ ...edit, amount: e.target.value })} /> : money(r.amount) }, { label: 'Location', render: r => r.location }, { label: 'By', render: r => r.created_by || '—' }, { label: 'Actions', render: r => user.role === 'ADMIN' ? <div className="row-actions">{edit?.id === r.id ? <button type="button" onClick={async () => { try { await api('/expenses/' + r.id, token, { method: 'PATCH', body: JSON.stringify({ description: edit.description, amount: Number(edit.amount), expenseDate: String(edit.expense_date).slice(0, 10) }) }); setEdit(null); setOk('Expense updated'); await list.load(); } catch (x: any) { setErr(x.message); } }}>Save</button> : <button type="button" className="ghost" onClick={() => setEdit({ ...r, expense_date: String(r.expense_date).slice(0, 10) })}>Edit</button>}<button type="button" className="danger" onClick={() => setDel(r)}>Delete</button></div> : '—' }]} />
  </Panel>;
}

export function ReportsScreen({ token, user }: { token: string; user: User }) {
  const [tab, setTab] = React.useState('sales');
  const [from, setFrom] = React.useState(''); const [to, setTo] = React.useState('');
  const q = `${from ? '&from=' + from : ''}${to ? '&to=' + to : ''}`;
  const sales = useData<any>(`/reports/sales?${q.replace(/^&/, '')}`, token);
  const expenses = useData<any>(`/reports/expenses?${q.replace(/^&/, '')}`, token);
  const financial = useData<any>(user.role === 'ADMIN' ? `/reports/financial?${q.replace(/^&/, '')}` : '/reports/sales?unused=1', token);
  const counts = useData<any>(user.role === 'ADMIN' ? '/reports/physical-counts' : '/reports/sales?unused=1', token);
  const [detail, setDetail] = React.useState<any[] | null>(null);
  const [countId, setCountId] = React.useState('');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const tabs = ['sales', 'expenses', ...(user.role === 'ADMIN' ? ['financial', 'physical'] : [])];
  return <Panel title="Reports"><div className="formgrid"><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <div className="tabs">{tabs.map(t => <button type="button" key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    <Feedback err={err || sales.err || expenses.err || financial.err || counts.err} ok={ok} />
    {tab === 'sales' && <Table rows={sales.data?.rows} columns={[{ label: 'Sale', render: r => r.sale_number }, { label: 'When', render: r => when(r.created_at) }, { label: 'Customer', render: r => r.customer_name }, { label: 'Location', render: r => r.location }, { label: 'Total', render: r => money(r.total) }, { label: 'Cash paid', render: r => money(r.cash_paid) }, { label: 'Credit used', render: r => money(r.credit_used) }, { label: 'Debt', render: r => money(r.debt_remaining) }, { label: 'Status', render: r => <Badge value={r.status} /> }]} />}
    {tab === 'expenses' && <Table rows={expenses.data?.rows} columns={[{ label: 'Date', render: r => r.expense_date }, { label: 'Description', render: r => r.description }, { label: 'Amount', render: r => money(r.amount) }, { label: 'Location', render: r => r.location }, { label: 'By', render: r => r.creator || '—' }]} />}
    {tab === 'financial' && financial.data && <div className="cards">{[['Revenue', financial.data.revenue], ['COGS', financial.data.cogs], ['Gross profit', financial.data.grossProfit], ['Expenses', financial.data.expenses], ['Net profit', financial.data.netProfit], ['Stock valuation', financial.data.stockValuation]].map(([l, v]) => <div className="stat" key={String(l)}><span>{l}</span><b>{money(v)} RWF</b></div>)}</div>}
    {tab === 'physical' && <><Table rows={counts.data?.rows} columns={[{ label: 'Date', render: r => r.count_date }, { label: 'Location', render: r => r.location }, { label: 'Status', render: r => <Badge value={r.status} /> }, { label: 'Match', render: r => <Badge value={r.match_status || '—'} /> }, { label: 'Review', render: r => <button type="button" className="ghost" onClick={async () => { try { setCountId(r.id); setDetail(await api('/physical-stock/admin/' + r.id, token)); } catch (x: any) { setErr(x.message); } }}>Open</button> }]} />
      {detail && <Table rows={detail} columns={[{ label: 'Product', render: r => r.name }, { label: 'Physical', render: r => r.physical_quantity ?? '—' }, { label: 'System at completion', render: r => r.system_quantity_at_completion ?? '—' }, { label: 'Difference', render: r => r.difference ?? '—' }, { label: 'Review', render: r => r.review_status || '—' }, { label: 'Adjust', render: r => r.review_status === 'PENDING' ? <div className="row-actions">{(['DAMAGE', 'MISSING_LOSS'] as const).map(reason => <button type="button" key={reason} className={reason === 'MISSING_LOSS' ? 'danger' : ''} onClick={async () => { try { await api(`/physical-stock/admin/${countId}/adjust/${r.product_id}`, token, { method: 'POST', body: JSON.stringify({ reason }) }); setDetail(await api('/physical-stock/admin/' + countId, token)); setOk(reason === 'DAMAGE' ? 'Damage adjustment recorded' : 'Missing / loss adjustment recorded'); await counts.load(); } catch (x: any) { setErr(x.message); } }}>{reason === 'DAMAGE' ? 'Damage' : 'Missing / loss'}</button>)}</div> : '—' }]} />}
    </>}
  </Panel>;
}

export function UsersScreen({ token, user }: { token: string; user: User }) {
  const users = useData<any[]>('/users', token);
  const locations = useData<any[]>('/locations', token);
  const [form, setForm] = React.useState({ fullName: '', username: '', password: '', role: 'MANAGER', locationId: '', preferredLanguage: 'en' });
  const [edit, setEdit] = React.useState<any>(null);
  const [reset, setReset] = React.useState<any>(null); const [password, setPassword] = React.useState('');
  const [own, setOwn] = React.useState({ oldPassword: '', newPassword: '' });
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  return <Panel title="Users" onRefresh={() => users.load().catch(() => undefined)}><Feedback err={err || users.err} ok={ok} />
    <form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api('/users', token, { method: 'POST', body: JSON.stringify({ ...form, locationId: form.locationId || null }) }); setForm({ fullName: '', username: '', password: '', role: 'MANAGER', locationId: '', preferredLanguage: 'en' }); setOk('User created'); await users.load(); } catch (x: any) { setErr(x.message); } }}>
      <div className="formgrid"><label>Full name<input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></label><label>Username<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></label><label>Temporary password<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label><label>Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>ADMIN</option><option>MANAGER</option><option>STOREKEEPER</option><option>BRANCH_USER</option></select></label><label>Language<select value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label><label>Location<select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} required={form.role === 'STOREKEEPER' || form.role === 'BRANCH_USER'}><option value="">None</option>{(locations.data || []).filter(l => l.active !== false).map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}</select></label></div><p className="muted">Location is required for a Storekeeper or Branch User.</p><button>Create user</button></form>
    {edit && <form className="formgrid" onSubmit={async e => { e.preventDefault(); setErr(''); try { await api('/users/' + edit.id, token, { method: 'PATCH', body: JSON.stringify({ fullName: edit.full_name, role: edit.role, locationId: edit.location_id || null, preferredLanguage: edit.preferred_language }) }); setEdit(null); setOk('User updated. If the role or location changed, that person must sign in again.'); await users.load(); } catch (x: any) { setErr(x.message); } }}><label>Full name<input value={edit.full_name || ''} onChange={e => setEdit({ ...edit, full_name: e.target.value })} required /></label><label>Role<select value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}><option>ADMIN</option><option>MANAGER</option><option>STOREKEEPER</option><option>BRANCH_USER</option></select></label><label>Language<select value={edit.preferred_language || 'en'} onChange={e => setEdit({ ...edit, preferred_language: e.target.value })}><option value="en">English</option><option value="rw">Kinyarwanda</option></select></label><label>Location<select value={edit.location_id || ''} onChange={e => setEdit({ ...edit, location_id: e.target.value })} required={edit.role === 'STOREKEEPER' || edit.role === 'BRANCH_USER'}><option value="">None</option>{(locations.data || []).filter(l => l.active !== false || l.id === edit.location_id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><div className="row-actions"><button>Save user</button><button type="button" className="ghost" onClick={() => setEdit(null)}>Cancel</button></div></form>}
    {reset && <form className="formgrid" onSubmit={async e => { e.preventDefault(); try { await api(`/users/${reset.id}/reset-password`, token, { method: 'POST', body: JSON.stringify({ newPassword: password }) }); setReset(null); setPassword(''); setOk('Password reset. The user must sign in again.'); } catch (x: any) { setErr(x.message); } }}><label>New password for {reset.username}<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><div className="row-actions"><button>Reset password</button><button type="button" className="ghost" onClick={() => setReset(null)}>Cancel</button></div></form>}
    <Table rows={users.data} columns={[{ label: 'Name', render: u => u.full_name || '—' }, { label: 'Username', render: u => u.username }, { label: 'Role', render: u => <Badge value={u.role} /> }, { label: 'Location', render: u => u.location_name || '—' }, { label: 'Language', render: u => u.preferred_language === 'rw' ? 'Kinyarwanda' : 'English' }, { label: 'Active', render: u => <Badge value={u.active ? 'ACTIVE' : 'INACTIVE'} /> }, { label: 'Last login', render: u => when(u.last_login_at) }, { label: 'Actions', render: u => <div className="row-actions"><button type="button" className="ghost" onClick={() => setEdit(u)}>Edit</button><button type="button" className="ghost" onClick={async () => { try { await api(`/users/${u.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ active: !u.active }) }); setOk(u.active ? 'User deactivated' : 'User activated'); await users.load(); } catch (x: any) { setErr(x.message); } }}>{u.active ? 'Deactivate' : 'Activate'}</button><button type="button" className="ghost" onClick={() => setReset(u)}>Reset password</button></div> }]} />
    <h3>Change my password</h3>
    <form className="formgrid" onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api('/users/me/change-password', token, { method: 'POST', body: JSON.stringify(own) }); setOwn({ oldPassword: '', newPassword: '' }); setOk('Password changed. Sign in again with the new password.'); } catch (x: any) { setErr(x.message); } }}><label>Current password<input type="password" value={own.oldPassword} onChange={e => setOwn({ ...own, oldPassword: e.target.value })} required /></label><label>New password<input type="password" value={own.newPassword} onChange={e => setOwn({ ...own, newPassword: e.target.value })} required /></label><button>Update password</button></form>
    <p className="muted">Signed in as {user.username}.</p>
  </Panel>;
}

export function MessagingScreen({ token }: { token: string }) {
  const customers = useData<any[]>('/customers', token);
  const [customerId, setCustomerId] = React.useState('');
  const [history, setHistory] = React.useState<any[] | null>(null);
  const [channel, setChannel] = React.useState('WHATSAPP');
  const [body, setBody] = React.useState(''); const [mediaUrl, setMediaUrl] = React.useState('');
  const [title, setTitle] = React.useState(''); const [preview, setPreview] = React.useState<any>(null); const [campaign, setCampaign] = React.useState<any>(null);
  const campaigns = useData<any[]>('/messaging/campaigns', token);
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const selected = (customers.data || []).find(c => c.id === customerId);
  return <Panel title="Customer messaging"><Feedback err={err || customers.err} ok={ok} /><p className="muted">Admin and Manager only. A customer must opt in before WhatsApp or SMS is sent.</p>
    <label>Customer<select value={customerId} onChange={async e => { setCustomerId(e.target.value); setHistory(null); if (e.target.value) { try { setHistory(await api('/messaging/customers/' + e.target.value + '/history', token)); } catch (x: any) { setErr(x.message); } } }}><option value="">Select</option>{(customers.data || []).map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone || 'no phone'}</option>)}</select></label>
    {selected && <p className="notice">WhatsApp is {selected.whatsapp_opt_in ? 'opted in' : 'not opted in'}. SMS is {selected.sms_opt_in ? 'opted in' : 'not opted in'}.</p>}
    {selected && <div className="row-actions"><span>WhatsApp opt-in</span><button type="button" className="ghost" onClick={async () => { try { await api(`/messaging/customers/${selected.id}/consent`, token, { method: 'POST', body: JSON.stringify({ whatsappOptIn: true }) }); setOk('WhatsApp opt-in saved'); await customers.load(); } catch (x: any) { setErr(x.message); } }}>Allow</button><button type="button" className="ghost" onClick={async () => { try { await api(`/messaging/customers/${selected.id}/consent`, token, { method: 'POST', body: JSON.stringify({ whatsappOptIn: false }) }); setOk('WhatsApp opt-in removed'); await customers.load(); } catch (x: any) { setErr(x.message); } }}>Remove</button><span>SMS opt-in</span><button type="button" className="ghost" onClick={async () => { try { await api(`/messaging/customers/${selected.id}/consent`, token, { method: 'POST', body: JSON.stringify({ smsOptIn: true }) }); setOk('SMS opt-in saved'); await customers.load(); } catch (x: any) { setErr(x.message); } }}>Allow</button><button type="button" className="ghost" onClick={async () => { try { await api(`/messaging/customers/${selected.id}/consent`, token, { method: 'POST', body: JSON.stringify({ smsOptIn: false }) }); setOk('SMS opt-in removed'); await customers.load(); } catch (x: any) { setErr(x.message); } }}>Remove</button></div>}
    <form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { await api(`/messaging/customers/${customerId}/send`, token, { method: 'POST', body: JSON.stringify({ channel, body, mediaUrl: mediaUrl || undefined }) }); setBody(''); setMediaUrl(''); setOk('Message sent'); setHistory(await api('/messaging/customers/' + customerId + '/history', token)); } catch (x: any) { setErr(x.message); } }}><div className="formgrid"><label>Channel<select value={channel} onChange={e => setChannel(e.target.value)}><option>WHATSAPP</option><option>SMS</option></select></label><label>Image URL<input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="WhatsApp only" /></label></div><label>Message<textarea value={body} onChange={e => setBody(e.target.value)} /></label><button disabled={!customerId}>Send</button></form>
    <h3>History</h3><Table rows={history || []} columns={[{ label: 'When', render: m => when(m.created_at) }, { label: 'Channel', render: m => m.channel }, { label: 'Direction', render: m => m.direction }, { label: 'Message', render: m => m.body || m.media_url || '—' }, { label: 'Status', render: m => <Badge value={m.status} /> }, { label: 'Failure', render: m => m.failure_reason || '—' }]} />
    <h3>Bulk campaign</h3>
    <div className="formgrid"><label>Title<input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Channel<select value={channel} onChange={e => setChannel(e.target.value)}><option>WHATSAPP</option><option>SMS</option></select></label></div>
    <label>Message<textarea value={body} onChange={e => setBody(e.target.value)} /></label>
    <div className="row-actions"><button type="button" className="ghost" onClick={async () => { try { setPreview(await api('/messaging/bulk/preview', token, { method: 'POST', body: JSON.stringify({ channel }) })); } catch (x: any) { setErr(x.message); } }}>Preview recipients</button>
      <button type="button" onClick={async () => { try { setCampaign(await api('/messaging/campaigns', token, { method: 'POST', body: JSON.stringify({ channel, title, body, mediaUrl }) })); setOk('Campaign drafted. Confirm before anything is sent.'); } catch (x: any) { setErr(x.message); } }}>Create draft</button>
      {campaign && <button type="button" className="okbtn" onClick={async () => { try { const r = await api(`/messaging/campaigns/${campaign.id}/confirm-send`, token, { method: 'POST' }); setCampaign(null); setOk(`Campaign finished: ${r.status}. Sent ${r.sent_count}, failed ${r.failed_count}.`); await campaigns.load(); } catch (x: any) { setErr(x.message); } }}>Confirm send</button>}</div>
    {preview && <p className="notice">{preview.recipientCount} opted-in recipient(s) on {preview.channel}.</p>}
    <h3>Campaigns</h3><Table rows={campaigns.data} columns={[{ label: 'When', render: c => when(c.created_at) }, { label: 'Title', render: c => c.title }, { label: 'Channel', render: c => c.channel }, { label: 'Status', render: c => <Badge value={c.status} /> }, { label: 'Recipients', render: c => c.recipient_count }, { label: 'Sent', render: c => c.sent_count }, { label: 'Failed', render: c => c.failed_count }]} />
  </Panel>;
}

export function DevicesScreen({ token }: { token: string }) {
  const devices = useData<any[]>('/trusted-devices', token);
  const users = useData<any[]>('/users', token);
  const locations = useData<any[]>('/locations', token);
  const [deviceName, setDeviceName] = React.useState(''); const [locationId, setLocationId] = React.useState('');
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const [issued, setIssued] = React.useState<any>(null);
  const [deviceId, setDeviceId] = React.useState(''); const [deviceToken, setDeviceToken] = React.useState('');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const toggle = (id: string) => setUserIds(userIds.includes(id) ? userIds.filter(x => x !== id) : [...userIds, id]);
  return <Panel title="Trusted devices" onRefresh={() => devices.load().catch(() => undefined)}><Feedback err={err || devices.err} ok={ok} />
    <form onSubmit={async e => { e.preventDefault(); setErr(''); setOk(''); try { const d = await api('/trusted-devices', token, { method: 'POST', body: JSON.stringify({ deviceName, locationId, userIds }) }); setIssued(d); setDeviceName(''); setUserIds([]); setOk('Device registered. Copy the token now. It is not shown again.'); await devices.load(); } catch (x: any) { setErr(x.message); } }}>
      <div className="formgrid"><label>Device name<input value={deviceName} onChange={e => setDeviceName(e.target.value)} required /></label><label>Location<select value={locationId} onChange={e => setLocationId(e.target.value)} required><option value="">Select</option>{(locations.data || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div>
      <div className="checks">{(users.data || []).filter(u => u.active !== false).map(u => <label key={u.id}><span><input type="checkbox" checked={userIds.includes(u.id)} onChange={() => toggle(u.id)} /> {u.full_name || u.username} · {u.role}</span></label>)}</div>
      <button>Register device</button></form>
    {issued && <p className="notice">Device token: {issued.deviceToken}</p>}
    <Table rows={devices.data} columns={[{ label: 'Name', render: d => d.device_name }, { label: 'Device id', render: d => d.device_id }, { label: 'Users', render: d => d.authorized_users }, { label: 'Status', render: d => <Badge value={d.active ? 'ACTIVE' : 'INACTIVE'} /> }, { label: 'Last seen', render: d => when(d.last_seen_at) }, { label: 'Actions', render: d => d.active ? <button type="button" className="danger" onClick={async () => { try { await api(`/trusted-devices/${d.id}/revoke`, token, { method: 'POST' }); setOk('Device revoked'); await devices.load(); } catch (x: any) { setErr(x.message); } }}>Revoke</button> : '—' }]} />
    <h3>Authorize this sign-in for offline use</h3>
    <form className="formgrid" onSubmit={async e => { e.preventDefault(); try { const r = await api('/trusted-devices/offline/authorize', token, { method: 'POST', body: JSON.stringify({ deviceId, deviceToken }) }); setOk(`Offline authorization issued. It expires in ${r.expiresInHours} hours.`); } catch (x: any) { setErr(x.message); } }}><label>Device id<input value={deviceId} onChange={e => setDeviceId(e.target.value)} required /></label><label>Device token<input value={deviceToken} onChange={e => setDeviceToken(e.target.value)} required /></label><button>Authorize offline</button></form>
  </Panel>;
}

export function BackupScreen({ token }: { token: string }) {
  const backups = useData<any[]>('/backups', token);
  const [confirm, setConfirm] = React.useState(''); const [selected, setSelected] = React.useState('');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState(''); const [busy, setBusy] = React.useState(false);
  return <Panel title="Backup and restore" onRefresh={() => backups.load().catch(() => undefined)}><Feedback err={err || backups.err} ok={ok} />
    <p className="notice">Restore replaces the live database. Type the confirmation exactly, then restore.</p>
    <button type="button" disabled={busy} onClick={async () => { setBusy(true); setErr(''); setOk(''); try { const r = await api('/backups/now', token, { method: 'POST' }); setOk(`Backup ${r.status}`); await backups.load(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }}>{busy ? 'Working…' : 'Back up now'}</button>
    <form className="formgrid" onSubmit={async e => { e.preventDefault(); setBusy(true); setErr(''); setOk(''); try { const r = await api(`/backups/${selected}/restore`, token, { method: 'POST', body: JSON.stringify({ confirmation: confirm }) }); setOk(r.note || 'Restore finished'); setConfirm(''); await backups.load(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }}>
      <label>Backup<select value={selected} onChange={e => setSelected(e.target.value)} required><option value="">Select a succeeded backup</option>{(backups.data || []).filter(b => b.status === 'SUCCEEDED').map(b => <option key={b.id} value={b.id}>{when(b.started_at)} · {b.backup_type}</option>)}</select></label>
      <label>Type RESTORE RWANIMU DATABASE<input value={confirm} onChange={e => setConfirm(e.target.value)} required /></label><button className="danger" disabled={busy || confirm !== 'RESTORE RWANIMU DATABASE'}>Restore</button></form>
    <Table rows={backups.data} columns={[{ label: 'Started', render: b => when(b.started_at) }, { label: 'Type', render: b => b.backup_type }, { label: 'Status', render: b => <Badge value={b.status} /> }, { label: 'Size', render: b => b.size_bytes ? `${Math.round(Number(b.size_bytes) / 1024)} KB` : '—' }, { label: 'Checksum', render: b => b.checksum_sha256 ? String(b.checksum_sha256).slice(0, 12) + '…' : '—' }]} />
  </Panel>;
}

export function MonitoringScreen({ token }: { token: string }) {
  const summary = useData<any>('/monitoring/health-summary', token);
  const incidents = useData<any[]>('/monitoring/incidents', token);
  const audit = useData<any[]>('/monitoring/audit', token);
  const [tab, setTab] = React.useState('health');
  const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const s = summary.data || {};
  const act = async (id: string, action: 'acknowledge' | 'resolve') => { try { await api(`/monitoring/incidents/${id}/${action}`, token, { method: 'PATCH' }); setOk(action === 'acknowledge' ? 'Incident acknowledged' : 'Incident resolved'); await incidents.load(); await summary.load(); } catch (x: any) { setErr(x.message); } };
  return <Panel title="Monitoring" onRefresh={() => { summary.load().catch(() => undefined); incidents.load().catch(() => undefined); audit.load().catch(() => undefined); }}><Feedback err={err || summary.err} ok={ok} />
    <div className="tabs"><button type="button" className={tab === 'health' ? 'active' : ''} onClick={() => setTab('health')}>Health</button><button type="button" className={tab === 'incidents' ? 'active' : ''} onClick={() => setTab('incidents')}>Incidents</button><button type="button" className={tab === 'audit' ? 'active' : ''} onClick={() => setTab('audit')}>Audit trail</button></div>
    {tab === 'health' && <div className="cards">{[['Open sync conflicts', s.open_sync_conflicts], ['Sync needs review', s.sync_needs_review], ['Rejected sync (24h)', s.rejected_sync_24h], ['Backup failures (7d)', s.backup_failures_7d], ['Devices needing attention', s.trusted_devices_attention], ['Open incidents', s.open_incidents]].map(([l, v]) => <div className="stat" key={String(l)}><span>{l}</span><b>{v ?? '—'}</b></div>)}</div>}
    {tab === 'incidents' && <Table rows={incidents.data} columns={[{ label: 'When', render: i => when(i.created_at) }, { label: 'Severity', render: i => <Badge value={i.severity} /> }, { label: 'Title', render: i => i.title }, { label: 'Message', render: i => i.safe_message }, { label: 'Status', render: i => <Badge value={i.status} /> }, { label: 'Actions', render: i => <div className="row-actions">{i.status === 'OPEN' && <button type="button" className="ghost" onClick={() => act(i.id, 'acknowledge')}>Acknowledge</button>}{i.status !== 'RESOLVED' && <button type="button" onClick={() => act(i.id, 'resolve')}>Resolve</button>}</div> }]} />}
    {tab === 'audit' && <Table rows={audit.data} columns={[{ label: 'When', render: a => when(a.created_at) }, { label: 'User', render: a => a.username || '—' }, { label: 'Action', render: a => a.action }, { label: 'Entity', render: a => `${a.entity_type || ''} ${a.entity_id || ''}`.trim() || '—' }, { label: 'Severity', render: a => a.severity || '—' }]} />}
  </Panel>;
}

export function PhysicalScreen({ token }: { token: string }) {
  const [d, setD] = React.useState<any>(null); const [err, setErr] = React.useState(''); const [ok, setOk] = React.useState('');
  const load = React.useCallback(() => api('/physical-stock/daily', token).then(setD).catch(() => setD(null)), [token]);
  React.useEffect(() => { load(); }, [load]);
  return <Panel title="Physical stock count"><Feedback err={err} ok={ok} /><p className="notice">Enter the quantity you count. The system stock figure is not shown. Finish only after every item has a quantity.</p>
    <button type="button" onClick={async () => { setErr(''); try { await api('/physical-stock/daily', token, { method: 'POST' }); setOk('Daily count is open'); await load(); } catch (x: any) { setErr(x.message); } }}>Start / open daily count</button>
    {d?.status === 'COMPLETED' && <p className="banner">Today's count is complete: {d.matchStatus}</p>}
    {(d?.items || []).map((x: any) => <div className="countrow" key={x.productId}><span>{x.name}</span><input type="number" min="0" defaultValue={x.physicalQuantity ?? ''} onBlur={e => api(`/physical-stock/daily/items/${x.productId}`, token, { method: 'PATCH', body: JSON.stringify({ physicalQuantity: Number(e.target.value) }) }).then(() => setOk('Quantity saved')).catch((er: Error) => setErr(er.message))} /></div>)}
    {d?.status === 'DRAFT' && <button type="button" className="okbtn" onClick={async () => { setErr(''); try { const r = await api('/physical-stock/daily/complete', token, { method: 'POST' }); setD(r); setOk(`Count completed: ${r.matchStatus}`); } catch (x: any) { setErr(x.message); } }}>Complete count</button>}
  </Panel>;
}

export function Screen({ name, token, user }: { name: string; token: string; user: User }) {
  switch (name) {
    case 'Dashboard': return <DashboardScreen token={token} user={user} />;
    case 'Products': return <ProductsScreen token={token} />;
    case 'Stock': return <StockScreen token={token} user={user} />;
    case 'Purchases': return <PurchasesScreen token={token} />;
    case 'Sales': return <SalesScreen token={token} user={user} />;
    case 'Customers': return <CustomersScreen token={token} />;
    case 'Transfers': return <TransfersScreen token={token} user={user} />;
    case 'Expenses': return <ExpensesScreen token={token} user={user} />;
    case 'Reports': return <ReportsScreen token={token} user={user} />;
    case 'Users': return <UsersScreen token={token} user={user} />;
    case 'Messaging': return <MessagingScreen token={token} />;
    case 'Website CMS': return <section><h2>Public website CMS</h2><WebsiteCms token={token} /></section>;
    case 'Trusted Devices': return <DevicesScreen token={token} />;
    case 'Backup & Restore': return <BackupScreen token={token} />;
    case 'Monitoring': return <MonitoringScreen token={token} />;
    case 'Physical Stock Count': return <PhysicalScreen token={token} />;
    default: return <section><h2>{name}</h2></section>;
  }
}
