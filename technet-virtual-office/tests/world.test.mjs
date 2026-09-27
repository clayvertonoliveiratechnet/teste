import test from 'node:test';
import assert from 'node:assert/strict';
import {points,route} from '../public/world.js';
// Tabletop silhouettes measured on the 1536 × 1024 background, in percent.
const tables=[[[7,43],[13,39],[20,43],[14,48]],[[18,56],[25,52],[33,58],[27,62]],[[35,47],[42,44],[50,49],[44,53]],[[62,47],[70,43],[77,48],[70,53]],[[71,61],[79,55],[87,59],[80,65]],[[27,34],[40,26],[46,29],[34,38]]];
function inside([x,y],poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes}return yes}
test('all desk, meeting and idle routes stay outside table surfaces',()=>{const destinations=['a','b','c','d','e','s','t','u','v','w','al','south','hub','dm','el'];for(const start of destinations)for(const end of destinations){const path=route(start,end);assert.equal(path.at(-1),end);for(let i=1;i<path.length;i++){const a=points[path[i-1]],b=points[path[i]];for(let k=0;k<=100;k++){const p=[a[0]+(b[0]-a[0])*k/100,a[1]+(b[1]-a[1])*k/100];assert.ok(!tables.some(t=>inside(p,t)),`${start}→${end}: ${path[i-1]}→${path[i]} intersects a table`)}}}});
test('chairs are destinations, never shortcuts between other seats',()=>{const seats=['a','b','c','d','e','s','t','u','v','w'];for(const a of seats)for(const b of seats)assert.ok(route(a,b).slice(1,-1).every(n=>!seats.includes(n)))});
