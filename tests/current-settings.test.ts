import {describe,it,expect} from 'vitest';
import {parseCurrentSettings,mergeCurrentSettings,nozzleCurrentSettings,currentValue,comparisonStatus} from '../src/recommendations/current-settings';
import {previewPositions,PREVIEW_TRIANGLE_LIMIT} from '../src/components/ModelViewer';
import type {Setting} from '../src/types';
const layer:Setting={tab:'Quality',group:'Layer height',key:'layer_height',name:'Layer height',value:'0.2 mm',reason:'Test',confidence:'medium',basis:'Preference',status:'recommended'};
describe('current settings provenance and comparison',()=>{
 it('formats imported units and recognizes equal values',()=>{const c=parseCurrentSettings('{"layer_height":["0.20"]}');expect(currentValue(c,layer)).toBe('0.2 mm');expect(comparisonStatus(c,layer)).toBe('same');});
 it('does not substitute recommended defaults for missing values',()=>{expect(currentValue(null,layer)).toBeNull();expect(comparisonStatus(parseCurrentSettings('{"wall_loops":2}'),layer)).toBe('missing');});
 it('retains distinct filament variants',()=>{const s={...layer,key:'nozzle_temperature',value:'220°C'};const c=parseCurrentSettings('{"nozzle_temperature":["220","230"]}');expect(currentValue(c,s)).toBe('Variant-specific: 220°C / 230°C');expect(comparisonStatus(c,s)).toBe('review');});
 it('marks global values with object overrides for review even when matching',()=>{const c=parseCurrentSettings('{"layer_height":"0.2"}');c.overrides=['layer_height'];expect(comparisonStatus(c,layer)).toBe('review');});
 it('normalizes booleans and enum labels',()=>{const c=parseCurrentSettings('{"enable_support":true,"wall_generator":"arachne"}');expect(currentValue(c,{...layer,key:'enable_support',value:'ON'})).toBe('ON');expect(currentValue(c,{...layer,key:'wall_generator',value:'Arachne'})).toBe('Arachne');});
 it('merges process and filament presets without losing either',()=>{const c=mergeCurrentSettings(parseCurrentSettings('{"layer_height":0.2}'),parseCurrentSettings('{"nozzle_temperature":[220]}'));expect(c.values.layer_height).toEqual(['0.2']);expect(c.values.nozzle_temperature).toEqual(['220']);});
 it('rejects recommendation reports as current settings',()=>expect(()=>parseCurrentSettings('{"compatiblePreset":false,"layer_height":0.1}')).toThrow('recommendation report'));
 it('rejects malformed and unsupported JSON',()=>{expect(()=>parseCurrentSettings('bad')).toThrow('Invalid');expect(()=>parseCurrentSettings('{"unrelated":42}')).toThrow('No supported');});
 it('keeps manual editing literal while comparing numeric values with units',()=>{const c=parseCurrentSettings('{"layer_height":"0.2"}');c.manualKeys=['layer_height'];expect(currentValue(c,layer)).toBe('0.2');expect(comparisonStatus(c,layer)).toBe('same');});
});
it('bounds preview geometry without mutating the full uploaded model',()=>{const count=PREVIEW_TRIANGLE_LIMIT+2;const p=new Float32Array(count*9);p[p.length-1]=123;const sample=previewPositions(p);expect(sample.length).toBe(PREVIEW_TRIANGLE_LIMIT*9);expect(sample.at(-1)).toBe(123);expect(p.length).toBe(count*9);});

it('resolves reordered Standard nozzle labels and leaves unidentified arrays blank',()=>{
 const c=parseCurrentSettings(JSON.stringify({initial_layer_speed:['40','25'],print_extruder_variant:['Bowden Standard','Direct Drive Standard']}));
 expect(nozzleCurrentSettings(c,'main')?.values.initial_layer_speed).toEqual(['25']);
 expect(nozzleCurrentSettings(c,'auxiliary')?.values.initial_layer_speed).toEqual(['40']);
 const unknown=parseCurrentSettings('{"initial_layer_speed":["25","40"]}');
 expect(nozzleCurrentSettings(unknown,'main')?.values.initial_layer_speed).toBeUndefined();
});
it('keeps nozzle manual edits separate',()=>{
 const c={values:{'initial_layer_speed@main':['22'],'initial_layer_speed@auxiliary':['18']},source:'Manual',notes:[],overrides:[],manualKeys:['initial_layer_speed@main','initial_layer_speed@auxiliary']};
 expect(nozzleCurrentSettings(c,'main')?.values.initial_layer_speed).toEqual(['22']);
 expect(nozzleCurrentSettings(c,'auxiliary')?.values.initial_layer_speed).toEqual(['18']);
});
