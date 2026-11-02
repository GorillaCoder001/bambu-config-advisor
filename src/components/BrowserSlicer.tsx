// SPDX-License-Identifier: AGPL-3.0-or-later
import {useState,useEffect,useMemo} from 'react';
import Viewport,{useSlicer} from 'three-slicer-viewer';
import {makeSlicerWorker} from 'three-slicer/client';
import {bundledCatalog,partialSupport,type SlicerSettings} from 'three-slicer/settings';
import {filamentGrams} from '../slicing/usage';
import {formatDuration} from '../recommendations/print-time';
const slicer=(deps:Record<string,unknown>)=>useSlicer({...deps,makeWorker:makeSlicerWorker});
export default function BrowserSlicer({file}:{file:File}){
 const [settings,setSettings]=useState<SlicerSettings>({});
 const [message,setMessage]=useState('Importing your original model and project settings…');
 const [result,setResult]=useState<{plate:number;stats:Record<string,unknown>}|null>(null);
 const [running,setRunning]=useState(false);
 const files=useMemo(()=>[file],[file]);
 useEffect(()=>{setResult(null);},[settings]);
 const seconds=Number(result?.stats.time_estimate);
 const tools=Array.isArray(result?.stats.filament_mm_by_tool)?result.stats.filament_mm_by_tool as number[]:[Number(result?.stats.filament_mm)];
 const values=(key:string)=>{const raw=(settings as Record<string,unknown>)[key];return (Array.isArray(raw)?raw:[raw]).map(Number);};
 const diameters=values('filament_diameter'),densities=values('filament_density');
 const grams=filamentGrams(tools,diameters,densities);
 const limits=partialSupport(settings,{toolCount:tools.length});
 return <div>
  <p>Uses the original 3MF project’s layout, settings and material painting. For an STL, choose the printer and filament in this workspace. Advisor recommendations above are separate; changing them does not change this slice.</p>
  <p role="status">{message}</p><p>Multicolour toolpaths and material usage are supported. This engine currently has no complete multicolour time estimator; no total time will be invented. X2D nozzle assignments and AMS timing are not validated.</p>
  {result&&!running&&<div className="filament-estimate"><strong>{Number.isFinite(seconds)&&seconds>0?formatDuration(seconds):'Time unavailable'}</strong><span> · Browser toolpath estimate · Plate {result.plate+1}</span><p>{grams!=null?grams.toFixed(2)+' g':'Set filament diameter and density for grams'} · {Number(result.stats.layers)} layers · {tools.filter(v=>v>0).length} filaments used</p><small>Filament includes the generated prime tower; it is not added twice. Firmware-specific AMS loading, flushing and X2D nozzle switching may differ from Studio. This is an experimental estimate, not a validated X2D total.</small>{!!result.stats.over_bed&&<p role="alert">Toolpaths extend beyond the printable area. Review placement before using this result.</p>}</div>}
  {limits.length>0&&<details><summary>Printer settings the browser engine cannot fully apply ({limits.length})</summary>{limits.map(item=><p key={item.key}>{item.key}: {item.effect}</p>)}</details>}
  <div style={{position:'relative',height:'min(780px,85vh)',minHeight:520,width:'100%',marginTop:16}}>
   <Viewport files={files} settings={settings} setSettings={setSettings} slicer={slicer} catalog={bundledCatalog} defaultAutoSlice={false} features={{shortcuts:false,warmup:false,filePicker:false,drop:false,logs:false}} panels={{topBar:false,paintPanel:false}} onEvent={event=>{if(event.type==='selectedPlate'||event.type==='objects'||event.type==='canvasMode'&&event.value==='prepare')setResult(null);if(event.type==='slicing'){setRunning(event.value);if(event.value){setResult(null);setMessage('Slicing locally…');}}if(event.type==='progress')setMessage('Slicing locally… '+Math.round(event.value*100)+'%');if(event.type==='error'){setResult(null);setMessage(event.value);}if(event.type==='notice')setMessage(event.value);}} onSliced={r=>{setResult(r);setMessage('Browser slice finished. Review the toolpath preview and engine limits.');}} onExport={()=>true}/>
  </div>
  <small>Downloads are disabled: the browser engine is not certified for your printer. Powered by <a href="https://github.com/kimgh06/Three_Slicer" target="_blank" rel="noreferrer">Three Slicer 0.4.1</a> (AGPL). <a href="https://github.com/GorillaCoder001/bambu-config-advisor">Application source</a> · <a href="./AGPL-3.0.txt">License</a>. Files stay on this device.</small>
 </div>;
}
