import {createHmac,timingSafeEqual} from 'node:crypto';
export const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function configured(){return !!(process.env.APP_PASSWORD?.length>=16&&process.env.SHEETS_TOKEN?.length>=32&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(process.env.SHEETS_URL||''));}
function sign(value){return createHmac('sha256',process.env.APP_PASSWORD||'').update(value).digest('base64url');}
export function makeSession(){const expires=String(Date.now()+8*60*60*1000);return expires+'.'+sign(expires);}
export function authenticated(req){const token=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('camada_session='))?.slice(15)||'';const [expires,signature]=token.split('.');return /^\d+$/.test(expires||'')&&Number(expires)>Date.now()&&equal(signature||'',sign(expires));}
export function cookie(req,value,maxAge=28800){return `camada_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
export function sameOrigin(req){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
export async function bodyJSON(req){const text=await req.text();if(text.length>20000)throw Error('Registro muito grande.');return JSON.parse(text);}
