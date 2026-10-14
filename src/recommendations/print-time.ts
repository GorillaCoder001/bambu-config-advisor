import type {Analysis,Context,Setting} from '../types';
export interface PrintTimeEstimate {
 seconds:number;filamentGrams:number;modelGrams:number;supportGrams:number;densityGcm3:number;densitySource:'profile'|'family assumption';layers:number;method:'measured-volume'|'surface-proxy';confidence:'low';
 depositedVolumeMm3:number;assumptions:string[];drivers:string[];
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
 const segment=Math.max(2,Math.min(100,Math.sqrt(Math.max(1,a.footprint))/4));
 const rate=(key:string,w=width)=>{
  const speed=Math.max(1,value(settings,key,40));
  const accel=Math.max(100,value(settings,key==='outer_wall_speed'?'outer_wall_acceleration':'default_acceleration',3000));
  const motionSpeed=speed/(1+speed*speed/(accel*segment));
  return Math.max(.001,Math.min(flow>0?flow*.9:Infinity,layer*w*motionSpeed));
 };
 const outer=rate('outer_wall_speed',outerWidth),inner=rate('inner_wall_speed'),top=rate('top_surface_speed',outerWidth),infill=rate('sparse_infill_speed');
 const outerVolume=wallVolume/walls;let extrusion=outerVolume/outer+(wallVolume-outerVolume)/inner+capVolume/top+infillVolume/infill;
 const firstRate=Math.max(.001,Math.min(flow>0?flow*.9:Infinity,initial*width*Math.max(1,value(settings,'initial_layer_speed',25))));
 const firstVolume=Math.min(deposited,Math.max(0,a.contactArea)*initial);extrusion+=Math.max(0,firstVolume/firstRate-firstVolume/Math.max(.1,(outer+inner)/2));
 if(settings.find(s=>s.key==='ironing_type')?.value!=='No ironing')extrusion+=topArea/(Math.max(.05,value(settings,'ironing_spacing',.15))*Math.max(1,value(settings,'ironing_speed',20)));
 const layerCooling=enabled(settings,'slow_down_for_layer_cooling')?value(settings,'slow_down_layer_time',0):0;
 const base=Math.max(extrusion,layers*layerCooling);
 const supports=enabled(settings,'enable_support');
 // Authored support-volume allowance, not generated support geometry.
 const supportVolume=supports?deposited*Math.min(.4,.08+Math.max(0,a.overhangPercent)/100):0;
 const supportSeconds=supportVolume/rate('support_speed');
 const travelSeconds=extrusion*.15+layers*.6;
 const seconds=Math.max(60,Math.max(extrusion+supportSeconds,layers*layerCooling)+travelSeconds+600);
 const familyDensity:Record<string,number>={'PLA':1.24,'PLA Matte':1.24,'PLA Silk':1.24,'PETG':1.27,'PETG Matte':1.27,'ABS':1.04,'ASA':1.07,'TPU':1.21};
 const profileDensity=value(settings,'filament_density',0);
 const densityGcm3=profileDensity>0?profileDensity:familyDensity[c.material]||1.24;
 const densitySource=profileDensity>0?'profile' as const:'family assumption' as const;
 const modelGrams=deposited/1000*densityGcm3,supportGrams=supportVolume/1000*densityGcm3;
 const filamentGrams=modelGrams+supportGrams;
 const assumptions=[
  measured?'Material volume uses the measured closed model, with approximate wall, shell and infill allocation.':'Solid volume is unavailable. Time uses a very rough surface-area skin proxy; interior material and wall thickness are unknown.',
  'Assumes the current Z orientation, one material and one model/group. No toolpaths are generated.',
  flow>0?'Extrusion is capped by the maximum flow shown in the recommendation, from a profile or your provided current value; it is not a measured hotend result.':'Max volumetric speed is unverified; assumes the nominal settings can be reached.',
  'Includes an assumed 10-minute preparation, approximate acceleration on short moves and travel overhead. Actual machine startup can differ.',
  'Filament mass = deposited volume in mm³ ÷ 1000 × density in g/cm³. Density: '+densityGcm3+' g/cm³ ('+densitySource+'). Material flow limits affect time; density converts volume to grams.',
  supports?'Support grams use an authored allowance of 8% plus overhang percentage, capped at 40% of model extrusion. Support geometry is not generated.':'Assumes no generated supports.',
  layerCooling>0?'Uses the provided minimum layer-time setting as a rough cooling floor.':'Layer cooling may add time; no verified minimum layer time is available.',
  'Multi-colour purging, filament changes, retries, model repairs and exact acceleration/toolpath effects are not simulated. Confirm by slicing in Bambu Studio.'
 ];
 const drivers=[`${layer} mm layers · approximately ${layers.toLocaleString()} layers`,`${Math.round(value(settings,'outer_wall_speed',40))} mm/s outer walls · ${walls} wall loops`,supports?'Supports enabled: inspect the bow, underside and support-only regions.':'Supports off in the recommendation.'];
 if(c.priority==='Maximum quality')drivers.push('Maximum quality prioritizes finish over print duration.');
 if(a.dense)drivers.push('Triangle count affects analysis/slicing workload; it is not evidence that thinner print layers are needed.');
 return {seconds,filamentGrams,modelGrams,supportGrams,densityGcm3,densitySource,layers,method:measured?'measured-volume':'surface-proxy',confidence:'low',depositedVolumeMm3:deposited,assumptions,drivers};
}
export function formatDuration(seconds:number):string {
 const minutes=Math.max(1,Math.round(seconds/60));const hours=Math.floor(minutes/60),remaining=minutes%60;
 return hours?(hours+' h'+(remaining?' '+remaining+' min':'')):minutes+' min';
}
export const formatEstimatedTime=(estimate:PrintTimeEstimate)=>formatDuration(estimate.seconds);
