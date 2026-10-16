import { validateServer, validateServerDetails } from '../src/server-model.mjs';

const encoder = new TextEncoder();
const hex = buffer => [...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
export async function digest(value) {return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export async function passwordHash(password,salt) {
 const key = await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));
}
function equal(a,b) {if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function publicServer(row) {return {id:row.id,name:row.name,description:row.description,category:row.category,url:row.url,promoted:!!row.promoted,details:validateServerDetails(JSON.parse(row.details||'{}'))};}
function adminServer(row) {return {...publicServer(row),published:!!row.published,revision:row.revision};}
async function body(request) {
 if(!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_body');
 const reader=request.body?.getReader();if(!reader)throw new Error('invalid_body');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw new Error('invalid_body');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('invalid_body');}
}
export default {
 async scheduled(event,env) {
  const now=Math.floor(event.scheduledTime/1000);
  await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),env.DB.prepare('DELETE FROM login_limits WHERE expires_at<=?').bind(now)]);
 },
 async fetch(request,env) {
  const origin=request.headers.get('Origin');
  const allowed=(env.ALLOWED_ORIGINS||'https://kiroshirp.github.io').split(',');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
  if(origin&&allowed.includes(origin)) headers['Access-Control-Allow-Origin']=origin;
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!allowed.includes(origin))return reply({error:'origin_denied'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  const now=Math.floor(Date.now()/1000);
  try {
   if(path==='/servers'&&request.method==='GET') {
    const {results}=await env.DB.prepare('SELECT id,name,description,category,url,promoted,details FROM servers WHERE published=1 ORDER BY promoted DESC,name COLLATE NOCASE,id').all();
    return reply({servers:results.map(publicServer)});
   }
   if(!env.ADMIN_USERNAME_HASH||!env.ADMIN_PASSWORD_HASH||!env.ADMIN_SALT)return reply({error:'not_configured'},503);
   if(path==='/admin/login'&&request.method==='POST') {
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    const key=await digest(`${env.ADMIN_SALT}:${ip}`);
    const limit=await env.DB.prepare('INSERT INTO login_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING attempts').bind(key,now+900,now,now).first();
    if(limit.attempts>10)return reply({error:'rate_limited'},429);
    const input=await body(request);
    if(typeof input.username!=='string'||typeof input.password!=='string'||input.username.length>128||input.password.length>512)return reply({error:'invalid_credentials'},401);
    const [username,password]=await Promise.all([digest(input.username),passwordHash(input.password,env.ADMIN_SALT)]);
    if(!equal(username,env.ADMIN_USERNAME_HASH)||!equal(password,env.ADMIN_PASSWORD_HASH))return reply({error:'invalid_credentials'},401);
    const token=hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.batch([
     env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),
     env.DB.prepare('DELETE FROM login_limits WHERE expires_at<=? OR key=?').bind(now,key),
     env.DB.prepare('INSERT INTO sessions(token_hash,auth_version,expires_at) VALUES(?,?,?)').bind(await digest(token),env.ADMIN_PASSWORD_HASH,now+3600)
    ]);
    return reply({token,expiresAt:now+3600});
   }
   const authorization=request.headers.get('Authorization')||'';
   if(!/^Bearer [a-f0-9]{64}$/.test(authorization))return reply({error:'unauthorized'},401);
   const tokenHash=await digest(authorization.slice(7));
   const session=await env.DB.prepare('SELECT expires_at FROM sessions WHERE token_hash=? AND auth_version=? AND expires_at>?').bind(tokenHash,env.ADMIN_PASSWORD_HASH,now).first();
   if(!session)return reply({error:'unauthorized'},401);
   if(path==='/admin/logout'&&request.method==='POST') {await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash).run();return reply({ok:true});}
   if(path==='/admin/servers'&&request.method==='GET') {
    const {results}=await env.DB.prepare('SELECT * FROM servers ORDER BY promoted DESC,name COLLATE NOCASE,id').all();return reply({servers:results.map(adminServer)});
   }
   if(path==='/admin/servers'&&request.method==='POST') {
    const value=validateServer(await body(request)),id=crypto.randomUUID();
    const row=await env.DB.prepare('INSERT INTO servers(id,name,description,category,url,promoted,published,details,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) RETURNING *').bind(id,value.name,value.description,value.category,value.url,Number(value.promoted),Number(value.published),JSON.stringify(value.details),now,now).first();return reply({server:adminServer(row)},201);
   }
   const match=path.match(/^\/admin\/servers\/([a-f0-9-]{36})$/);
   if(match&&request.method==='DELETE') {
    const input=await body(request);
    if(!Number.isSafeInteger(input.revision)||input.revision<1)return reply({error:'invalid_server'},400);
    const deleted=await env.DB.prepare('DELETE FROM servers WHERE id=? AND revision=? RETURNING id').bind(match[1],input.revision).first();
    return deleted?reply({deletedId:deleted.id}):reply({error:'conflict'},409);
   }
   if(match&&request.method==='PUT') {
    const input=await body(request),value=validateServer(input);
    if(!Number.isSafeInteger(input.revision)||input.revision<1)return reply({error:'invalid_server'},400);
    const row=await env.DB.prepare('UPDATE servers SET name=?,description=?,category=?,url=?,promoted=?,published=?,details=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING *').bind(value.name,value.description,value.category,value.url,Number(value.promoted),Number(value.published),JSON.stringify(value.details),now,match[1],input.revision).first();
    return row?reply({server:adminServer(row)}):reply({error:'conflict'},409);
   }
   return reply({error:'not_found'},404);
  } catch(error) {
   if(['invalid_server','invalid_url','invalid_body'].includes(error.message))return reply({error:error.message},400);
   return reply({error:'server_error'},500);
  }
 }
};
