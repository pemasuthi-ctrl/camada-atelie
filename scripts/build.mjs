import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await mkdir(new URL('public/',root),{recursive:true});
for(const f of ['index.html','app.js','style.css','core.js'])await copyFile(new URL(f,root),new URL('public/'+f,root));
const schema=(await readFile(new URL('lib/schema.js',root),'utf8')).replaceAll('export ','').replace('Object.hasOwn(collections,body.collection)','Object.prototype.hasOwnProperty.call(collections,body.collection)');
await writeFile(new URL('google-sheets/Code.gs',root),schema+'\n'+await readFile(new URL('google-sheets/backend.template.txt',root),'utf8'));
console.log('Interface preparada em public/ e conector em google-sheets/Code.gs.');
