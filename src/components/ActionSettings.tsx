import {useState} from 'react';
import type {Analysis,Context,CurrentSettings,Recommendation,Setting} from '../types';
import {comparisonStatus,nozzleCurrentSettings} from '../recommendations/current-settings';
import {recommend} from '../recommendations/engine';
import {settingPath} from '../recommendations/studio-layout';
const keys=['layer_height','wall_loops','sparse_infill_density','sparse_infill_pattern','top_shell_thickness','bottom_shell_thickness','ironing_type','outer_wall_speed','inner_wall_speed','top_surface_speed','enable_support','support_type','support_style','support_threshold_angle','support_interface_top_layers','support_top_z_distance'];
export function ActionSettings({result,current,analysis,context,onChange}:{result:Recommendation;current:CurrentSettings|null;analysis:Analysis;context:Context;onChange:(c:Context)=>void}){
 const [nozzle,setNozzle]=useState<'main'|'auxiliary'>('main');
 const selected=nozzle==='main'?result:recommend(analysis,{...context,extruder:'auxiliary'},current);
 const scoped=context.printer==='X2D'?nozzleCurrentSettings(current,nozzle):current;
 const rows=keys.flatMap(key=>{const row=selected.settings.find(s=>s.key===key);return row&&row.intent!=='retain'&&comparisonStatus(scoped,row)!=='same'?[row]:[];});
 const groups=[['Quality & structure',rows.filter(s=>s.tab==='Quality'||s.tab==='Strength')],['Speed',rows.filter(s=>s.tab==='Speed')],['Supports',rows.filter(s=>s.tab==='Support')]] as [string,Setting[]][];
 return <section className="print-time-panel" aria-label="Recommended changes"><h3>Recommended changes</h3><p>Only the key settings that differ from your file are listed. Existing calibration stays in the full controls below.</p><button className="button secondary" onClick={()=>onChange({...context,priority:'Balanced',detail:false})}>Use Balanced speed + quality</button>{context.printer==='X2D'&&<div className="nozzle-selector" aria-label="Recommendation nozzle"><button aria-pressed={nozzle==='main'} onClick={()=>setNozzle('main')}>Main (left)</button><button aria-pressed={nozzle==='auxiliary'} onClick={()=>setNozzle('auxiliary')}>Auxiliary (right)</button></div>}{groups.map(([name,items])=>items.length>0&&<div key={name}><h4>{name}</h4>{items.map(s=><details key={s.key} className="action-setting"><summary><strong>{s.name}</strong><span>{s.value}</span></summary><p>{s.reason}</p><small>{settingPath(s)}</small></details>)}</div>)}{!rows.length&&<p>The key recommendations match your current settings.</p>}</section>;
}
