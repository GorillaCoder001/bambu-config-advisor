import {describe,it,expect} from 'vitest';
import {settingMeaning} from '../src/recommendations/setting-help';
import {studioControls} from '../src/recommendations/studio-layout';
import {recommend,exportText} from '../src/recommendations/engine';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {defaults} from '../src/profiles/printers';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {box,merge} from './fixtures';
const a=analyzeMesh(box(90,90,180));
describe('research explanations and calibration protection',()=>{
 it('has a plain-language meaning for every included Studio control',()=>{
  const missing=studioControls.filter(c=>c.mode!=='Develop'&&c.key!=='enable_mixed_color_sublayer'&&!['Post-processing scripts','Notes'].includes(c.group)&&!settingMeaning(c)).map(c=>c.key);
  expect(missing).toEqual([]);
 });
 it('gives all recommendation rows a trade-off, check and definition source',()=>{
  for(const s of recommend(a,defaults).settings){expect(s.explanation?.meaning.length).toBeGreaterThan(15);expect(s.explanation?.tradeoff.length).toBeGreaterThan(15);expect(s.explanation?.check.length).toBeGreaterThan(15);expect(s.explanation?.definitionSource.url).toContain('PrintConfig.cpp#L');}
 });
 it('keeps flow and measured size corrections and uses an unambiguous current flow limit',()=>{
  const current=parseCurrentSettings('{"filament_flow_ratio":"0.95","filament_max_volumetric_speed":"3","elefant_foot_compensation":"0.15","xy_hole_compensation":"0.1"}');
  const r=recommend(a,{...defaults,priority:'Fast'},current);const row=(k:string)=>r.settings.find(s=>s.key===k)!;
  expect(row('filament_flow_ratio').value).toBe('0.95');expect(row('filament_flow_ratio').intent).toBe('retain');expect(row('filament_max_volumetric_speed').value).toBe('3 mm³/s');expect(row('elefant_foot_compensation').value).toBe('0.15 mm');expect(row('xy_hole_compensation').value).toBe('0.1 mm');
  expect(parseFloat(row('inner_wall_speed').value)).toBeLessThanOrEqual(3/(.45*.2)*.9);expect(row('inner_wall_speed').reason).toContain('3 mm³/s');
 });
 it('never recommends an overhang speed above the outer-wall speed',()=>{
  for(const priority of ['Maximum quality','Balanced','Fast','Maximum strength'] as const){const r=recommend(a,{...defaults,priority});const outer=parseFloat(r.settings.find(s=>s.key==='outer_wall_speed')!.value);for(const row of r.settings.filter(s=>/^overhang_[1-4]_4_speed$/.test(s.key)))expect(parseFloat(row.value)).toBeLessThanOrEqual(outer);}
 });
 it('does not guess among current extruder variants or claim an invalid value was used for a flow cap',()=>{
  for(const values of [['3','6'],['invalid']]){const current=parseCurrentSettings(JSON.stringify({filament_max_volumetric_speed:values}));const r=recommend(a,{...defaults,priority:'Fast'},current);expect(r.settings.find(s=>s.key==='inner_wall_speed')!.reason).toContain('12 mm³/s');expect(r.settings.find(s=>s.key==='filament_max_volumetric_speed')!.intent).toBe('retain');}
 });
 it('does not turn a tiny positive flow cap into zero-speed automatic behavior',()=>{
  const r=recommend(a,defaults,parseCurrentSettings('{"filament_max_volumetric_speed":"0.0001"}'));const speed=parseFloat(r.settings.find(s=>s.key==='inner_wall_speed')!.value);expect(speed).toBeGreaterThan(0);expect(speed).toBeLessThanOrEqual(.0001/(.45*.16)*.9);
 });
 it('explains statistical fields without claiming they change physical print quality',()=>{
  const r=recommend(a,defaults);for(const key of ['filament_cost','filament_density','default_filament_colour'])expect(r.settings.find(s=>s.key===key)!.explanation?.tradeoff).toContain('not extrusion quality');
 });
 it('does not let flat-face geometry override an explicitly chosen bottle-cover profile',()=>{
  const r=recommend(analyzeMesh(box(100,100,6)),{...defaults,use:'Bottle cover / sleeve'});expect(r.settings.find(s=>s.key==='wall_loops')!.value).toBe('2');expect(r.settings.find(s=>s.key==='sparse_infill_density')!.value).toBe('10%');
 });
 it('labels authored support gaps as trial rules rather than published filament settings',()=>{
  const over=analyzeMesh(merge(box(10,10,30,[0,0,15]),box(60,60,5,[0,0,32.5])));const r=recommend(over,{...defaults,material:'PETG'});for(const key of ['support_top_z_distance','support_interface_spacing']){const row=r.settings.find(s=>s.key===key)!;expect(row.basis).toBe('Preference');expect(row.explanation?.evidence).toContain('Advisor rule:');}
 });
 it('includes plain explanations and evidence in the copied report',()=>{const text=exportText(recommend(a,defaults),a,defaults);expect(text).toContain('What it does:');expect(text).toContain('Check:');expect(text).toContain('Advisor rule:');});
});
