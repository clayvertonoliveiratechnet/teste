import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp'};
export async function collectAssets(root){const result={};async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){await walk(file);continue}const binary=/\.(png|webp)$/.test(file);const bytes=await readFile(file);result['/'+path.relative(root,file).split(path.sep).join('/')]= {type:types[path.extname(file)]||'application/octet-stream',encoding:binary?'base64':'utf8',content:bytes.toString(binary?'base64':'utf8')};}}await walk(root);return result;}
