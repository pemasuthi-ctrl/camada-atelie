import http from 'node:http';
import {readFile} from 'node:fs/promises';
import * as session from '../api/session.js';
import * as data from '../api/data.js';
const root=new URL('../',import.meta.url);
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://'+req.headers.host);
    if(url.pathname.startsWith('/api/')){
      const route={'/api/session':session,'/api/data':data}[url.pathname],handler=route?.[req.method];
      if(!handler){res.writeHead(404);return res.end();}
      let body='';for await(const chunk of req){body+=chunk;if(body.length>24000){res.writeHead(413);return res.end();}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(body?{body}:{})});const response=await handler(request);
      res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
    }
    const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
    if(!['index.html','app.js','core.js','style.css'].includes(name)){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(await readFile(new URL(name,root)));
  }catch{res.writeHead(500);res.end('Erro ao abrir o aplicativo.');}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
