import {it,expect} from 'vitest';
import {recommend} from '../src/recommendations/engine';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {defaults} from '../src/profiles/printers';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {box,merge} from './fixtures';
const body=analyzeMesh(box(105,112,75.7));
const c={...defaults,material:'PETG',use:'Functional'};
const value=(r:ReturnType<typeof recommend>,k:string)=>r.settings.find(s=>s.key===k)!.value;
it('removes avoidable layers and internal material while preserving surface and flow limits',()=>{
 const r=recommend(body,c),q=recommend(body,{...c,priority:'Maximum quality'});
 expect(value(r,'layer_height')).toBe('0.2 mm');expect(value(r,'wall_loops')).toBe('3');expect(value(r,'sparse_infill_density')).toBe('15%');expect(value(r,'top_shell_thickness')).toBe('0.8 mm');expect(value(r,'bottom_shell_thickness')).toBe('0.6 mm');
 expect(r.printTime!.layers).toBeLessThan(q.printTime!.layers);expect(r.printTime!.seconds).toBeLessThan(q.printTime!.seconds);
 expect(parseFloat(value(r,'outer_wall_speed'))).toBeLessThanOrEqual(80);expect(parseFloat(value(r,'top_surface_speed'))).toBeLessThanOrEqual(60);
 expect(value(r,'infill_combination')).toBe('ON');expect(value(r,'sparse_infill_pattern')).toBe('Adaptive Cubic');
});
it('keeps explicit fine detail, load-bearing strength and calibrated flow authoritative',()=>{
 const current=parseCurrentSettings('{"filament_max_volumetric_speed":"2.5","filament_flow_ratio":"0.96"}');
 const r=recommend(body,{...c,detail:true,strong:true},current);
 expect(value(r,'layer_height')).toBe('0.12 mm');expect(value(r,'wall_loops')).toBe('4');expect(value(r,'sparse_infill_density')).toBe('30%');expect(value(r,'filament_max_volumetric_speed')).toBe('2.5 mm³/s');expect(value(r,'filament_flow_ratio')).toBe('0.96');
 expect(parseFloat(value(r,'inner_wall_speed'))*.45*.12).toBeLessThanOrEqual(2.250001);
 expect(value(recommend(body,{...c,use:'Mechanical part'}),'wall_loops')).toBe('4');
});
it('caps every generated auxiliary motion recommendation without imported machine limits',()=>{
 for(const priority of ['Maximum quality','Balanced','Fast','Maximum strength'] as const){
  const r=recommend(body,{...c,priority,extruder:'auxiliary'});
  for(const row of r.settings.filter(s=>s.tab==='Speed'&&s.intent!=='retain')){
   if(row.value.endsWith(' mm/s'))expect(parseFloat(row.value),row.key).toBeLessThanOrEqual(200);
   if(row.value.endsWith(' mm/s²'))expect(parseFloat(row.value),row.key).toBeLessThanOrEqual(1000);
  }
 }
 expect(parseFloat(value(recommend(body,c),'default_acceleration'))).toBeGreaterThan(1000);
});
it('retains support coverage review and never removes the tower or turns on infill flushing to force speed',()=>{
 const over=analyzeMesh(merge(box(10,10,30,[0,0,15]),box(60,60,5,[0,0,32.5])));
 const current=parseCurrentSettings('{"filament_type":["PETG","PETG"],"enable_prime_tower":"1","flush_into_infill":"0"}');
 const r=recommend(over,c,current);
 expect(value(r,'enable_support')).toBe('ON');expect(value(r,'support_type')).toBe('tree(auto)');expect(value(r,'support_style')).toBe('Tree Slim');expect(value(r,'support_interface_top_layers')).toBe('2');expect(value(r,'support_threshold_angle')).toBe('40°');expect(value(r,'support_top_z_distance')).toBe('0.2 mm');
 expect(value(r,'enable_prime_tower')).toBe('ON');expect(value(r,'flush_into_support')).toBe('ON');expect(value(r,'flush_into_infill')).toBe('OFF');
});
