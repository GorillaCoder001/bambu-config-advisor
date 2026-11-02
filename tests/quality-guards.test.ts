import {it,expect} from 'vitest';
import {recommend} from '../src/recommendations/engine';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {defaults} from '../src/profiles/printers';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {box} from './fixtures';
const a=analyzeMesh(box(60,50,40));
const val=(r:ReturnType<typeof recommend>,k:string)=>parseFloat(r.settings.find(s=>s.key===k)!.value);
it('honours imported XY speed and printing/travel acceleration limits across machine modes',()=>{
 const current=parseCurrentSettings(JSON.stringify({machine_max_speed_x:['100','80'],machine_max_speed_y:['120','90'],machine_max_acceleration_x:['2000','1000'],machine_max_acceleration_y:['3000','1500'],machine_max_acceleration_extruding:['900','800'],machine_max_acceleration_travel:['700','600']}));
 const r=recommend(a,{...defaults,priority:'Fast'},current);
 expect(val(r,'travel_speed')).toBe(80);expect(val(r,'inner_wall_speed')).toBeLessThanOrEqual(80);
 expect(val(r,'default_acceleration')).toBe(800);expect(val(r,'travel_acceleration')).toBe(600);expect(val(r,'initial_layer_travel_acceleration')).toBe(600);
 expect(r.settings.find(s=>s.key==='travel_speed')!.reason).toContain('imported machine modes');
});
it('does not treat zero or malformed machine limits as an instruction to stop the printer',()=>{
 const r=recommend(a,defaults,parseCurrentSettings('{"machine_max_speed_x":["0","0"],"machine_max_acceleration_travel":["invalid"]}'));
 expect(val(r,'travel_speed')).toBe(300);expect(val(r,'travel_acceleration')).toBe(5000);
});
for(const nozzle of [.2,.4,.6,.8])it('keeps '+nozzle+' mm recommendation combinations within geometric and flow constraints',{timeout:15000},()=>{
 const current=parseCurrentSettings('{"filament_max_volumetric_speed":"1"}');
 for(const printer of ['X2D','P1S','A1 mini'])for(const material of ['PLA','PETG','TPU'])for(const priority of ['Maximum quality','Balanced','Fast','Maximum strength'] as const){
  const r=recommend(a,{...defaults,printer,nozzle,material,priority},current),layer=val(r,'layer_height');
  expect(layer).toBeGreaterThan(0);expect(layer).toBeLessThanOrEqual(nozzle*.8);
  expect(val(r,'top_shell_layers')*layer+.00001).toBeGreaterThanOrEqual(val(r,'top_shell_thickness'));
  for(const [key,widthKey,height] of [['outer_wall_speed','outer_wall_line_width',layer],['inner_wall_speed','inner_wall_line_width',layer],['sparse_infill_speed','sparse_infill_line_width',layer],['initial_layer_speed','initial_layer_line_width',nozzle*.5],['bridge_speed','outer_wall_line_width',val(r,'outer_wall_line_width')]] as const){
   expect(val(r,key)*val(r,widthKey)*height).toBeLessThanOrEqual(.900001);
  }
  for(const row of r.settings)expect(row.value).not.toMatch(/NaN|undefined|Infinity/);
 }
});
