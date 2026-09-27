import {agents,routeOrder} from '../public/agents.js';

const PROVIDERS={openai:{name:'OpenAI',url:'https://api.openai.com/v1/chat/completions',key:'OPENAI_API_KEY'},groq:{name:'Groq',url:'https://api.groq.com/openai/v1/chat/completions',key:'GROQ_API_KEY'}};
const responseHeaders={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-store'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...responseHeaders,'Content-Type':'application/json; charset=utf-8'}});
function config(env,agentId){const id=String(env.AI_PROVIDER||(env.GROQ_API_KEY?'groq':'openai')).toLowerCase();const provider=PROVIDERS[id];const key=provider?env[provider.key]:null;const model=String((agentId&&env[`AI_MODEL_${agentId.toUpperCase()}`])||env.AI_MODEL||'').trim();return {provider,key,model,configured:!!(provider&&key&&model)};}
async function boundedJson(request){if(Number(request.headers.get('Content-Length')||0)>32768)throw new Error('large');const reader=request.body?.getReader();if(!reader)throw new Error('json');let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw new Error('large')}chunks.push(value)}}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return JSON.parse(new TextDecoder().decode(bytes));}

export function createHandler(assets={},fetcher=fetch){
  return {async fetch(request,env={}){
    const url=new URL(request.url);
    if(url.pathname==='/api/status'&&request.method==='GET'){const c=config(env);return json({configured:c.configured,provider:c.provider?.name||null,model:c.configured?c.model:null});}
    if(url.pathname==='/api/execute'){
      if(request.method!=='POST')return json({error:'Método não permitido.'},405);
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return json({error:'Origem não permitida.'},403);
      if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Envie JSON.'},415);
      let input;try{input=await boundedJson(request)}catch(error){return json({error:error.message==='large'?'Pedido muito grande.':'Pedido inválido.'},error.message==='large'?413:400)}
      if(!input||typeof input.prompt!=='string'||input.prompt.trim().length<8||input.prompt.length>6000)return json({error:'Descreva o pedido entre 8 e 6.000 caracteres.'},400);
      const agent=input.agentId?agents.find(a=>a.id===input.agentId):routeOrder(input.prompt);
      if(!agent)return json({error:'Agente inválido.'},400);
      const c=config(env,agent.id);if(!c.configured)return json({error:'A IA ainda não está conectada. Configure a chave e o modelo no servidor.'},503);
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),110000);
      try{
        const reply=await fetcher(c.provider.url,{method:'POST',headers:{'Authorization':`Bearer ${c.key}`,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:c.model,messages:[{role:'system',content:`${agent.system} Você faz parte da central de IA da Technet. Responda com a entrega solicitada, sem alegar ações externas não realizadas. Não execute ações em nome do usuário. Entregue texto ou código; não finja que pode acessar contas, enviar mensagens, usar arquivos não fornecidos ou trabalhar em segundo plano. Seja preciso, prático e transparente sobre informações ausentes.`},{role:'user',content:input.prompt.trim()}],max_completion_tokens:3500})});
        if(!reply.ok){if(reply.status===401||reply.status===403)return json({error:'O provedor recusou a credencial. Verifique a chave no servidor.'},502);if(reply.status===429)return json({error:'O provedor atingiu o limite de uso. Verifique a cota e tente novamente mais tarde.'},429);return json({error:'O provedor não conseguiu executar o pedido. Confira o modelo configurado e tente novamente.'},502)}
        const data=await reply.json();const output=data.choices?.[0]?.message?.content;
        if(typeof output!=='string'||!output.trim())return json({error:'O provedor retornou uma entrega vazia. Tente novamente.'},502);
        if(data.choices?.[0]?.finish_reason==='length')return json({output:output+'\n\n[Resposta interrompida pelo limite de geração. Peça a continuação em uma nova ordem.]',agentId:agent.id,model:c.model,provider:c.provider.name});
        return json({output,agentId:agent.id,model:c.model,provider:c.provider.name});
      }catch(error){return json({error:error.name==='AbortError'?'O provedor excedeu o tempo de espera.':'Não foi possível conectar ao provedor de IA.'},error.name==='AbortError'?504:502)}finally{clearTimeout(timeout)}
    }
    if(url.pathname.startsWith('/api/'))return json({error:'Rota não encontrada.'},404);
    if(!['GET','HEAD'].includes(request.method))return new Response('Método não permitido',{status:405});
    const path=url.pathname==='/'?'/index.html':url.pathname;
    const asset=assets[path];if(!asset)return new Response('Não encontrado',{status:404,headers:responseHeaders});
    const body=asset.encoding==='base64'?Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0)):asset.content;
    return new Response(request.method==='HEAD'?null:body,{headers:{...responseHeaders,'Content-Type':asset.type,'Cache-Control':path.startsWith('/assets/')?'public, max-age=3600':'no-cache'}});
  }};
}
