import test from 'node:test';import assert from 'node:assert/strict';import {quote,totals} from './core.js';
const p={quantity:1,weight:95,hours:2,minutes:42,colors:1,pack:true,labor:0,purge:0};
test('Exemplo do PDF e fronteiras de quantidade',()=>{for(const [quantity,price]of [[1,39.22],[9,39.22],[10,35.30],[20,35.30],[21,31.38]]){const r=quote({...p,quantity});assert.equal(r.cost,19.61);assert.equal(r.price,price);}});
test('Multicolor exige perda e inclui purga',()=>{assert.throws(()=>quote({...p,colors:2}));assert.equal(quote({...p,colors:2,loss:0,purge:19}).cost,19.61);});
test('Mão de obra pelo lote é rateada',()=>{assert.equal(quote({...p,quantity:10,labor:30,laborScope:'lote'}).cost,21.11);});
test('Financeiro separa pagamentos, custos, despesas e cancelamentos',()=>{const r=totals({orders:[{quantity:300,price:6,cost:2,paid:900,status:'Na fila'},{quantity:1,price:100,cost:50,paid:0,status:'Cancelado'}],movements:[{type:'Investimento',amount:1000},{type:'Despesa',amount:100}]});assert.equal(r.revenue,1800);assert.equal(r.profit,1100);assert.equal(r.pending,900);assert.equal(r.cash,-200);assert.equal(r.debt,800);});
