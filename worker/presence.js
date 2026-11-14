export async function presence(request, env) {
  if (request.method !== 'POST') return new Response(null, {status:405});
  if (request.headers.get('Origin') !== new URL(request.url).origin) return new Response(null,{status:403});
  const reader = request.body?.getReader();
  if (!reader) return new Response(null,{status:400});
  const decoder = new TextDecoder();
  let raw = '', size = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 768) { await reader.cancel(); return new Response(null,{status:413}); }
    raw += decoder.decode(value,{stream:true});
  }
  let p;
  try { p=JSON.parse(raw+decoder.decode()); } catch { return new Response(null,{status:400}); }
  if (!p || typeof p.id !== 'string' || !/^[a-f0-9-]{36}$/.test(p.id) ||
      !Number.isInteger(p.district) || p.district<0 || p.district>4 ||
      ![p.x,p.z,p.yaw].every(Number.isFinite) || Math.abs(p.x)>24 || p.z < -63 || p.z > 35) {
    return new Response(null,{status:400});
  }
  const now = Math.floor(Date.now()/1000);
  const db = env.DB;
  if (!db) return new Response(null,{status:503});
  const fresh = db.prepare('DELETE FROM visitors WHERE seen < ?').bind(now-12);
  const write = p.leave
    ? db.prepare('DELETE FROM visitors WHERE id = ?').bind(p.id)
    : db.prepare('INSERT INTO visitors(id,district,x,z,yaw,seen) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM visitors)<256 OR EXISTS(SELECT 1 FROM visitors WHERE id=?) ON CONFLICT(id) DO UPDATE SET district=excluded.district,x=excluded.x,z=excluded.z,yaw=excluded.yaw,seen=excluded.seen WHERE visitors.seen<excluded.seen').bind(p.id,p.district,p.x,p.z,p.yaw,now,p.id);
  const read = db.prepare('SELECT id,x,z,yaw FROM visitors WHERE district=? AND id<>? ORDER BY seen DESC LIMIT 40').bind(p.district,p.id);
  const [, , result] = await db.batch([fresh,write,read]);
  return Response.json(result.results,{headers:{'Cache-Control':'no-store'}});
}
