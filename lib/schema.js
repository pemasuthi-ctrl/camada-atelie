export const collections = {
  orders: {sheet:'Vendas', fields:['id','name','customer','type','date','due','quantity','price','cost','paid','status'], labels:['ID','Produto','Cliente','Tipo','Data da venda','Entrega','Quantidade','Preço unitário','Custo unitário','Recebido','Status']},
  products: {sheet:'Produtos', fields:['id','name','quantity','price','cost'], labels:['ID','Produto','Quantidade de referência','Preço unitário','Custo unitário']},
  movements: {sheet:'Financeiro', fields:['id','description','type','date','amount'], labels:['ID','Descrição','Categoria','Data do pagamento','Valor']}
};
export function validDate(v){return typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function validateRecord(kind, record){
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
export function sameRecord(kind,a,b){if(a==null||b==null)return a==null&&b==null;return collections[kind].fields.every(k=>a[k]===b[k]);}
export function validateOperation(body){
  if(!body||!Object.hasOwn(collections,body.collection)||!['upsert','delete'].includes(body.action))throw Error('Operação inválida.');
  const {collection,action}=body;
  const expected=body.expected==null?null:validateRecord(collection,body.expected);
  const record=action==='upsert'?validateRecord(collection,body.record):null;
  const id=record?.id||expected?.id;
  if(!id||(expected&&record&&expected.id!==record.id))throw Error('Identificador inválido.');
  return {collection,action,expected,record,id};
}
