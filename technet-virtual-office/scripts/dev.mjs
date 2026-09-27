import {createServer} from 'node:http';
import {createHandler} from '../worker/index.js';
import {collectAssets} from './assets.mjs';
const args=process.argv.slice(2);const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1]};
const port=Number(option('--port',process.env.PORT||'4173'));const host=option('--host',process.env.HOST||'0.0.0.0');
const server=createServer(async(req,res)=>{try{const assets=await collectAssets(new URL('../public/',import.meta.url).pathname);const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);const request=new Request(`http://${req.headers.host||'localhost'}${req.url}`,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});const response=await createHandler(assets).fetch(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'text/plain'});res.end('Não foi possível atender a solicitação.')}});
server.listen(port,host,()=>console.log(`Local: http://${host}:${port}/`));
