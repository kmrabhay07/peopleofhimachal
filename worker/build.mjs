import { readFile, mkdir, writeFile, readdir, cp } from 'node:fs/promises';

const html = await readFile('dist/index.html','utf8');
const assets = await Promise.all((await readdir('dist/assets')).filter(file=>html.includes('./assets/'+file)).map(async file=>[
  '/assets/'+file, [file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8',await readFile('dist/assets/'+file,'utf8')]
]));
const files = Object.fromEntries([['/',['text/html; charset=utf-8',html]],...assets]);
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
await writeFile('dist/server/index.js',(await readFile('worker/presence.js','utf8'))+`
const files = ${JSON.stringify(files)};
export default {async fetch(request,env) {
  const path = new URL(request.url).pathname;
  if (path === '/api/presence') return presence(request,env);
  const file = Object.hasOwn(files,path) && files[path];
  return file ? new Response(file[1],{headers:{'Content-Type':file[0]}}) : new Response('Not found',{status:404});
}};
`);
