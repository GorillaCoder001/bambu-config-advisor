import {useState,useEffect} from 'react';
import {Clock3,Zap} from 'lucide-react';
import type {Context,Recommendation} from '../types';
import type {SliceSummary} from '../analysis/slice-summary';
import {formatDuration} from '../recommendations/print-time';
export function PrintTimePanel({result,context,filename,studioHours,onStudioHours,onBalanced,busy,slices=[],onSlices}:{result:Recommendation;context:Context;filename:string;studioHours:string;onStudioHours:(value:string)=>void;onBalanced:()=>void;busy:boolean;slices?:SliceSummary[];onSlices?:(s:SliceSummary[])=>void;onContext?:(c:Context)=>void}){
 const [plate,setPlate]=useState(0);
 useEffect(()=>{setPlate(0);},[slices]);
 const estimate=result.printTime;if(!estimate)return null;
 const hours=Number(studioHours),reference=Number.isFinite(hours)&&hours>0&&hours<=10000?hours*3600:null;
 const saved=slices[plate]||slices[0],partial=!estimate.complete,rough=estimate.method==='surface-proxy';
 const seconds=saved?.seconds??reference??(partial?estimate.geometrySeconds:estimate.seconds);
 const grams=saved?.grams??(partial?estimate.modelGrams+estimate.supportGrams:estimate.filamentGrams);
 return <section className="print-time-panel" aria-label="Estimated print time" aria-busy={busy}>
  <div className="time-heading"><div><Clock3 size={18}/><h3>Estimated print time</h3></div><span>{saved?'SAVED STUDIO SLICE':'AUTOMATIC ESTIMATE'}</span></div>
  <div className="time-summary"><div><strong>{busy?'Processing…':formatDuration(seconds)}</strong><p>{busy?'Reading your upload and calculating time and grams in the background…':saved?'Plate '+saved.plate+' · original Studio settings':context.priority+' · '+filename}</p></div><span className="time-confidence">{saved?'Studio sliced estimate':reference!=null?'User-entered time':partial?'Model + supports only':rough?'Very rough estimate':'Approximate estimate'}</span></div>
  <div className="filament-estimate" aria-label="Estimated filament usage"><strong>{busy?'Processing…':grams.toFixed(saved?2:1)+' g'}</strong><span> {saved?'Studio total · original filament palette':partial?'Model + supports · '+context.material:'Estimated filament · '+context.material}</span>
   {!busy&&!saved&&<p>Model: {estimate.modelGrams.toFixed(1)} g · Supports: {estimate.supportGrams.toFixed(1)} g · Density: {estimate.densityGcm3} g/cm³ ({estimate.densitySource})</p>}
  </div>
  {!busy&&(saved?<p className="time-explanation">Saved Studio plate {saved.plate} was read automatically from your upload, including its recorded colour-change accounting. This reference does not update when recommendations change.</p>:<p className="time-explanation">Calculated automatically from your model and recommended settings. This is a geometry-based estimate; no toolpaths are generated.{partial?' Multi-colour time and grams shown cover the model and supports only. Colour changes, AMS/nozzle operations, purge and tower waste are not included.':''}{rough?' The mesh volume could not be verified, so these figures use a rough surface-area approximation and may be substantially wrong.':''} Brim and loading waste are excluded.</p>)}
  {!busy&&slices.length>1&&<label>Saved plate<select value={plate} onChange={e=>setPlate(Number(e.target.value))}>{slices.map((s,i)=><option key={s.plate} value={i}>Plate {s.plate} · {formatDuration(s.seconds)} · {s.grams.toFixed(2)} g</option>)}</select></label>}
  {context.use==='Bottle cover / sleeve'&&<button className="button secondary" disabled={busy} onClick={onBalanced}><Zap size={15}/> Use Balanced bottle-cover settings</button>}
  <details><summary>How this estimate is calculated</summary><p>Upload once. Geometry is processed locally in a background worker. If your 3MF already contains a valid saved Studio result, its time and grams are used automatically; otherwise the lightweight estimator uses layers, walls, infill, speeds, flow and material density. This avoids the heavy slicing workspace and its timeout, but cannot provide the accuracy of a complete slice.</p><ul>{estimate.drivers.map(driver=><li key={driver}>{driver}</li>)}</ul>{estimate.assumptions.filter(item=>!item.includes('until change count')).map(item=><p key={item}>{item}</p>)}</details>
  <details><summary>Optional Studio time comparison</summary><label>Current Bambu Studio time (hours)<input type="number" min="0" max="10000" step="0.01" placeholder="e.g. 20.25" aria-label="Current Bambu Studio time in hours" value={studioHours} onChange={e=>onStudioHours(e.target.value)} disabled={busy}/></label>{reference!=null&&<p>Your entered time is a reference; it does not validate the estimated grams.</p>}{saved&&onSlices&&<button className="button secondary" disabled={busy} onClick={()=>onSlices([])}>Use recommended geometry estimate</button>}</details>
 </section>;
}
