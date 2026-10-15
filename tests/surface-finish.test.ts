import {it,expect} from 'vitest';
import {box} from './fixtures';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {defaults} from '../src/profiles/printers';
import {recommend} from '../src/recommendations/engine';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {estimatePrintTime} from '../src/recommendations/print-time';
const a=analyzeMesh(box(90,90,4));
const c={...defaults,use:'Coaster / flat object',material:'PETG',priority:'Fast' as const};
const row=(r:ReturnType<typeof recommend>,key:string)=>r.settings.find(s=>s.key===key)!;
it('recommends an ironing trial for a Fast PETG coaster without a hidden finish preference',()=>{
 const r=recommend(a,c);expect(row(r,'ironing_type').value).toBe('Top surfaces');expect(row(r,'ironing_type').reason).toContain('despite Fast');expect(row(r,'ironing_type').reason).toContain('PETG');expect(row(r,'ironing_type').status).toBe('review');expect(row(r,'top_surface_speed').value).toBe('40 mm/s');
});
it('keeps existing Topmost selection and calibration instead of disabling it',()=>{
 const r=recommend(a,c,parseCurrentSettings('{"ironing_type":"topmost","ironing_speed":"25","ironing_flow":"12","ironing_spacing":"0.12"}'));
 expect(row(r,'ironing_type').value).toBe('Topmost surface');expect(row(r,'ironing_type').intent).toBe('retain');expect(row(r,'ironing_speed').value).toBe('25 mm/s');expect(row(r,'ironing_flow').value).toBe('12%');expect(row(r,'ironing_spacing').value).toBe('0.12 mm');
});
it('does not use the fine-detail preference as a blanket ironing veto',()=>{
 const r=recommend(a,{...c,detail:true});expect(row(r,'ironing_type').value).toBe('Top surfaces');expect(row(r,'ironing_type').reason).toContain('tiny edges');
});
it('uses explicit coaster intent provisionally when normals are unavailable',()=>{
 const r=recommend({...a,normalReliability:false,topPercent:0,flatAreas:[0,0,0,0,0,0]},c);
 expect(row(r,'ironing_type').value).toBe('Top surfaces');expect(row(r,'ironing_type').reason).toContain('unverified');expect(row(r,'wall_loops').value).toBe('3');expect(row(r,'top_shell_thickness').value).toBe('1.2 mm');
});
it('does not claim an upright or curved face can be ironed',()=>{
 const r=recommend({...a,flatAreas:[100,100,0,0,0,0],topPercent:0},c);expect(row(r,'ironing_type').value).toBe('No ironing');expect(row(r,'ironing_type').reason).toContain('orientation');
 expect(row(recommend(a,{...c,material:'TPU'}),'ironing_type').value).toBe('No ironing');
});
it('recognises an actual broad horizontal area even below 30 percent of total surface',()=>{
 const r=recommend({...a,topPercent:15,flatAreas:[0,0,0,0,0,3000]},{...defaults,finish:true});expect(row(r,'ironing_type').value).toBe('Top surfaces');
});
it('accounts for the selected ironing pass in time and deposited grams',()=>{
 const r=recommend(a,c),off=r.settings.map(s=>s.key==='ironing_type'?{...s,value:'No ironing'}:s);
 const on=estimatePrintTime(a,c,r.settings),base=estimatePrintTime(a,c,off);
 expect(on.seconds).toBeGreaterThan(base.seconds);expect(on.filamentGrams).toBeGreaterThan(base.filamentGrams);
});
