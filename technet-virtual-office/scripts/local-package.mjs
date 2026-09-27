import {fileURLToPath} from 'node:url';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const entries=[];
async function walk(relative){for(const e of await readdir(path.join(root,relative),{withFileTypes:true})){if(e.name==='downloads')continue;const p=relative+'/'+e.name;if(e.isDirectory())await walk(p);else entries.push(p)}}
for(const dir of ['public','scripts','worker','tests'])await walk(dir);
entries.push('package.json','README.md','INICIAR-CENTRAL.cmd');
const crc32=buffer=>{let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0};
const locals=[],central=[];let offset=0;
for(const entry of entries){const name=Buffer.from('technet-local/'+entry),body=await readFile(path.join(root,entry)),crc=crc32(body),head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(33,12);head.writeUInt32LE(crc,14);head.writeUInt32LE(body.length,18);head.writeUInt32LE(body.length,22);head.writeUInt16LE(name.length,26);locals.push(head,name,body);const index=Buffer.alloc(46);index.writeUInt32LE(0x02014b50);index.writeUInt16LE(20,4);index.writeUInt16LE(20,6);index.writeUInt16LE(0x800,8);index.writeUInt16LE(33,14);index.writeUInt32LE(crc,16);index.writeUInt32LE(body.length,20);index.writeUInt32LE(body.length,24);index.writeUInt16LE(name.length,28);index.writeUInt32LE(offset,42);central.push(index,name);offset+=head.length+name.length+body.length;}
const end=Buffer.alloc(22),index=Buffer.concat(central);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
await mkdir(path.join(root,'public/downloads'),{recursive:true});await writeFile(path.join(root,'public/downloads/technet-local.zip'),Buffer.concat([...locals,index,end]));
