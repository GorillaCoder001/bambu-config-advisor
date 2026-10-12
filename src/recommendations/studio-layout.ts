import catalog from '../profiles/studio-layout.json';
import type {CurrentSettings,Setting,Tab} from '../types';
export interface StudioControl {tab:Tab;group:string;key:string;name:string;order:number;type?:string;unit?:string;mode?:string;parent?:string;enums?:Record<string,string>;condition?:{key:string;values:string[];label:string};}
export const studioControls=catalog.settings as StudioControl[];
export const studioVersion=catalog.version;
export const studioLayoutSource={title:'Bambu Studio · setting placement and order',url:'https://github.com/bambulab/BambuStudio/blob/'+catalog.version+'/src/slic3r/GUI/Tab.cpp',version:catalog.version,accessed:catalog.reviewed};
export function studioControl(key:string){return studioControls.find(s=>s.key===key);}
export function formatStudioValue(raw:string,s:Pick<Setting,'key'|'value'>):string {
 const control=studioControl(s.key);const value=raw.trim();
 if(control?.type==='coBool'||control?.type==='coBools'){if(/^(?:0|1|true|false|on|off)$/i.test(value))return /^(1|true|on)$/i.test(value)?'ON':'OFF';}
 const enums=control?.enums;if(enums){const stored=Object.keys(enums).find(k=>k.toLowerCase()===value.toLowerCase());if(stored)return enums[stored];const label=Object.values(enums).find(v=>v.toLowerCase()===value.toLowerCase());if(label)return label;}
 const declaredUnit=control?.unit;const unit=declaredUnit==='mm or %'||declaredUnit==='mm/%'?'mm':declaredUnit||s.value.match(/(?:mm\/s²|mm³\/s|mm\/s|g\/cm³|mm|°C|%|°|layers)$/)?.[0];
 if(unit&&['mm/s²','mm³/s','mm/s','g/cm³','mm','mm²','mm³/s²','°C','%','°','layers'].includes(unit)&&/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value))return String(Number(value))+(['%','°C','°'].includes(unit)?'':' ')+unit;
 return raw;
}
export function placeStudioSetting(setting:Setting):Setting {
 const control=studioControl(setting.key);if(!control)return {...setting,location:['Print preparation guidance',setting.group,setting.name]};
 const scope=['Quality','Strength','Speed','Support','Others'].includes(control.tab)?'Process':'Filament settings';
 const tab=control.tab==='Filament & Temperature'?'Filament':control.tab;
 const name=control.parent?control.parent+' · '+control.name:control.name;
 return {...setting,tab:control.tab,group:control.group,name,value:formatStudioValue(setting.value,setting),location:[scope,tab,control.group,...(control.parent?[control.parent]:[]),control.name],visibility:control.condition?.label,studioMode:control.mode==='Advanced'?'Advanced':undefined};
}
export function orderStudioSettings(settings:Setting[]):Setting[]{return settings.map(placeStudioSetting).sort((a,b)=>{const left=studioControl(a.key),right=studioControl(b.key);return (left?.order??10000)-(right?.order??10000);});}
export function studioSettingVisible(s:Setting,settings:Setting[],current?:CurrentSettings|null):boolean {
 if(s.studioApplicable===false)return false;
 const condition=studioControl(s.key)?.condition;if(!condition)return true;
 const raw=current?.values[condition.key]||[];const recommended=settings.find(row=>row.key===condition.key)?.value;
 const candidates=[...raw,...(recommended?[recommended]:[])].map(v=>v.trim().toLowerCase());return candidates.some(v=>condition.values.includes(v));
}
export function settingPath(s:Setting):string{return (s.location||['Process',s.tab,s.group,s.name]).join(' → ');}
