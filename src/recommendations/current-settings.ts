import {XMLParser, XMLValidator} from 'fast-xml-parser';
import labels from '../profiles/setting-labels.json';
import {formatStudioValue,studioControls} from './studio-layout';
import type {CurrentSettings,Setting} from '../types';
const known=new Set(['print_extruder_variant','print_extruder_id','filament_extruder_variant',...Object.keys(labels),...studioControls.map(s=>s.key)]);
const aliases:Record<string,string>={initial_layer_height:'initial_layer_print_height',chamber_temperature:'chamber_temperatures'};
export function parseCurrentSettings(text:string,source='Imported Bambu settings JSON'):CurrentSettings {
 if(text.length>8*1024*1024)throw new Error('Settings file exceeds the 8 MB limit.');
 let data:unknown;try{data=JSON.parse(text);}catch{throw new Error('Invalid settings JSON. Export a Bambu Studio process or filament preset as JSON.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Settings JSON must contain a settings object.');
 const record=data as Record<string,unknown>;
 if(record.compatiblePreset===false||record.application==='Created3D Print Advisor')throw new Error('This is a recommendation report. Import your current Bambu Studio settings instead.');
 const values:CurrentSettings['values']={};
 for(const [original,value]of Object.entries(record)){const key=aliases[original]||original;if(!known.has(key))continue;const list=Array.isArray(value)?value:[value];
  if(!list.length||list.length>256||list.some(v=>!['string','number','boolean'].includes(typeof v)||String(v).length>512||typeof v==='number'&&!Number.isFinite(v)))continue;
  const clean=list.map(v=>typeof v==='boolean'?v?'1':'0':String(v)).filter(v=>v.trim()!=='');if(clean.length)values[key]=clean;
 }
 if(!Object.keys(values).length)throw new Error('No supported Bambu Studio settings found. Import a process or filament preset JSON.');
 return {values,source,overrides:[],notes:['Only values present in the file are shown. Missing inherited preset values are not guessed. Imported nozzle settings are shown for the selected nozzle when its labels are available.']};
}
export function readObjectOverrides(xml:string):string[]{
 if(/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new Error('Invalid object settings XML.');
 const data=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',removeNSPrefix:true,processEntities:false}).parse(xml);
 const keys=new Set<string>();
 const walk=(node:unknown,depth=0)=>{if(depth>64)throw new Error('Object metadata is too deeply nested.');if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(v=>walk(v,depth+1));return;}const obj=node as Record<string,unknown>;const key=obj['@_key'];if(typeof key==='string'&&known.has(key))keys.add(key);
  for(const value of Object.values(obj))if(typeof value==='object')walk(value,depth+1);
 };walk(data);return [...keys];
}
export function mergeCurrentSettings(current:CurrentSettings|null,next:CurrentSettings):CurrentSettings {
 return {...next,manualKeys:current?.manualKeys?.filter(key=>!next.values[key]),values:{...current?.values,...next.values},overrides:[...new Set([...(current?.overrides||[]),...next.overrides])],notes:[...new Set([...(current?.notes||[]),...next.notes])],source:current?current.source+' + '+next.source:next.source};
}
const formatValue=formatStudioValue;
export function currentValue(current:CurrentSettings|null|undefined,s:Setting):string|null {
 let values=current?.values[s.key]||current?.values[s.key+'@main'];
 if(!values&&s.key==='range'){const lo=current?.values.nozzle_temperature_range_low,hi=current?.values.nozzle_temperature_range_high;if(lo&&hi&&new Set(lo).size===1&&new Set(hi).size===1)return lo[0]+'–'+hi[0]+'°C';}
 if(!values&&s.key==='chamber')values=current?.values.chamber_temperatures;
 if(!values)return null;const variants=[...new Set(values.map(v=>current?.manualKeys?.includes(s.key)?v:formatValue(v,s)))];return variants.length===1?variants[0]:'Variant-specific: '+variants.join(' / ');
}
export function comparisonStatus(current:CurrentSettings|null|undefined,s:Setting):'same'|'change'|'review'|'missing' {
 const value=currentValue(current,s);if(value==null)return 'missing';if(value.startsWith('Variant-specific:')||current?.overrides.includes(s.key))return 'review';
 const normalize=(v:string)=>v.toLowerCase().replace(/[\s_–-]/g,'');return normalize(formatValue(value,s))===normalize(s.value)?'same':'change';
}

// Resolve by the imported labels, never by an assumed two-value array order.
export function nozzleCurrentSettings(current:CurrentSettings|null|undefined,nozzle:'main'|'auxiliary'):CurrentSettings|null {
 if(!current)return null;
 const values:CurrentSettings['values']={};
 const wanted=nozzle==='main'?'Direct Drive Standard':'Bowden Standard';
 for(const key of new Set(Object.keys(current.values).map(k=>k.split('@')[0]))){
  const list=current.values[key]||[];
  const manualKey=key+'@'+nozzle;
  if(current.values[manualKey]){values[key]=current.values[manualKey];continue;}
  if(key.includes('@'))continue;
  if(new Set(list).size===1){values[key]=list;continue;}
  const labels=current.values[key.startsWith('filament_')?'filament_extruder_variant':'print_extruder_variant'];
  const indices=labels?.map((label,i)=>label===wanted?i:-1).filter(i=>i>=0)||[];
  if(labels?.length===list.length&&indices.length===1)values[key]=[list[indices[0]]];
 }
 return {...current,values,manualKeys:Object.keys(values).filter(k=>current.manualKeys?.includes(k)||current.manualKeys?.includes(k+'@'+nozzle))};
}
