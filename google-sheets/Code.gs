const collections = {
  orders: {sheet:'Vendas', fields:['id','name','customer','type','date','due','quantity','price','cost','paid','status'], labels:['ID','Produto','Cliente','Tipo','Data da venda','Entrega','Quantidade','Preço unitário','Custo unitário','Recebido','Status']},
  products: {sheet:'Produtos', fields:['id','name','quantity','price','cost'], labels:['ID','Produto','Quantidade de referência','Preço unitário','Custo unitário']},
  movements: {sheet:'Financeiro', fields:['id','description','type','date','amount'], labels:['ID','Descrição','Categoria','Data do pagamento','Valor']}
};
function validDate(v){return typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
function validateRecord(kind, record){
  const spec=collections[kind];
  if(!spec||!record||typeof record!=='object'||Array.isArray(record))throw Error('Registro inválido.');
  const out={};
  for(const key of spec.fields){
    const v=record[key];
    if(['quantity','price','cost','paid','amount'].includes(key)){
      if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e9)throw Error('Valor inválido: '+key);
      if(key==='quantity'&&(!Number.isInteger(v)||v<1||v>1000000))throw Error('Quantidade inválida.');
      if(['price','amount'].includes(key)&&v<=0)throw Error('Informe um valor maior que zero.');
    }else{
      if(typeof v!=='string'||v.length>500||(/[\u0000-\u0008]/).test(v))throw Error('Texto inválido: '+key);
      if(key!=='customer'&&!v.trim())throw Error('Preencha os campos obrigatórios.');
      if(key==='id'&&!/^[a-zA-Z0-9-]{1,80}$/.test(v))throw Error('ID inválido.');
      if(['date','due'].includes(key)&&!validDate(v))throw Error('Data inválida.');
    }
    out[key]=v;
  }
  if(kind==='orders'){
    if(!['Encomenda','Venda presencial'].includes(out.type)||!['Na fila','Em produção','Pronto','Entregue','Cancelado'].includes(out.status))throw Error('Tipo ou status inválido.');
    if(out.due<out.date)throw Error('Entrega anterior à venda.');
    if(out.paid>Math.round((out.quantity*out.price+Number.EPSILON)*100)/100)throw Error('Recebido maior que o total.');
    if(out.status==='Cancelado'&&out.paid!==0)throw Error('Registre o reembolso antes de cancelar.');
  }
  if(kind==='movements'&&!['Investimento','Despesa'].includes(out.type))throw Error('Categoria inválida.');
  return out;
}
function sameRecord(kind,a,b){if(a==null||b==null)return a==null&&b==null;return collections[kind].fields.every(k=>a[k]===b[k]);}
function validateOperation(body){
  if(!body||!Object.prototype.hasOwnProperty.call(collections,body.collection)||!['upsert','delete'].includes(body.action))throw Error('Operação inválida.');
  const {collection,action}=body;
  const expected=body.expected==null?null:validateRecord(collection,body.expected);
  const record=action==='upsert'?validateRecord(collection,body.record):null;
  const id=record?.id||expected?.id;
  if(!id||(expected&&record&&expected.id!==record.id))throw Error('Identificador inválido.');
  return {collection,action,expected,record,id};
}

// Camada: cole TODO o arquivo Code.gs no Apps Script vinculado à sua planilha.
// Configure CAMADA_TOKEN nas Propriedades do script. Não coloque senhas aqui.

function prepararPlanilha(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw Error('Abra o Apps Script pelo menu Extensões da planilha.');
  PropertiesService.getScriptProperties().setProperty('CAMADA_SHEET_ID',ss.getId());
  Object.keys(collections).forEach(function(kind){
    const spec=collections[kind];let sh=ss.getSheetByName(spec.sheet);
    if(!sh)sh=ss.insertSheet(spec.sheet);
    if(sh.getLastRow()===0){sh.getRange(1,1,1,spec.fields.length).setValues([spec.labels]);sh.setFrozenRows(1);sh.getRange(1,1,1,spec.fields.length).setBackground('#244d42').setFontColor('#ffffff').setFontWeight('bold');sh.autoResizeColumns(1,spec.fields.length);}
    else if(JSON.stringify(sh.getRange(1,1,1,spec.fields.length).getValues()[0])!==JSON.stringify(spec.labels))throw Error('A aba '+spec.sheet+' já existe com outras colunas. Use uma planilha nova.');
  });
  SpreadsheetApp.flush();
}
function sheet_(kind){const props=PropertiesService.getScriptProperties();const sid=props.getProperty('CAMADA_SHEET_ID');if(!sid)throw Error('Execute prepararPlanilha primeiro.');const sh=SpreadsheetApp.openById(sid).getSheetByName(collections[kind].sheet);if(!sh)throw Error('Aba ausente. Execute prepararPlanilha.');return sh;}
function rows_(kind){const sh=sheet_(kind),spec=collections[kind];if(JSON.stringify(sh.getRange(1,1,1,spec.fields.length).getValues()[0])!==JSON.stringify(spec.labels))throw Error('Não altere os cabeçalhos da aba '+spec.sheet+'.');if(sh.getLastRow()<2)return [];return sh.getRange(2,1,sh.getLastRow()-1,spec.fields.length).getValues().map(function(row,index){const record={};spec.fields.forEach(function(k,i){let v=row[i];if(v instanceof Date)v=Utilities.formatDate(v,'America/Sao_Paulo','yyyy-MM-dd');record[k]=v;});return {row:index+2,record:record};}).filter(function(x){return x.record.id!=='';});}
function state_(){const result={version:1,demo:false};Object.keys(collections).forEach(function(k){result[k]=rows_(k).map(function(x){return validateRecord(k,x.record);});});return result;}
function response_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  let lock;
  try{
    if(!e||!e.postData||e.postData.contents.length>22000)return response_({ok:false,error:'Pedido inválido.'});
    const body=JSON.parse(e.postData.contents),token=PropertiesService.getScriptProperties().getProperty('CAMADA_TOKEN');
    if(!token||token.length<32||body.token!==token)return response_({ok:false,error:'Chave de conexão inválida. Confira CAMADA_TOKEN e SHEETS_TOKEN.'});
    lock=LockService.getScriptLock();if(!lock.tryLock(10000))return response_({ok:false,error:'Planilha ocupada. Aguarde alguns segundos e atualize.'});
    if(body.action==='read')return response_({ok:true,state:state_()});
    const op=validateOperation(body),kind=op.collection,sh=sheet_(kind),spec=collections[kind],rows=rows_(kind),matches=rows.filter(function(x){return x.record.id===op.id;});
    if(matches.length>1)throw Error('ID duplicado na planilha. Remova a duplicação antes de continuar.');
    const found=matches[0],current=found?found.record:null;
    // Repetir uma operação já concluída não cria outra linha.
    if((op.action==='upsert'&&sameRecord(kind,current,op.record))||(op.action==='delete'&&!current))return response_({ok:true,state:state_()});
    if(!sameRecord(kind,current,op.expected))return response_({ok:false,code:'CONFLICT',error:'Este registro mudou em outro dispositivo. Atualize os dados e faça a alteração novamente.'});
    if(op.action==='delete')sh.deleteRow(found.row);
    else{
      const rowIndex=found?found.row:sh.getLastRow()+1;
      if(rowIndex>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),1);
      // Células de texto usam formato texto e escape para não executar fórmulas.
      const values=spec.fields.map(function(k){const v=op.record[k];return typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v;});
      spec.fields.forEach(function(k,i){sh.getRange(rowIndex,i+1).setNumberFormat(typeof op.record[k]==='number'?(k==='quantity'?'0':'0.00'):'@');});
      sh.getRange(rowIndex,1,1,spec.fields.length).setValues([values]);
    }
    SpreadsheetApp.flush();return response_({ok:true,state:state_()});
  }catch(err){return response_({ok:false,error:String(err.message||err)});}
  finally{if(lock&&lock.hasLock())lock.releaseLock();}
}
function doGet(){return response_({ok:false,error:'Conexão do Camada ativa. Acesse pelo site com sua senha.'});}
