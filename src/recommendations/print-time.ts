import type {Analysis,Context,Setting} from '../types';
export interface PrintTimeEstimate {
 lowSeconds:number;highSeconds:number;layers:number;method:'measured-volume'|'surface-proxy';confidence:'low';
 depositedVolumeMm3:{low:number;high:number};assumptions:string[];drivers:string[];
}
const value=(settings:Setting[],key:string,fallback:number)=>{const raw=settings.find(s=>s.key===key)?.value||'';const n=parseFloat(raw);return Number.isFinite(n)&&n>=0?n:fallback;};
const enabled=(settings:Setting[],key:string)=>settings.find(s=>s.key===key)?.value==='ON';
export function estimatePrintTime(a:Analysis,c:Context,settings:Setting[]):PrintTimeEstimate {
 const layer=Math.max(.03,value(settings,'layer_height',c.nozzle*.4));const initial=Math.max(.03,value(settings,'initial_layer_print_height',c.nozzle*.5));
 const width=Math.max(.1,value(settings,'line_width',c.nozzle*1.125)),outerWidth=Math.max(.1,value(settings,'outer_wall_line_width',width));
 const walls=Math.max(1,value(settings,'wall_loops',2)),density=Math.min(1,value(settings,'sparse_infill_density',15)/100);
 const layers=Math.max(1,1+Math.ceil(Math.max(0,a.height-initial)/layer));
 const measured=a.volume!=null&&a.volume>0;const topArea=a.area*a.topPercent/100,bottomArea=a.area*a.bottomPercent/100;
 let wallVolume:number,capVolume:number,infillVolume:number;
 if(measured){
  const volume=a.volume!;wallVolume=Math.min(volume,Math.max(0,a.area-topArea-bottomArea)*width*walls);
  capVolume=Math.min(Math.max(0,volume-wallVolume),topArea*value(settings,'top_shell_thickness',.8)+bottomArea*value(settings,'bottom_shell_thickness',.6));
  infillVolume=Math.max(0,volume-wallVolume-capVolume)*density;
 }else{
  // Planning proxy only: never treat a hollow model's bounding box as filled material.
  const proxy=Math.max(.01,a.area*width*walls*.75);const horizontal=Math.min(.8,(a.topPercent+a.bottomPercent)/100);
  wallVolume=proxy*(1-horizontal);capVolume=proxy*horizontal;infillVolume=0;
 }
 const deposited=wallVolume+capVolume+infillVolume;
 const flow=value(settings,'filament_max_volumetric_speed',0);
 const rate=(key:string,w=width)=>Math.max(.001,Math.min(flow>0?flow*.9:Infinity,layer*w*Math.max(1,value(settings,key,40))));
 const outer=rate('outer_wall_speed',outerWidth),inner=rate('inner_wall_speed'),top=rate('top_surface_speed',outerWidth),infill=rate('sparse_infill_speed');
 const outerVolume=wallVolume/walls;let extrusion=outerVolume/outer+(wallVolume-outerVolume)/inner+capVolume/top+infillVolume/infill;
 const firstRate=Math.max(.001,Math.min(flow>0?flow*.9:Infinity,initial*width*Math.max(1,value(settings,'initial_layer_speed',25))));
 const firstVolume=Math.min(deposited,Math.max(0,a.contactArea)*initial);extrusion+=Math.max(0,firstVolume/firstRate-firstVolume/Math.max(.1,(outer+inner)/2));
 if(settings.find(s=>s.key==='ironing_type')?.value!=='No ironing')extrusion+=topArea/(Math.max(.05,value(settings,'ironing_spacing',.15))*Math.max(1,value(settings,'ironing_speed',20)));
 const layerCooling=enabled(settings,'slow_down_for_layer_cooling')?value(settings,'slow_down_layer_time',0):0;
 const base=Math.max(extrusion,layers*layerCooling);
 const supports=enabled(settings,'enable_support');const volumeLow=measured?1:.5,volumeHigh=measured?1:1.8;
 const lowSeconds=Math.max(60,base*volumeLow*1.1+layers*.35+300);
 const highSeconds=Math.max(lowSeconds+60,base*volumeHigh*(flow===0?2.2:supports?1.8:c.detail?1.55:1.4)+layers*1.2+900);
 const assumptions=[
  measured?'Material volume uses the measured closed model, with approximate wall, shell and infill allocation.':'Solid volume is unavailable. Time uses a very rough surface-area skin proxy; interior material and wall thickness are unknown.',
  'Assumes the current Z orientation, one material and one model/group. No toolpaths are generated.',
  flow>0?'Extrusion is capped by the selected verified max volumetric speed.':'Max volumetric speed is unverified; assumes the nominal settings can be reached.',
  'Includes a 5–15 minute preparation allowance and broad travel/acceleration allowances; actual calibration and startup can differ.',
  supports?'Upper range includes a rough support allowance. Support quantity and placement are not calculated.':'Assumes no generated supports.',
  layerCooling>0?'Uses the provided minimum layer-time setting as a rough cooling floor.':'Layer cooling may add time; no verified minimum layer time is available.',
  'Multi-colour purging, filament changes, retries, model repairs and exact acceleration/toolpath effects are not simulated. Confirm by slicing in Bambu Studio.'
 ];
 const drivers=[`${layer} mm layers · approximately ${layers.toLocaleString()} layers`,`${Math.round(value(settings,'outer_wall_speed',40))} mm/s outer walls · ${walls} wall loops`,supports?'Supports enabled: inspect the bow, underside and support-only regions.':'Supports off in the recommendation.'];
 if(c.priority==='Maximum quality')drivers.push('Maximum quality prioritizes finish over print duration.');
 if(a.dense)drivers.push('Triangle count affects analysis/slicing workload; it is not evidence that thinner print layers are needed.');
 return {lowSeconds,highSeconds,layers,method:measured?'measured-volume':'surface-proxy',confidence:'low',depositedVolumeMm3:{low:deposited*volumeLow,high:deposited*volumeHigh},assumptions,drivers};
}
export function formatDuration(seconds:number):string {
 const minutes=Math.max(1,Math.round(seconds/60/5)*5);const hours=Math.floor(minutes/60),remaining=minutes%60;
 return hours?(hours+' h'+(remaining?' '+remaining+' min':'')):minutes+' min';
}
export const formatTimeRange=(estimate:PrintTimeEstimate)=>formatDuration(estimate.lowSeconds)+'–'+formatDuration(estimate.highSeconds);
