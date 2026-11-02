import {it,expect} from 'vitest';
import {parseSliceInfo} from '../src/analysis/slice-summary';
import {readSliced3MF,parse3MF} from '../src/analysis/parsers';
import {recommend,exportText} from '../src/recommendations/engine';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {defaults} from '../src/profiles/printers';
import {box,mf} from './fixtures';
import {strToU8} from 'fflate';
const a=analyzeMesh(box(90,70,75));
const summary='<config><plate><metadata key="index" value="1"/><metadata key="prediction" value="72900"/><metadata key="weight" value="211.87"/></plate></config>';
it('reads the screenshot-equivalent per-plate time in seconds and total grams',()=>{
 expect(parseSliceInfo(summary)).toEqual([{plate:1,seconds:72900,grams:211.87}]);
 const b=mf(undefined,{'Metadata/slice_info.config':strToU8(summary)});
 expect(readSliced3MF(b)[0].grams).toBe(211.87);expect(parse3MF(b).sliceSummaries?.[0].seconds).toBe(72900);
});
it('keeps multiple plates separate and rejects malformed or nonfinite summaries',()=>{
 const two=summary.replace('</config>',summary.replace('<config>','').replace('value="1"','value="2"'));
 expect(parseSliceInfo(two).map(s=>s.plate)).toEqual([1,2]);
 expect(parseSliceInfo(summary.replace('72900','NaN'))).toEqual([]);
 expect(parseSliceInfo(summary.replace('211.87','0'))).toEqual([]);
 expect(()=>parseSliceInfo('<!DOCTYPE config><config/>')).toThrow();
 expect(()=>readSliced3MF(mf())).toThrow(/saved slice summary/);
});
it('detects five configured filament slots before nozzle array resolution and preserves tower choice',()=>{
 const current=parseCurrentSettings(JSON.stringify({filament_colour:['purple','pink','white','red','black'],filament_type:Array(5).fill('PETG'),enable_prime_tower:true,layer_height:.12}));
 const r=recommend(a,{...defaults,material:'PETG'},current);
 expect(r.printTime?.colorCount).toBe(5);expect(r.printTime?.complete).toBe(false);
 expect(r.settings.find(s=>s.key==='enable_prime_tower')?.value).toBe('ON');
 expect(r.warnings.some(w=>w.text.includes('0.12 mm'))).toBe(true);
 expect(exportText(r,a,defaults,current)).toContain('Total weight incomplete');
});
it('does not multiply time by colour count or invent missing change overhead',()=>{
 const single=recommend(a,defaults).printTime!,multi=recommend(a,{...defaults,colorCount:5}).printTime!;
 expect(multi.complete).toBe(false);expect(multi.changeOverheadSeconds).toBe(0);expect(multi.geometrySeconds).toBe(single.geometrySeconds);
});
it('uses actual entered change count and inclusive change duration, purge and tower grams',()=>{
 const c={...defaults,colorCount:5,filamentChanges:570,changeSeconds:70,purgeGrams:100,towerGrams:20};
 const t=recommend(a,c).printTime!;
 expect(t.complete).toBe(true);expect(t.changeOverheadSeconds).toBe(39900);
 expect(t.seconds).toBeCloseTo(t.geometrySeconds+39900+t.towerSeconds);
 expect(t.filamentGrams).toBeCloseTo(t.modelGrams+t.supportGrams+120);
 expect(recommend(a,{...c,filamentChanges:-1}).printTime?.complete).toBe(false);
 expect(recommend(a,{...c,changeSeconds:0}).printTime?.complete).toBe(false);
});
it('allows confirmation that unused configured colours are not printed and warns on mixed materials',()=>{
 const current=parseCurrentSettings('{"filament_colour":["purple","white"],"filament_type":["PETG","PLA"]}');
 const r=recommend(a,{...defaults,colorCount:1},current);
 expect(r.printTime?.colorCount).toBe(1);expect(r.warnings.some(w=>w.text.includes('Multiple material families'))).toBe(true);
});
it('does not call a surface-only estimate a full job time even when changes are supplied',()=>{
 const r=recommend({...a,volume:null,normalReliability:false},{...defaults,colorCount:5,filamentChanges:100,changeSeconds:60,purgeGrams:50,towerGrams:10});
 expect(exportText(r,a,defaults)).toContain('Saved slice needed: volume unverified');
 expect(exportText(r,a,defaults)).toContain('Total weight incomplete');
});
it('preserves an existing tower OFF instead of forcing ON for a multicolour grouping',()=>{
 const r=recommend(a,{...defaults,colorCount:5},parseCurrentSettings('{"enable_prime_tower":false}'));
 const tower=r.settings.find(s=>s.key==='enable_prime_tower')!;expect(tower.value).toBe('OFF');expect(tower.intent).toBe('retain');expect(tower.status).toBe('review');
});
