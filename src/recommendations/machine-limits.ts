import type {CurrentSettings,Setting} from '../types';
export const machineLimitKeys=['machine_max_speed_x','machine_max_speed_y','machine_max_acceleration_x','machine_max_acceleration_y','machine_max_acceleration_extruding','machine_max_acceleration_travel'];
// Positive limits across supplied modes: the conservative minimum is valid in all
// those modes. Zero means no supplied limit; invalid arrays are not interpreted.
export function applyMachineLimits(settings:Setting[],current?:CurrentSettings|null){
 const limit=(key:string)=>{
  const raw=current?.values[key];if(!raw?.length)return Infinity;
  const numbers=raw.map(Number);if(numbers.some(n=>!Number.isFinite(n)||n<0))return Infinity;
  return Math.min(...numbers.filter(n=>n>0));
 };
 const xySpeed=Math.min(limit('machine_max_speed_x'),limit('machine_max_speed_y'));
 const xyAccel=Math.min(limit('machine_max_acceleration_x'),limit('machine_max_acceleration_y'));
 const messages=new Map<string,string>();
 for(const row of settings){
  if(row.intent==='retain')continue;
  const speed=/^([\d.]+) mm\/s$/.exec(row.value),accel=/^([\d.]+) mm\/s²$/.exec(row.value);
  if(!speed&&!accel)continue;
  const bound=speed?xySpeed:Math.min(xyAccel,limit(row.key.includes('travel')?'machine_max_acceleration_travel':'machine_max_acceleration_extruding'));
  const number=Number((speed||accel)![1]);
  if(Number.isFinite(bound)&&number>bound){
   row.value=bound+(speed?' mm/s':' mm/s²');
   messages.set(row.key,'Capped at the conservative lower positive limit across the imported machine modes. Keep the matching machine preset; these fields do not calibrate its mechanics.');
   row.sources=[...(row.sources||[]),{title:'Bambu Studio · machine limit definitions',url:'https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/PrintConfig.cpp',accessed:'2026-11-02'}];
  }
 }
 return messages;
}
