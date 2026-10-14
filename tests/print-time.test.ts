import {describe,it,expect} from 'vitest';
import {box} from './fixtures';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {recommend,exportText} from '../src/recommendations/engine';
import {defaults} from '../src/profiles/printers';
import {estimatePrintTime,formatEstimatedTime} from '../src/recommendations/print-time';
const a=analyzeMesh(box(90,90,180));
const context={...defaults,use:'Bottle cover / sleeve'};
const value=(r:ReturnType<typeof recommend>,key:string)=>r.settings.find(s=>s.key===key)!.value;
describe('time-aware bottle-cover recommendations',()=>{
 it('does not slow a dense mesh solely because its small triangle edges suggest fine detail',()=>{
  const dense={...a,dense:true,fineDetail:true,triangles:194674};const r=recommend(dense,defaults);expect(value(r,'layer_height')).toBe('0.16 mm');expect(value(r,'outer_wall_speed')).toBe('80 mm/s');expect(r.rules).not.toContain('fine-detail');
 });
 it('uses efficient bottle-cover settings rather than automatic functional strength settings',()=>{
  const r=recommend(a,context);expect(value(r,'layer_height')).toBe('0.2 mm');expect(value(r,'wall_loops')).toBe('2');expect(value(r,'sparse_infill_density')).toBe('10%');
 });
 it('preserves explicitly requested fine detail and strength',()=>{
  const detail=recommend(a,{...context,detail:true});expect(parseFloat(value(detail,'layer_height'))).toBeLessThan(.2);
  const strong=recommend(a,{...context,strong:true});expect(value(strong,'wall_loops')).toBe('4');expect(value(strong,'sparse_infill_density')).toBe('30%');
 });
 it('does not silently change the selected Maximum quality priority',()=>expect(value(recommend(a,{...context,priority:'Maximum quality'}),'layer_height')).toBe('0.1 mm'));
 it('shows a finite single estimated time for every mode',()=>{
  for(const priority of ['Maximum quality','Balanced','Fast','Maximum strength'] as const){const t=recommend(a,{...context,priority}).printTime!;expect(Number.isFinite(t.seconds)).toBe(true);expect(t.seconds).toBeGreaterThan(0);expect(formatEstimatedTime(t)).not.toContain('–');expect(t.confidence).toBe('low');expect(t.assumptions.join(' ')).toContain('No toolpaths');expect(formatEstimatedTime(t)).toMatch(/h|min/);}
 });
 it('predicts fewer layers and less extrusion time for Balanced than Maximum quality on the same geometry',()=>{
  const quality=recommend(a,{...context,priority:'Maximum quality'}).printTime!,balanced=recommend(a,context).printTime!;expect(balanced.layers).toBeLessThan(quality.layers);expect(balanced.seconds).toBeLessThan(quality.seconds);
 });
 it('uses model material volume rather than filling the bounding box of a hollow form',()=>{
  const hollow={...a,volume:100000,area:102000,topPercent:1,bottomPercent:1};const t=recommend(hollow,context).printTime!;expect(t.method).toBe('measured-volume');expect(t.depositedVolumeMm3).toBeLessThanOrEqual(100000);expect(t.depositedVolumeMm3).toBeLessThan(a.volume!);
 });
 it('marks unverified volume as a very rough surface proxy instead of claiming solid measurements',()=>{
  const t=recommend({...a,volume:null,topologyChecked:false},context).printTime!;expect(t.method).toBe('surface-proxy');expect(t.filamentGrams).toBeGreaterThan(0);expect(t.assumptions.join(' ')).toContain('wall thickness are unknown');
 });
 it('applies flow limits even if a nominal speed is much higher',()=>{
  const r=recommend(a,context);const settings=r.settings.map(s=>s.key==='filament_max_volumetric_speed'?{...s,value:'1 mm³/s'}:s);const limited=estimatePrintTime(a,context,settings);expect(limited.seconds).toBeGreaterThan(r.printTime!.seconds);
 });
 it('includes time assumptions and an optional real Studio reference in exported reports',()=>{
  const text=exportText(recommend(a,context),a,context,null,16*3600);expect(text).toContain('Estimated print time');expect(text).toContain('low confidence; not a sliced estimate');expect(text).toContain('User-provided Bambu Studio sliced time: 16 h');
 });
});

it('converts deposited volume to grams with the actual profile density',()=>{
 const r=recommend(a,context);const settings=r.settings.map(s=>s.key==='filament_density'?{...s,value:'1.35 g/cm³'}:s.key==='enable_support'?{...s,value:'OFF'}:s);
 const t=estimatePrintTime(a,context,settings);
 expect(t.densitySource).toBe('profile');expect(t.modelGrams).toBeCloseTo(t.depositedVolumeMm3/1000*1.35);expect(t.supportGrams).toBe(0);expect(t.filamentGrams).toBe(t.modelGrams);
 const heavier=estimatePrintTime(a,context,settings.map(s=>s.key==='filament_density'?{...s,value:'1.5 g/cm³'}:s));
 expect(heavier.filamentGrams).toBeGreaterThan(t.filamentGrams);expect(heavier.seconds).toBe(t.seconds);
});
it('accounts for supports in both grams and time',()=>{
 const r=recommend(a,context);const off=r.settings.map(s=>s.key==='enable_support'?{...s,value:'OFF'}:s),on=off.map(s=>s.key==='enable_support'?{...s,value:'ON'}:s);
 const t=estimatePrintTime(a,context,on),base=estimatePrintTime(a,context,off);
 expect(t.supportGrams).toBeGreaterThan(0);expect(t.filamentGrams).toBeCloseTo(t.modelGrams+t.supportGrams);expect(t.seconds).toBeGreaterThan(base.seconds);
});
