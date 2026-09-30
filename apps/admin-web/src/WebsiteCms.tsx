import React from 'react';
type Item = { id: string; content_type: string; title: string; body?: string; image_url?: string; public_price?: number | null; status: string; sort_order: number };
const API = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
const blank = { contentType: 'ANNOUNCEMENT', title: '', body: '', imageUrl: null as string | null, publicPrice: '', sortOrder: '0' };

export function WebsiteCms({ token }: { token: string }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [draft, setDraft] = React.useState({ ...blank });
  const [edit, setEdit] = React.useState<any>(null);
  const [preview, setPreview] = React.useState<any>(null);
  const [err, setErr] = React.useState('');
  const headers: any = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const load = React.useCallback(() => fetch(`${API}/website-content/admin`, { headers }).then(async r => {
    const data = await r.json().catch(() => []);
    if (!r.ok) throw new Error(data.message || 'Could not load website content');
    setItems(Array.isArray(data) ? data : []);
  }).catch((e: Error) => { setErr(e.message); setItems([]); }), [token]);
  React.useEffect(() => { if (token) load(); }, [load, token]);
  const photo = (f: File | undefined, into: 'draft' | 'edit') => {
    if (!f) return;
    if (f.size > 2_500_000) { setErr('Photo is too large. Use an image below 2.5 MB.'); return; }
    const rd = new FileReader();
    rd.onload = () => {
      const imageUrl = String(rd.result);
      if (into === 'draft') setDraft(d => ({ ...d, imageUrl }));
      else setEdit((d: any) => ({ ...d, imageUrl }));
    };
    rd.readAsDataURL(f);
  };
  const save = async () => {
    setErr('');
    const body = { ...draft, publicPrice: draft.publicPrice === '' ? null : Number(draft.publicPrice), sortOrder: Number(draft.sortOrder || 0) };
    const r = await fetch(`${API}/website-content`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) { const data = await r.json().catch(() => ({})); setErr(data.message || 'Could not save website content'); return; }
    setDraft({ ...blank });
    load();
  };
  const saveEdit = async () => {
    setErr('');
    const body = { title: edit.title, body: edit.body, imageUrl: edit.imageUrl, publicPrice: edit.publicPrice === '' || edit.publicPrice == null ? null : Number(edit.publicPrice), sortOrder: Number(edit.sortOrder || 0) };
    const r = await fetch(`${API}/website-content/${edit.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (!r.ok) { const data = await r.json().catch(() => ({})); setErr(data.message || 'Could not update website content'); return; }
    setEdit(null);
    load();
  };
  const pub = async (id: string, publish: boolean) => { await fetch(`${API}/website-content/${id}/publish`, { method: 'POST', headers, body: JSON.stringify({ publish }) }); load(); };
  return <section className="card"><h2>Public Website Content</h2><p>Upload photos and communications here. Website design and animations are fixed by the system.</p>
    {err && <p className="error">{err}</p>}
    <label>Content type <select value={draft.contentType} onChange={e => setDraft({ ...draft, contentType: e.target.value })}><option>ANNOUNCEMENT</option><option>PRODUCT</option><option>ABOUT</option><option>HERO</option><option>CONTACT</option></select></label>
    <label>Title <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
    <label>Communication / description <textarea value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} /></label>
    <div className="formgrid"><label>Public price <input type="number" min="0" step="any" value={draft.publicPrice} onChange={e => setDraft({ ...draft, publicPrice: e.target.value })} placeholder="Optional" /></label><label>Sort order <input type="number" step="1" value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: e.target.value })} /></label></div>
    <label>Photo <input type="file" accept="image/*" onChange={e => photo(e.target.files?.[0], 'draft')} /></label>
    {draft.imageUrl && <img src={draft.imageUrl} alt="Preview" style={{ maxWidth: 240, maxHeight: 160, objectFit: 'cover' }} />}
    <button onClick={save} disabled={!draft.title.trim()}>Save Draft</button>
    {edit && <form className="formgrid" onSubmit={e => { e.preventDefault(); saveEdit(); }}><h3>Edit {edit.contentType}</h3><label>Title<input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} required /></label><label>Description<textarea value={edit.body || ''} onChange={e => setEdit({ ...edit, body: e.target.value })} /></label><label>Public price<input type="number" min="0" step="any" value={edit.publicPrice ?? ''} onChange={e => setEdit({ ...edit, publicPrice: e.target.value })} /></label><label>Sort order<input type="number" step="1" value={edit.sortOrder ?? 0} onChange={e => setEdit({ ...edit, sortOrder: e.target.value })} /></label><label>Replace photo<input type="file" accept="image/*" onChange={e => photo(e.target.files?.[0], 'edit')} /></label>{edit.imageUrl && <img src={edit.imageUrl} alt="" style={{ maxWidth: 160, maxHeight: 120, objectFit: 'cover' }} />}<div className="row-actions"><button>Save changes</button><button type="button" className="ghost" onClick={() => setEdit(null)}>Cancel</button></div></form>}
    <h3>Website items</h3>
    {items.map(x => <div key={x.id} className="cms-row"><b>{x.title}</b> <span>{x.content_type} · {x.status} · order {x.sort_order}{x.public_price != null ? ` · ${x.public_price} RWF` : ''}</span><button onClick={() => setPreview(x)}>Preview</button><button onClick={() => setEdit({ id: x.id, contentType: x.content_type, title: x.title, body: x.body || '', imageUrl: x.image_url || null, publicPrice: x.public_price ?? '', sortOrder: x.sort_order ?? 0 })}>Edit</button>{x.status === 'PUBLISHED' ? <button onClick={() => pub(x.id, false)}>Unpublish</button> : <button onClick={() => pub(x.id, true)}>Publish</button>}</div>)}
    {preview && <div className="cms-preview"><button onClick={() => setPreview(null)}>Close Preview</button>{preview.image_url && <img src={preview.image_url} alt={preview.title} />}<h3>{preview.title}</h3><p>{preview.body}</p>{preview.public_price != null && <p>{preview.public_price} RWF</p>}</div>}
  </section>;
}
