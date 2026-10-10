export const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function quote(p){
 const q=Number(p.quantity),w=Number(p.weight),h=Number(p.hours)+Number(p.minutes)/60;
 if(!Number.isInteger(q)||q<1||!Number.isFinite(w)||w<=0||!Number.isFinite(h)||h<0)throw Error('Informe peso, tempo e quantidade válidos.');
 if(Number(p.colors)>1&&(p.loss===''||p.loss==null))throw Error('Informe a perda confirmada para multicolor.');
 const loss=Number(p.colors)===1?20:Number(p.loss);
 if(!Number.isFinite(loss)||loss<0)throw Error('A perda deve ser um percentual positivo ou zero.');
 const parts={Filamento:(w*(1+loss/100)+Number(p.purge||0))*0.12,'Máquina / manutenção':h*2,Energia:h*0.15,Embalagem:p.pack?0.12:0,'Mão de obra':Number(p.labor||0)/60*30/(p.laborScope==='lote'?q:1)};
 const cost=round(Object.values(parts).reduce((a,b)=>a+b,0)),factor=q<=9?2:q<=20?1.8:1.6,price=round(cost*factor);
 return {parts,cost,factor,price,total:round(price*q),loss};
}
export function totals(s){const orders=s.orders.filter(o=>o.status!=='Cancelado');const revenue=orders.reduce((a,o)=>a+o.quantity*o.price,0),received=orders.reduce((a,o)=>a+o.paid,0),cost=orders.reduce((a,o)=>a+o.quantity*o.cost,0),investment=s.movements.filter(x=>x.type==='Investimento').reduce((a,x)=>a+x.amount,0),expenses=s.movements.filter(x=>x.type==='Despesa').reduce((a,x)=>a+x.amount,0);return {revenue,received,cost,investment,expenses,profit:revenue-cost-expenses,cash:received-investment-expenses,debt:Math.max(0,investment-(received-cost-expenses)),pending:revenue-received};}
