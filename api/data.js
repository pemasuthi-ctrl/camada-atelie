import {json,configured,authenticated,sameOrigin,bodyJSON} from '../lib/http.js';
import {validateOperation} from '../lib/schema.js';
async function forward(operation){
  try{
    const response=await fetch(process.env.SHEETS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...operation,token:process.env.SHEETS_TOKEN}),redirect:'follow',signal:AbortSignal.timeout(25000)});
    if(!response.ok)throw Error('upstream');
    let result;try{result=await response.json();}catch{return json({error:'O Google não retornou dados. Confira a URL /exec e o acesso “Qualquer pessoa” na implantação do Apps Script.'},502);}
    if(!result.ok)return json({error:result.error||'Falha ao acessar a planilha.',code:result.code},result.code==='CONFLICT'?409:502);
    return json(result);
  }catch{return json({error:'Não foi possível confirmar a operação no Google Sheets. Atualize os dados antes de tentar novamente: a gravação pode ter sido concluída.'},502);}
}
function denied(req){if(!configured())return json({error:'Conexão não configurada. Consulte o passo a passo.'},503);if(!authenticated(req))return json({error:'Sua sessão expirou. Entre novamente.'},401);}
export async function GET(req){return denied(req)||forward({action:'read'});}
export async function POST(req){const error=denied(req);if(error)return error;if(!sameOrigin(req))return json({error:'Origem não permitida.'},403);let operation;try{operation=validateOperation(await bodyJSON(req));}catch(e){return json({error:e.message},400);}return forward(operation);}
