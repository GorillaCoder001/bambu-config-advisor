import assert from 'node:assert/strict';
import {createSlicer} from 'three-slicer';
// Two outward-wound boxes, origin-centred; the second starts at triangle 12.
const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
function box(x){const p=[[x,0,0],[x+8,0,0],[x+8,8,0],[x,8,0],[x,0,4],[x+8,0,4],[x+8,8,4],[x,8,4]];return faces.map(f=>f.flatMap(i=>p[i]));}
function stl(tris){const b=new ArrayBuffer(84+50*tris.length),v=new DataView(b);v.setUint32(80,tris.length,true);tris.forEach((t,i)=>t.forEach((n,j)=>v.setFloat32(84+i*50+12+j*4,n,true)));return b;}
const engine=await createSlicer();
const params={layer_height:.2,first_layer_height:.2,wall_loops:2,infill_density:.15,bed_width:256,bed_depth:256,bed_height:256,wipe_tower_real:true};
const single=engine.slice(stl(box(-4)),params);
assert.ok(!single.error,single.error);assert.ok(single.stats.layers>0);assert.ok(single.stats.time_estimate>0);assert.ok(single.stats.filament_mm>0);assert.ok(single.gcode.includes('G1'));
const multi=engine.slice(stl([...box(-12),...box(4)]),{...params,extruder_count:2,mm_group_split:12});
assert.ok(!multi.error,multi.error);assert.match(multi.gcode,/^T0$/m);assert.match(multi.gcode,/^T1$/m);assert.equal(multi.stats.filament_mm_by_tool.length,2);assert.ok(multi.stats.filament_mm_by_tool.every(n=>n>0));assert.ok(multi.stats.filament_mm_purge>0);assert.ok(Math.abs(multi.stats.filament_mm_by_tool.reduce((a,b)=>a+b,0)-multi.stats.filament_mm)<.01);
console.log(JSON.stringify({single:{seconds:single.stats.time_estimate,filamentMM:single.stats.filament_mm},multi:{seconds:multi.stats.time_estimate??null,filamentMM:multi.stats.filament_mm,primeTowerMM:multi.stats.filament_mm_purge}},null,2));
engine.dispose();
