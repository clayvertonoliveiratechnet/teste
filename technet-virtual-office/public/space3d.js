import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const layer=document.querySelector('#space3dLayer');
const host=document.querySelector('#space3dCanvas');
const sceneEl=document.querySelector('#scene');
const toggle=document.querySelector('#hotel3DButton');
const resetButton=document.querySelector('#space3dResetCamera');
if(!layer||!host) throw new Error('3D shell missing');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1014);
scene.fog=new THREE.Fog(0x0a1014,24,42);
const camera=new THREE.PerspectiveCamera(34,1,.1,100);
camera.position.set(16,15,18);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
host.append(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0.8,0);
controls.enableDamping=true;
controls.dampingFactor=.08;
controls.minDistance=12;
controls.maxDistance=30;
controls.minPolarAngle=.58;
controls.maxPolarAngle=1.18;
controls.mouseButtons.LEFT=null;
controls.mouseButtons.MIDDLE=THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT=THREE.MOUSE.ROTATE;
scene.add(new THREE.HemisphereLight(0xbfe6ff,0x30281e,1.65));
const sun=new THREE.DirectionalLight(0xffe1b1,2.4);
sun.position.set(-8,16,10);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;
scene.add(sun);
const warm=new THREE.PointLight(0xffa33d,45,24,2);warm.position.set(5,5,-4);scene.add(warm);

const roomRoot=new THREE.Group(),peopleRoot=new THREE.Group();
scene.add(roomRoot,peopleRoot);
let floorMesh=null,currentRoom='',mode3d=true;
const clickables=[];
const agentMeshes=new Map(),peerMeshes=new Map(),labelEntries=new Map();
let playerMesh=null,lastTime=performance.now();

const pctToWorld=(x,y)=>new THREE.Vector3((x-50)*.18,0,(y-50)*.12);
const worldToPct=p=>[p.x/.18+50,p.z/.12+50];
const mat=(color,rough=.72)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.04});
const box=(w,h,d,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;return m};
function place(mesh,x,y,z=0){const p=pctToWorld(x,y);mesh.position.set(p.x,z,p.z);return mesh}
function clearRoot(root){while(root.children.length){const c=root.children.pop();c.traverse?.(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())}})}}
function addFloor(color=0x51565b){
 const g=new THREE.PlaneGeometry(18,12);
 const m=new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0});
 floorMesh=new THREE.Mesh(g,m);floorMesh.rotation.x=-Math.PI/2;floorMesh.receiveShadow=true;floorMesh.userData.floor=true;roomRoot.add(floorMesh);
 const grid=new THREE.GridHelper(18,18,0x66727a,0x39434a);grid.position.y=.012;grid.scale.z=12/18;grid.material.opacity=.22;grid.material.transparent=true;roomRoot.add(grid);
}
function addWalls(back=0x315143,left=0x625649){
 const rear=box(18,4,.22,back);rear.position.set(0,2,-6);roomRoot.add(rear);
 const side=box(.22,4,12,left);side.position.set(-9,2,0);roomRoot.add(side);
}
function addDesk(x,y,rot=0){
 const g=new THREE.Group();
 const top=box(2.15,.15,.9,0xb77a45);top.position.y=.9;g.add(top);
 for(const sx of [-.8,.8]){const leg=box(.12,.82,.12,0x4a3528);leg.position.set(sx,.43,0);g.add(leg)}
 const screen=box(.72,.5,.08,0x1d2a31);screen.position.set(.25,1.28,-.25);screen.rotation.x=-.08;g.add(screen);
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(.58,.34),new THREE.MeshBasicMaterial({color:0x72d6ff}));glow.position.set(.25,1.28,-.294);glow.rotation.x=-.08;g.add(glow);
 g.rotation.y=rot;place(g,x,y);roomRoot.add(g);return {group:g,screen:glow};
}
function addChair(x,y,rot=0,color=0x365d4f){
 const g=new THREE.Group();const seat=box(.58,.12,.58,color);seat.position.y=.55;g.add(seat);const back=box(.58,.72,.12,color);back.position.set(0,.88,.27);g.add(back);g.rotation.y=rot;place(g,x,y);roomRoot.add(g);return g;
}
function addPlant(x,y,s=1){
 const g=new THREE.Group();const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.5,8),mat(0xb8895b));pot.position.y=.25;g.add(pot);
 for(let i=0;i<6;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.18,.85,5),mat(0x3f8a52));leaf.position.set(Math.cos(i)*.16,.8+Math.sin(i*.8)*.08,Math.sin(i)*.16);leaf.rotation.z=(i-2.5)*.18;g.add(leaf)}
 g.scale.setScalar(s);place(g,x,y);roomRoot.add(g);
}
function addSofa(x,y,rot=0){
 const g=new THREE.Group();const base=box(2.4,.55,.9,0xc9864e);base.position.y=.42;g.add(base);const back=box(2.4,.85,.22,0xe3b07e);back.position.set(0,.9,.38);g.add(back);
 for(const sx of [-.72,0,.72]){const c=box(.65,.18,.58,0xe6c49f);c.position.set(sx,.78,-.05);g.add(c)}
 g.rotation.y=rot;place(g,x,y);roomRoot.add(g);
}
function addMeetingTable(x,y){
 const g=new THREE.Group();const top=box(4.5,.18,1.7,0xa86d3e);top.position.y=.82;g.add(top);for(const sx of [-1.6,1.6]){const leg=box(.18,.72,.18,0x4d3527);leg.position.set(sx,.42,0);g.add(leg)}
 place(g,x,y);roomRoot.add(g);
 for(const dx of [-1.5,-.5,.5,1.5]){addChair(x+dx*3.1,y+8,Math.PI);addChair(x+dx*3.1,y-8,0)}
}
function addDoor(x,y,to,label){
 const g=new THREE.Group();const frame=box(1.45,2.8,.18,0x5c3b26);frame.position.y=1.4;g.add(frame);const panel=box(1.16,2.45,.13,0x9b6235);panel.position.set(0,1.28,-.13);g.add(panel);const knob=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),mat(0xe2bf6d));knob.position.set(.42,1.3,-.22);g.add(knob);place(g,x,y);g.userData={roomTo:to,label};roomRoot.add(g);clickables.push(g);return g;
}
function buildCentral(){
 addFloor(0x4b5056);addWalls(0x2c5447,0x6d5b4e);
 addMeetingTable(37,36);addSofa(55,28,Math.PI);addPlant(24,32,1.15);addPlant(62,27,.9);addPlant(74,49,1);
 const stations=[[16,52,0],[24,67,-.15],[40,56,.05],[70,55,.1],[81,69,-.08]];
 stations.forEach(([x,y,r],i)=>{const d=addDesk(x,y,r);d.screen.userData.agentIndex=i;addChair(x+2.2,y+4.2,r+Math.PI);addPlant(x-4,y-4,.58)});
 addDoor(88,49,'lobby','Lobby Technet');
}
function buildLobby(){
 addFloor(0x64605a);addWalls(0x344f4b,0x726052);addSofa(53,54,Math.PI);addMeetingTable(48,40);addPlant(35,48,1.3);addPlant(65,48,1.2);addDoor(69,52,'central','Central de IA');
}
function buildMeeting(){
 addFloor(0x55585d);addWalls(0x294b43,0x645446);addMeetingTable(50,48);addPlant(35,42,.8);addPlant(65,42,.8);addDoor(66,55,'central','Central de IA');
}
function buildCommercial(){
 addFloor(0x58545a);addWalls(0x55412f,0x3f4f58);for(const [x,y] of [[43,50],[57,50],[43,64],[57,64]]){addDesk(x,y,0);addChair(x+2,y+4,Math.PI)}addPlant(35,48,1);addDoor(66,54,'central','Central de IA');
}
function buildNoc(){
 addFloor(0x343b43);addWalls(0x18394d,0x2b3f48);for(const [x,y] of [[42,51],[51,51],[60,51]]){const d=addDesk(x,y,0);d.screen.material.color.setHex(0x58ffb2);addChair(x,y+5,Math.PI)}addDoor(66,54,'central','Central de IA');
}
function buildCafe(){
 addFloor(0x665d52);addWalls(0x405847,0x765a3d);addSofa(47,57,Math.PI/2);for(const [x,y] of [[57,48],[62,54],[52,45]]){const t=box(1.2,.78,1.2,0xa96f42);t.position.y=.42;place(t,x,y);roomRoot.add(t);addChair(x+3,y+2,Math.PI/2)}addPlant(38,47,1.2);addDoor(65,52,'central','Central de IA');
}
function buildRoom(room){
 currentRoom=room;clearRoot(roomRoot);clickables.length=0;floorMesh=null;
 ({central:buildCentral,lobby:buildLobby,meeting:buildMeeting,commercial:buildCommercial,noc:buildNoc,cafe:buildCafe}[room]||buildCentral)();
 [...labelEntries.values()].forEach(v=>v.el.remove());labelEntries.clear();
 agentMeshes.forEach(m=>m.group.removeFromParent());agentMeshes.clear();
 peerMeshes.forEach(m=>m.group.removeFromParent());peerMeshes.clear();
 playerMesh?.group.removeFromParent();playerMesh=createAvatar(0x2ca46f,'player','Clayverton');peopleRoot.add(playerMesh.group);
}
function createAvatar(color,type,name){
 const g=new THREE.Group();
 const legs=new THREE.Group();for(const x of [-.16,.16]){const l=box(.18,.55,.2,0x26323a);l.position.set(x,.28,0);legs.add(l)}g.add(legs);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.78,6),mat(color));body.position.y=.92;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),mat(0xd59a72));head.position.y=1.52;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.31,8,4,0,Math.PI*2,0,Math.PI/2),mat(0x2a211d));hair.position.y=1.62;g.add(hair);
 const label=document.createElement('div');label.className='space3d-label '+type;label.textContent=name;layer.append(label);labelEntries.set(g.uuid,{el:label,object:g,offset:1.92});
 return {group:g,legs,body,label,type};
}
function ensureAgent(id,name,index){
 let a=agentMeshes.get(id);if(a)return a;const colors=[0x4d7d68,0x4f83b8,0x7a5db6,0xd5a54d,0xa75949];a=createAvatar(colors[index%colors.length],'agent',name);a.group.userData.agentId=id;peopleRoot.add(a.group);agentMeshes.set(id,a);clickables.push(a.group);return a;
}
function ensurePeer(id,name,index){
 let p=peerMeshes.get(id);if(p)return p;const colors=[0x5688a0,0x9a6bb6,0xd18d4f,0x51a66f,0xb95f64];p=createAvatar(colors[index%colors.length],'peer',name);peopleRoot.add(p.group);peerMeshes.set(id,p);return p;
}
function syncPeople(time){
 const hw=window.__hotelWorld;if(!hw)return;
 const ps=hw.state;const ppos=pctToWorld(ps.x,ps.y);playerMesh.group.position.set(ppos.x,0,ppos.z);playerMesh.group.rotation.y=ps.facing==='left'?Math.PI*.65:-Math.PI*.65;playerMesh.group.scale.set(1,ps.sitting?.82:1,1);playerMesh.group.position.y=ps.sitting?-.08:(ps.moving?Math.abs(Math.sin(time*.009))*.08:0);playerMesh.label.textContent=hw.name||'Clayverton';
 const agents=[...document.querySelectorAll('.world-agent')];
 const seenAgents=new Set();
 if(currentRoom==='central'||currentRoom==='meeting'){
  agents.forEach((el,i)=>{const id=el.dataset.agent,name=el.querySelector('.world-label')?.textContent||id,a=ensureAgent(id,name,i);seenAgents.add(id);const x=parseFloat(el.style.left)||50,y=parseFloat(el.style.top)||50,pos=pctToWorld(x,y);a.group.position.set(pos.x,0,pos.z);const moving=el.classList.contains('walking'),seated=el.dataset.seated==='true';a.group.scale.set(1,seated?.82:1,1);a.group.position.y=seated?-.08:(moving?Math.abs(Math.sin(time*.01+i))*.08:0);a.group.rotation.y=(el.querySelector('.world-sprite')?.style.transform||'').includes('scaleX(-1)')?Math.PI*.65:-Math.PI*.65;
   const screen=[...roomRoot.children].flatMap(c=>c.children||[]).find?.(()=>false);
  });
 }
 for(const [id,a] of agentMeshes)if(!seenAgents.has(id)){a.group.removeFromParent();a.label.remove();labelEntries.delete(a.group.uuid);agentMeshes.delete(id)}
 const peerEls=[...document.querySelectorAll('.hotel-peer')],seenPeers=new Set();
 peerEls.forEach((el,i)=>{const id=el.dataset.peer||String(i),name=el.querySelector(':scope>b')?.textContent||'Visitante';const p=ensurePeer(id,name,i);seenPeers.add(id);const x=parseFloat(el.style.left)||50,y=parseFloat(el.style.top)||50,pos=pctToWorld(x,y);p.group.position.set(pos.x,0,pos.z);p.label.textContent=name;const moving=el.classList.contains('moving'),sitting=el.classList.contains('sitting');p.group.scale.set(1,sitting?.82:1,1);p.group.position.y=sitting?-.08:(moving?Math.abs(Math.sin(time*.01+i))*.08:0)});
 for(const [id,p] of peerMeshes)if(!seenPeers.has(id)){p.group.removeFromParent();p.label.remove();labelEntries.delete(p.group.uuid);peerMeshes.delete(id)}
}
function projectLabels(){
 const w=layer.clientWidth,h=layer.clientHeight;
 for(const {el,object,offset} of labelEntries.values()){const v=new THREE.Vector3();object.getWorldPosition(v);v.y+=offset;v.project(camera);const visible=v.z>-1&&v.z<1;el.hidden=!visible;if(!visible)continue;el.style.left=((v.x*.5+.5)*w)+'px';el.style.top=((-v.y*.5+.5)*h)+'px'}
 syncSpeech();
}
const speechEls=new Map();
function speechFor(key,text,object){
 let el=speechEls.get(key);if(!text){if(el)el.hidden=true;return}
 if(!el){el=document.createElement('div');el.className='space3d-speech';layer.append(el);speechEls.set(key,el)}el.textContent=text;el.hidden=false;const v=new THREE.Vector3();object.getWorldPosition(v);v.y+=2.45;v.project(camera);el.style.left=((v.x*.5+.5)*layer.clientWidth)+'px';el.style.top=((-v.y*.5+.5)*layer.clientHeight)+'px';
}
function syncSpeech(){
 const pb=document.querySelector('.hotel-player-bubble:not([hidden])');speechFor('player',pb?.textContent||'',playerMesh.group);
 document.querySelectorAll('.hotel-peer').forEach((el,i)=>{const id=el.dataset.peer||String(i),bubble=el.querySelector('.hotel-peer-bubble:not([hidden])'),peer=peerMeshes.get(id);if(peer)speechFor('peer:'+id,bubble?.textContent||'',peer.group)});
}
function updateWorkingScreens(time){
 if(currentRoom!=='central')return;
 const working=[...document.querySelectorAll('.world-agent')].map(el=>el.dataset.state==='working');
 let station=0;
 roomRoot.traverse(o=>{if(o.isMesh&&o.material?.isMeshBasicMaterial&&o.geometry?.type==='PlaneGeometry'){const active=working[station++]||false;o.material.color.setHex(active?(Math.floor(time/240)%2?0x69ffb0:0x2bbf7d):0x72d6ff)}})
}
function resize(){const w=layer.clientWidth,h=layer.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
new ResizeObserver(resize).observe(layer);resize();
function resetCamera(){camera.position.set(16,15,18);controls.target.set(0,0.8,0);controls.update()}resetButton?.addEventListener('click',resetCamera);
toggle?.addEventListener('click',()=>{mode3d=!mode3d;layer.hidden=!mode3d;document.body.classList.toggle('mode-3d',mode3d);toggle.classList.toggle('active',mode3d);toggle.setAttribute('aria-pressed',String(mode3d));toggle.querySelector('small').textContent=mode3d?'3D':'2D';if(mode3d)resize()});
document.body.classList.add('mode-3d');

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0)down=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0||!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(moved>7)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(clickables,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.roomTo&&!o.userData.agentId)o=o.parent;if(o.userData.roomTo){window.__setHotelRoom?.(o.userData.roomTo);return}if(o.userData.agentId){window.__openHotelAgent?.(o.userData.agentId);return}}
 if(floorMesh){const hit=raycaster.intersectObject(floorMesh)[0];if(hit){const [x,y]=worldToPct(hit.point);window.__hotelWorld?.goTo(x,y)}}
});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
function animate(time){
 requestAnimationFrame(animate);
 const room=sceneEl?.dataset.room||'central';if(room!==currentRoom)buildRoom(room);
 syncPeople(time);updateWorkingScreens(time);controls.update();projectLabels();renderer.render(scene,camera);lastTime=time;
}
buildRoom(sceneEl?.dataset.room||'central');requestAnimationFrame(animate);
window.__space3d={scene,camera,renderer,controls,resetCamera,buildRoom,get currentRoom(){return currentRoom},get enabled(){return mode3d}};