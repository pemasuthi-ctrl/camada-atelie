import {json,equal,configured,makeSession,authenticated,cookie,sameOrigin,bodyJSON} from '../lib/http.js';
export function GET(req){return json({configured:configured(),authenticated:configured()&&authenticated(req)});}
export async function POST(req){
  if(!sameOrigin(req))return json({error:'Origem não permitida.'},403);
  if(!configured())return json({error:'Configure APP_PASSWORD, SHEETS_URL e SHEETS_TOKEN na Vercel e publique novamente.'},503);
  let body;try{body=await bodyJSON(req);}catch{return json({error:'Pedido inválido.'},400);}
  if(typeof body.password!=='string'||!equal(body.password,process.env.APP_PASSWORD))return json({error:'Senha incorreta.'},401);
  return json({ok:true},200,{'Set-Cookie':cookie(req,makeSession())});
}
export function DELETE(req){if(!sameOrigin(req))return json({error:'Origem não permitida.'},403);return json({ok:true},200,{'Set-Cookie':cookie(req,'',0)});}
