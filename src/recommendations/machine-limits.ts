import type {Context,CurrentSettings,Setting} from '../types';
export const machineLimitKeys=['machine_max_speed_x','machine_max_speed_y','machine_max_acceleration_x','machine_max_acceleration_y','machine_max_acceleration_extruding','machine_max_acceleration_travel'];
// Positive limits across supplied modes: the conservative minimum is valid in all
// those modes. Zero means no supplied limit; invalid arrays are not interpreted.
export function applyMachineLimits(settings:Setting[],current?:CurrentSettings|null,context?:Context){
 const limit=(key:string)=>{
  const raw=current?.values[key];if(!raw?.length)return Infinity;
  const numbers=raw.map(Number);if(numbers.some(n=>!Number.isFinite(n)||n<0))return Infinity;
  return Math.min(...numbers.filter(n=>n>0));
 };
 const auxiliary=context?.printer==='X2D'&&context.extruder==='auxiliary';
 const xySpeed=Math.min(auxiliary?200:Infinity,limit('machine_max_speed_x'),limit('machine_max_speed_y'));
 const xyAccel=Math.min(auxiliary?1000:Infinity,limit('machine_max_acceleration_x'),limit('machine_max_acceleration_y'));
 const messages=new Map<string,string>();
 for(const row of settings){
  if(row.intent==='retain')continue;
  const speed=/^([\d.]+) mm\/s$/.exec(row.value),accel=/^([\d.]+) mm\/s²$/.exec(row.value);
  if(!speed&&!accel)continue;
  const bound=speed?xySpeed:Math.min(xyAccel,limit(row.key.includes('travel')?'machine_max_acceleration_travel':'machine_max_acceleration_extruding'));
  const number=Number((speed||accel)![1]);
  if(Number.isFinite(bound)&&number>bound){
   row.value=bound+(speed?' mm/s':' mm/s²');
   messages.set(row.key,auxiliary?'X2D auxiliary nozzle: capped to Bambu’s 200 mm/s and 1000 mm/s² limits, or a lower imported machine limit. Keep the matching nozzle preset.':'Capped at the conservative lower positive limit across the imported machine modes. Keep the matching machine preset; these fields do not calibrate its mechanics.');
   row.sources=[...(row.sources||[]),...(auxiliary?[{title:'Bambu Lab · X2D auxiliary head limits',url:'https://blog.bambulab.com/two-extruders-one-purpose-what-is-x2d-direct-drive-extrusion-and-auxiliary-extrusion/',accessed:'2026-11-06'}]:[]),{title:'Bambu Studio · machine limit definitions',url:'https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/PrintConfig.cpp',accessed:'2026-11-02'}];
  }
 }
 return messages;
}
