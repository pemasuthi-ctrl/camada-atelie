import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {validateRecord} from './lib/schema.js';
import * as session from './api/session.js';
import * as api from './api/data.js';
import {makeSession} from './lib/http.js';
const source=await readFile(new URL('google-sheets/Code.gs',import.meta.url),'utf8');
// Modelo local das operações de planilha; não substitui o teste na conta Google.
export function sheetsHarness(){
 const sheets=new Map(),properties={CAMADA_TOKEN:'t'.repeat(48)};let locked=false;
 function makeSheet(){const data=[];return {data,getLastRow:()=>data.length,getMaxRows:()=>1000,insertRowsAfter(){},setFrozenRows(){},autoResizeColumns(){},deleteRow:r=>data.splice(r-1,1),getRange(r,c,h=1,w=1){const range={getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>data[r+i-1]?.[c+j-1]??'')),setValues(rows){rows.forEach((row,i)=>row.forEach((v,j)=>{data[r+i-1]??=[];data[r+i-1][c+j-1]=typeof v==='string'&&/^'[=+@-]/.test(v)?v.slice(1):v;}));return range;},setBackground(){return range;},setFontColor(){return range;},setFontWeight(){return range;},setNumberFormat(){return range;}};return range;}};}
 const ss={getId:()=>'test-sheet',getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=makeSheet();sheets.set(n,s);return s;}};
 const context=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>ss,flush(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],setProperty:(k,v)=>properties[k]=v})},LockService:{getScriptLock:()=>({tryLock:()=>{locked=true;return true;},hasLock:()=>locked,releaseLock:()=>locked=false})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})},Utilities:{formatDate:d=>d.toISOString().slice(0,10)}});
 vm.runInContext(source,context);context.prepararPlanilha();
 return {sheets,call:body=>JSON.parse(context.doPost({postData:{contents:JSON.stringify({token:properties.CAMADA_TOKEN,...body})}}))};
}
const order={id:'order-1',name:'Estrela sensorial',customer:'Teste',type:'Encomenda',date:'2026-10-10',due:'2026-10-12',quantity:300,price:6,cost:2.7,paid:900,status:'Na fila'};
test('Apps Script: grava 300 estrelas, lê, edita, rejeita conflito e exclui',()=>{
 const h=sheetsHarness();assert.equal(h.call({action:'read'}).state.orders.length,0);
 const put={action:'upsert',collection:'orders',record:order,expected:null};assert.equal(h.call(put).ok,true);assert.equal(h.sheets.get('Vendas').data[1][6],300);
 assert.equal(h.call(put).state.orders.length,1,'Repetir não duplica');
 const next={...order,status:'Em produção'};assert.equal(h.call({...put,record:next,expected:order}).ok,true);
 assert.equal(h.call({...put,record:{...order,paid:1000},expected:order}).code,'CONFLICT');
 assert.equal(h.call({action:'delete',collection:'orders',expected:next}).state.orders.length,0);
 assert.equal(h.call({action:'read',token:'errado'}).ok,false);
});
test('Apps Script: produtos, financeiro e texto iniciado com fórmula',()=>{
 const h=sheetsHarness();const p={id:'p1',name:'=Teste',quantity:1,price:20,cost:10};
 assert.equal(h.call({action:'upsert',collection:'products',record:p}).state.products[0].name,'=Teste');
 assert.equal(h.call({action:'upsert',collection:'movements',record:{id:'m1',description:'Impressora',type:'Investimento',date:'2026-10-10',amount:2000}}).state.movements[0].amount,2000);
});
test('Validação recusa datas, pagamentos e cancelamento inválidos',()=>{
 assert.throws(()=>validateRecord('orders',{...order,date:'2026-02-30'}));
 assert.throws(()=>validateRecord('orders',{...order,paid:2000}));
 assert.throws(()=>validateRecord('orders',{...order,status:'Cancelado'}));
 assert.throws(()=>validateRecord('orders',{...order,quantity:1.5}));
});
test('API: senha, cookie, gravação autenticada e leitura de outra sessão',async()=>{
 process.env.APP_PASSWORD='test-password-with-24-characters';process.env.SHEETS_TOKEN='t'.repeat(48);process.env.SHEETS_URL='https://script.google.com/macros/s/test/exec';
 const req=(path,method='GET',body,token)=>new Request('https://camada.example'+path,{method,headers:{'Content-Type':'application/json',...(token?{cookie:'camada_session='+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await api.GET(req('/api/data'))).status,401);
 assert.equal((await session.POST(req('/api/session','POST',{password:'wrong'}))).status,401);
 const login=await session.POST(req('/api/session','POST',{password:process.env.APP_PASSWORD}));assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/Secure/);
 const h=sheetsHarness(),original=global.fetch;global.fetch=async(_url,options)=>Response.json(h.call(JSON.parse(options.body)));
 try{
  const cookie=makeSession();const saved=await api.POST(req('/api/data','POST',{action:'upsert',collection:'orders',record:order},cookie));assert.equal(saved.status,200);
  const loaded=await api.GET(req('/api/data','GET',null,makeSession()));assert.equal((await loaded.json()).state.orders[0].quantity,300);
  const cross=new Request('https://camada.example/api/data',{method:'POST',headers:{cookie:'camada_session='+cookie,origin:'https://other.example'},body:'{}'});assert.equal((await api.POST(cross)).status,403);
  global.fetch=async()=>{throw Error('network');};assert.equal((await api.GET(req('/api/data','GET',null,cookie))).status,502);
 }finally{global.fetch=original;}
});
