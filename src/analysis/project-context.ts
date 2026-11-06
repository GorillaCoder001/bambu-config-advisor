import type {Analysis,Context,CurrentSettings} from '../types';
import {filamentChoices} from '../profiles/materials';
import {materials,nozzles,printers} from '../profiles/printers';
export interface ProjectFilament {slot:number;type:string;family:string;name:string;color?:string;vendor:string;}
export interface ProjectDetection {filaments:ProjectFilament[];patch:Partial<Context>;notes:string[];}
function family(type:string,name:string){
 if(!type.trim()){const exact=filamentChoices.find(p=>p.name.toLowerCase()===name.split('@')[0].trim().toLowerCase());if(exact)return exact.family;const generic=/^Generic (PLA(?: Matte| Silk)?|PETG(?: Matte)?|TPU|ABS|ASA)(?: @.*)?$/i.exec(name.trim());if(generic)return materials.find(m=>m.toLowerCase()===generic[1].toLowerCase())||'Other';}
 const t=type.trim().toUpperCase().replace(/[_-]/g,' '),n=name.toUpperCase();
 if(/\b(CF|GF)\b/.test(t))return 'Other';
 if(t==='PETG MATTE'||t==='PETG'&&/PETG[ -]?MATTE/.test(n))return 'PETG Matte';
 if(t==='PLA MATTE'||t==='PLA'&&/PLA[ -]?MATTE/.test(n))return 'PLA Matte';
 if(t==='PLA SILK'||t==='PLA'&&/PLA[ -]?SILK/.test(n))return 'PLA Silk';
 return materials.find(m=>m.toUpperCase()===t)||'Other';
}
export function detectProjectContext(settings:CurrentSettings|null|undefined,filename:string,a:Analysis):ProjectDetection{
 const v=settings?.values||{},notes:string[]=[],patch:Partial<Context>={};
 const count=Math.max(v.filament_type?.length||0,v.filament_settings_id?.length||0,v.filament_colour?.length||0);
 const filaments:ProjectFilament[]=Array.from({length:count},(_,i)=>{
  const type=v.filament_type?.[i]||'',name=v.filament_settings_id?.[i]||type||'Unidentified filament',vendor=v.filament_vendor?.[i]||'';
  const color=v.filament_colour?.[i];return {slot:i+1,type,family:family(type,name),name,vendor,color:color&&/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)?color:undefined};
 });
 if(count){
  patch.colorCount=count;const families=[...new Set(filaments.map(f=>f.family))];
  if(families.length===1&&families[0]!=='Other'){
   patch.material=families[0];patch.manufacturer='Other';patch.profile='';
   const profiles=filaments.map(f=>filamentChoices.find(p=>p.family===f.family&&f.name.split('@')[0].trim().toLowerCase()===p.name.toLowerCase()));
   if(profiles.every(p=>p&&p.name===profiles[0]?.name)){patch.manufacturer=profiles[0]!.manufacturer;patch.profile=profiles[0]!.name;}
   else if(filaments.every(f=>/^generic\b/i.test(f.name)||/^generic$/i.test(f.vendor))){patch.manufacturer='Generic';}
   else {const vendors=[...new Set(filaments.map(f=>f.vendor).filter(Boolean))];if(vendors.length===1&&['Bambu Lab','eSUN','Polymaker','SUNLU','Overture'].includes(vendors[0]))patch.manufacturer=vendors[0];}
   notes.push('Material selected from the project’s filament metadata.');
  }else {patch.material='Other';patch.manufacturer='Other';patch.profile='';notes.push('Mixed or unsupported filament families: choose the material you want advice for. A single profile cannot describe every slot.');}
  notes.push('These are configured slots; some may be unused on the selected plate.');
 }else notes.push('No filament metadata found. Confirm the material selection; STL geometry does not identify the plastic.');
 const models=v.printer_model||v.printer_settings_id||[];if(models.length===1){const raw=models[0].replace(/^Bambu Lab\s*/i,'').trim();const printer=[...printers].sort((a,b)=>b.id.length-a.id.length).find(p=>p.id.toLowerCase()===raw.toLowerCase()||p.code.toLowerCase()===raw.toLowerCase()||raw.toLowerCase().startsWith(p.id.toLowerCase()+' '));if(printer)patch.printer=printer.id;}
 const diameters=v.nozzle_diameter?.map(Number)||[];if(diameters.length&&new Set(diameters).size===1&&nozzles.includes(diameters[0]))patch.nozzle=diameters[0];else if(diameters.length)notes.push('Different or unsupported nozzle diameters are saved; confirm the active nozzle.');
 const name=filename.toLowerCase().replace(/[_-]/g,' ');
 if(/\b(phone|smartphone)\s*(holder|stand)\b/.test(name)){patch.use='Functional';notes.push('Phone-holder use suggested from the file name; you can change it.');}
 else if(/\bcoaster\b/.test(name)&&a.height<Math.max(...a.dimensions.slice(0,2))*.2){patch.use='Coaster / flat object';notes.push('Coaster use suggested from the file name and flat proportions.');}
 return {filaments,patch,notes};
}
