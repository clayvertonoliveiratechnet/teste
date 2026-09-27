import {agents} from './agents.js';
// Screen-space floor anchors. Desk exits lead into the outside aisles;
// no edge shortcuts through a cubicle. Seat nodes are terminal destinations.
export const points={
 a:[16.2,52.5],ax:[13.8,55],al:[15.4,58],al2:[17,62.5],al3:[20,67],
 b:[24,67.4],bx:[24,71],bl:[29,75],south:[36,79],sw:[44,80],bottom:[53,75],
 c:[40.3,56.4],cx:[41,60],cm:[47,62],hub:[54,64],
 d:[70,55.7],dx:[68.2,58.5],dm:[62,58.5],north:[55,53],upper:[55,45],
 e:[81,69.6],ex:[80,73],el:[74,77],el2:[67,84],el3:[60,84],

 meetEntry:[50,41],meetFront:[45,43],meetMid:[39,45],meetLeft:[32,46],
 s:[29.3,40.3],t:[35.6,40.4],u:[39.6,39.2],v:[43.1,36.9],w:[45.4,31.6],wr:[48,35.5]
};
const links=[['a','ax'],['ax','al'],['al','al2'],['al2','al3'],['al3','bx'],
 ['b','bx'],['bx','bl'],['bl','south'],['south','sw'],['sw','bottom'],['bottom','hub'],
 ['c','cx'],['cx','cm'],['cm','hub'],['hub','dm'],['d','dx'],['dx','dm'],
 ['e','ex'],['ex','el'],['el','el2'],['el2','el3'],['el3','bottom'],
 ['dm','north'],['north','upper'],
 ['upper','meetEntry'],['meetEntry','meetFront'],['meetFront','meetMid'],['meetMid','meetLeft'],
 ['meetLeft','s'],['meetMid','t'],['meetFront','u'],['meetEntry','v'],['meetEntry','wr'],['wr','w']];
// Original furniture is composited again above actors walking behind it.
// The layer depth is the front edge of each bay, not the top of the monitor.
const furniture=[
 {depth:515,polygon:'6% 39%,14% 35%,23% 41%,23% 50%,18% 54%,7% 51%'},
 {depth:650,polygon:'17% 52%,27.5% 47%,38% 54%,38% 69%,29% 73%,18% 64%'},
 {depth:552,polygon:'34.5% 43%,42% 39%,52.5% 45%,52.5% 55%,45% 58%,35% 52%'},
 {depth:550,polygon:'61% 45%,69.5% 38.5%,78% 45%,78% 53%,71% 57%,61% 54%'},
 {depth:682,polygon:'68% 57%,80% 49%,89% 56%,89% 65%,82% 71%,72% 69%,68% 65%'},
 {depth:390,polygon:'27% 34%,40% 26%,46% 29%,34% 38%'}
];
export function route(from,to){const queue=[[from]],seen=new Set([from]);while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path;for(const [a,b]of links){const next=a===last?b:b===last?a:null;if(next&&!seen.has(next)){seen.add(next);queue.push([...path,next])}}}return [from];}
export function createWorld(root,onSelect,onMeetingReady){
 let meeting=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=0,ready=false,speaker=null;
 const homes=['a','b','c','d','e'],seats=['s','t','u','v','w'];
 const seatPose={
  a:{dx:-.15,dy:.35,flip:false,scale:.92},b:{dx:.15,dy:.25,flip:true,scale:.92},c:{dx:.2,dy:.2,flip:true,scale:.92},d:{dx:-.2,dy:.25,flip:false,scale:.92},e:{dx:-.15,dy:.25,flip:false,scale:.92},
  s:{dx:-.35,dy:.65,flip:true,scale:.8},t:{dx:-.1,dy:.65,flip:true,scale:.8},u:{dx:.15,dy:.55,flip:false,scale:.8},v:{dx:.25,dy:.45,flip:false,scale:.8},w:{dx:.2,dy:.4,flip:false,scale:.8}
 };
 furniture.forEach(f=>{const layer=document.createElement('div');layer.className='furniture-depth';layer.style.clipPath=`polygon(${f.polygon})`;layer.style.zIndex=String(f.depth);layer.setAttribute('aria-hidden','true');root.append(layer)});
 const actors=agents.map((a,i)=>{const el=document.createElement('button');el.className='world-agent';el.dataset.agent=a.id;el.setAttribute('aria-label',`${a.name}: ver agente`);el.style.setProperty('--column',i);el.style.setProperty('--label-shift',`${[-10,-4,0,8,18][i]}px`);const sprite=document.createElement('span');sprite.className='world-sprite';const label=document.createElement('span');label.className='world-label';label.textContent=a.name;const bubble=document.createElement('span');bubble.className='world-bubble';el.append(label,bubble,sprite);root.append(el);el.onclick=()=>onSelect(a);return {a,i,el,bubble,sprite,x:points[homes[i]][0],y:points[homes[i]][1],node:homes[i],home:homes[i],path:[],busy:false,wait:18+i*7,label:'Disponível'};});
 function go(actor,target){const next=actor.path[0]||actor.node;actor.path=[...(actor.path.length?[next]:[]),...route(next,target).slice(1)];}
 function paint(a,time){const walking=a.path.length>0,seated=!walking&&(a.node===a.home||seats.includes(a.node)),pose=seated?seatPose[a.node]:null;let row=walking?(Math.floor(time/170)%2?1:2):(seated?3:0);if(!walking)a.sprite.style.transform=pose?`scale(${pose.scale||1})${pose.flip?' scaleX(-1)':''}`:'';a.el.dataset.seated=String(seated);a.sprite.style.backgroundPosition=(5+a.i*22.1)+'% '+(row*100/3)+'%';a.el.style.left=(a.x+(pose?.dx||0))+'%';a.el.style.top=(a.y+(pose?.dy||0))+'%';a.el.style.zIndex=String(Math.round(a.y*10));a.el.dataset.state=walking?'walking':meeting?'meeting':a.busy?'working':'idle';a.el.dataset.meeting=String(meeting);a.el.classList.toggle('walking',walking&&!paused);a.el.classList.toggle('speaking',speaker===a.a.id);a.el.title=`${a.a.name} · ${walking?'Caminhando':meeting?'Em reunião':a.label}`;a.bubble.textContent=walking?(meeting?'':'Já volto…'):meeting?(speaker===a.a.id?'Preparando contribuição…':''):a.busy?'Trabalhando…':'';}
 function tick(time){const dt=Math.min((time-last)/1000||0,.06);last=time;for(const a of actors){if(a.path.length){const target=points[a.path[0]],dx=target[0]-a.x,dy=target[1]-a.y,len=Math.hypot(dx,dy),step=paused?len:dt*(meeting?11:8);a.sprite.style.transform=dx<0?'scaleX(-1)':'';if(len<=step){a.x=target[0];a.y=target[1];a.node=a.path.shift();a.wait=a.node===a.home?22+a.i*5:4+a.i;}else{a.x+=dx/len*step;a.y+=dy/len*step;}}else if(!meeting&&!a.busy&&!paused){a.wait-=dt;if(a.wait<=0)go(a,a.node===a.home?['al','south','hub','dm','el'][a.i]:a.home);}paint(a,time)}if(meeting&&!ready&&actors.every(a=>!a.path.length)){ready=true;onMeetingReady?.()}requestAnimationFrame(tick)}requestAnimationFrame(tick);
 return {sync(tasks){actors.forEach(a=>{const busy=tasks.some(t=>t.agent===a.a.id&&t.status==='working');if(busy&&!a.busy&&!meeting)go(a,a.home);a.busy=busy;a.label=busy?'Trabalhando':'Disponível'})},meeting(value){meeting=value;ready=false;speaker=null;actors.forEach((a,i)=>go(a,value?seats[i]:a.home))},speak(id){speaker=id},pause(){paused=!paused;return paused},get paused(){return paused}};
}