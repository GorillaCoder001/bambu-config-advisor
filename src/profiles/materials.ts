import db from './studio-profiles.json';
import {printers} from './printers';
import type {Context,Source} from '../types';
export interface ThermalProfile {name:string;exact:boolean;values:Record<string,string[]>;sources:Record<string,Source>;notes:string[];drying?:{temperature:number;hours?:number;method:string;source:Source;ams?:string};rangeSource?:Source;reviewed:string;}
const source=(title:string,url:string):Source=>({title,url,accessed:db.reviewed});
export const filamentChoices=[
 {family:'PLA',manufacturer:'Bambu Lab',name:'Bambu PLA Basic'},
 {family:'PLA Matte',manufacturer:'Bambu Lab',name:'Bambu PLA Matte'},
 {family:'PLA Silk',manufacturer:'Bambu Lab',name:'Bambu PLA Silk'},
 {family:'PETG',manufacturer:'Bambu Lab',name:'Bambu PETG Basic'},
 {family:'PETG',manufacturer:'Bambu Lab',name:'Bambu PETG HF'},
 {family:'TPU',manufacturer:'Bambu Lab',name:'Bambu TPU 95A HF'},
 {family:'ABS',manufacturer:'Bambu Lab',name:'Bambu ABS'},
 {family:'ASA',manufacturer:'Bambu Lab',name:'Bambu ASA'},
 {family:'PETG Matte',manufacturer:'eSUN',name:'eSUN PETG-Matte'},
 {family:'PETG',manufacturer:'Polymaker',name:'Polymaker PolyLite PETG'}
];
const products:Record<string,{temperature:number;hours:number;url:string;ams?:string}>={
 'Bambu PLA Basic':{temperature:50,hours:8,url:'https://us.store.bambulab.com/collections/filament-sale/products/pla-basic-filament',ams:'AMS 2 Pro / AMS HT: 55°C × 8h per product instructions; confirm your device and spool.'},
 'Bambu PLA Matte':{temperature:50,hours:8,url:'https://us.store.bambulab.com/products/pla-matte',ams:'AMS 2 Pro / AMS HT: 55°C × 8h per product instructions; confirm your device and spool.'},
 'Bambu PETG Basic':{temperature:65,hours:8,url:'https://bambu-lab-global.myshopify.com/en-cn/products/petg-basic'},
 'Bambu PETG HF':{temperature:65,hours:8,url:'https://us.store.bambulab.com/collections/bambu-lab-3d-printer-filament/products/petg-hf'},
 'Bambu TPU 95A HF':{temperature:70,hours:8,url:'https://eu.store.bambulab.com/en-dk/products/tpu-95a-hf'},
 'Bambu ABS':{temperature:80,hours:8,url:'https://bambulab.com/filament/abs'},
 'Bambu ASA':{temperature:80,hours:8,url:'https://us.store.bambulab.com/products/asa-filament'}
};
const esun=source('eSUN PETG-Matte · TDS v1.0 (Jul 2025)','https://www.esun3d.com/media/esun/catalog/certification/product/PETG-Matte/PETG-Matte_TDS.pdf');
const poly=source('Polymaker PolyLite PETG · manufacturer print guide','https://wiki.polymaker.com/polymaker-products/polymaker-filaments/prime-materials/petg/polylite-tm-petg');
export function materialProfile(c:Context):ThermalProfile {
 const known=filamentChoices.find(p=>p.name.toLowerCase()===c.profile.trim().toLowerCase()&&p.family===c.material&&p.manufacturer===c.manufacturer);
 if(known?.name==='eSUN PETG-Matte'){
  const values:Record<string,string[]>={nozzle_temperature:['250'],nozzle_temperature_initial_layer:['250'],nozzle_temperature_range_low:['240'],nozzle_temperature_range_high:['260'],textured_plate_temp:['70'],textured_plate_temp_initial_layer:['70'],hot_plate_temp:['70'],hot_plate_temp_initial_layer:['70'],fan_min_speed:['50'],fan_max_speed:['100'],filament_density:['1.35']};
  return {name:known.name,exact:true,values,sources:Object.fromEntries(Object.keys(values).map(k=>[k,esun])),notes:['250°C is the TDS specimen-print temperature, applied as a starting point to both layer stages; it is not a tuned X2D profile.','Cooling range 50–100% is manufacturer guidance, not Polymaker or Bambu PETG cooling. Initial-layer and bridge fan settings are unpublished.','PEI bed 70°C is in the TDS; product page gives 60–70°C. Engineering and Cool Plate compatibility are unverified.','MVS, flow ratio and drying duration are unpublished. Keep a calibrated preset; melt flow index is not volumetric print speed.'],drying:{temperature:60,method:'Manufacturer preparation; duration unspecified',source:esun},reviewed:db.reviewed};
 }
 if(known?.name==='Polymaker PolyLite PETG'){
  const values:Record<string,string[]>={nozzle_temperature_range_low:['230'],nozzle_temperature_range_high:['260'],fan_min_speed:['0'],fan_max_speed:['20'],filament_max_volumetric_speed:['15']};
  return {name:known.name,exact:true,values,sources:Object.fromEntries(Object.keys(values).map(k=>[k,poly])),notes:['Manufacturer specifies nozzle 230–260°C and textured PEI/PC bed 70–80°C. A single layer-specific temperature is not prescribed.','15 mm³/s is a manufacturer upper bound. Do not treat it as a calibrated result for every nozzle.','Low cooling protects layer bonding; this does not apply to every PETG formula.'],drying:{temperature:65,hours:6,method:'Manufacturer drying instructions',source:poly},rangeSource:poly,reviewed:db.reviewed};
 }
 const map:Record<string,string>={'PLA':'Generic PLA','PLA Silk':'Generic PLA Silk','PETG':'Generic PETG','TPU':'Generic TPU','ABS':'Generic ABS','ASA':'Generic ASA'};
 const base=known?.name||map[c.material];const printer=printers.find(p=>p.id===c.printer);const machine='Bambu Lab '+(c.printer==='X1 Carbon'?'X1 Carbon':c.printer==='A1 mini'?'A1 mini':c.printer)+' '+c.nozzle.toFixed(1)+' nozzle';
 const profiles=db.profiles as Record<string,{values:Record<string,string[]>;sources:Record<string,Source>}>;
 const matches=base&&printer?.code?Object.entries(profiles).filter(([n,p])=>n.startsWith(base+' @')&&p.values.compatible_printers?.includes(machine)):[];
 const match=matches.find(([n])=>n.includes('@BBL '+printer?.code+' '+c.nozzle.toFixed(1)+' nozzle'))||matches[0];
 const notes:string[]=[];
 if(!known)notes.push(c.profile?'Exact profile not verified for this family/manufacturer. A labeled generic fallback is used where available.':'Family-only selection uses a Bambu generic baseline where available. Verify the exact spool manufacturer range.');
 if(!match)notes.push('No verified printer/nozzle/profile match. Thermal and flow values are withheld; select the matching manufacturer preset in Bambu Studio.');
 if(c.material==='PETG Matte'&&!known)notes.push('PETG Matte has no universal thermal profile. Choose eSUN PETG-Matte if that is your actual filament, or use its manufacturer preset.');
 if(c.material==='PLA Matte'&&!known)notes.push('PLA Matte is not assigned PLA Basic values. Select your actual manufacturer profile.');
 if(c.nozzle===.2&&c.material==='TPU')notes.push('Small-nozzle TPU suitability requires manufacturer confirmation; many flexible filaments are unsuitable for 0.2 mm.');
 const product=known?products[known.name]:null;
 if(known?.name==='Bambu PLA Silk')notes.push('Original PLA Silk drying data is unresolved; do not substitute Silk+ or Silk Multi Color instructions.');
 return {name:match?match[0]:base||'Manufacturer preset required',exact:!!known,values:match?.[1].values||{},sources:Object.fromEntries(Object.entries(match?.[1].sources||{}).map(([k,v])=>[k,{...v,accessed:db.reviewed,version:db.version}])),notes,drying:product?{temperature:product.temperature,hours:product.hours,method:'Forced-air drying oven; not printer heatbed temperature',source:source(known!.name+' · manufacturer conditioning',product.url),ams:product.ams}:undefined,reviewed:db.reviewed};
}
export function scalar(profile:ThermalProfile,key:string):number|null {const a=profile.values[key];if(!a?.length||new Set(a).size>1||!Number.isFinite(Number(a[0])))return null;return Number(a[0]);}
