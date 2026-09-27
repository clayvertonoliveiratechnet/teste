import {fileURLToPath} from 'node:url';
import './local-package.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {collectAssets} from './assets.mjs';
const assets=await collectAssets(fileURLToPath(new URL('../public/',import.meta.url)));
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
await mkdir(new URL('../dist/server/',import.meta.url),{recursive:true});
await mkdir(new URL('../dist/.openai/',import.meta.url),{recursive:true});
const worker=(await readFile(new URL('../worker/index.js',import.meta.url),'utf8')).replace("'../public/agents.js'","'./agents.js'");
await writeFile(new URL('../dist/server/index.js',import.meta.url),`import assets from './assets.js';\n${worker}\nexport default createHandler(assets);\n`);
await writeFile(new URL('../dist/server/assets.js',import.meta.url),`export default ${JSON.stringify(assets)};\n`);
await writeFile(new URL('../dist/server/agents.js',import.meta.url),await readFile(new URL('../public/agents.js',import.meta.url)));
try{await writeFile(new URL('../dist/.openai/hosting.json',import.meta.url),await readFile(new URL('../.openai/hosting.json',import.meta.url)))}catch(error){if(error.code!=='ENOENT')throw error}
console.log(`Build concluído: ${Object.keys(assets).length} recursos e API de agentes.`);
