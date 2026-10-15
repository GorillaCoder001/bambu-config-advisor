import type {Analysis,Context,CurrentSettings,Setting} from '../types';
import {currentValue} from './current-settings';

export function flatTopEvidence(a:Analysis){
 const area=Math.max(0,a.flatAreas[5]||0);
 return a.normalReliability&&area>=Math.max(4,a.footprint*.15);
}
export function ironingAdvice(a:Analysis,c:Context,current?:CurrentSettings|null){
 const coaster=c.use==='Coaster / flat object';
 const measured=flatTopEvidence(a);
 const intentOnly=coaster&&!a.normalReliability;
 const candidate=measured||intentOnly;
 const supported=['PLA','PLA Matte','PLA Silk','PETG','PETG Matte','ABS','ASA'].includes(c.material);
 const existing=currentValue(current,{key:'ironing_type'} as Setting);
 const keep=existing==='Top surfaces'||existing==='Topmost surface';
 const wanted=coaster||c.finish||c.priority==='Maximum quality'||keep;
 const enabled=candidate&&supported&&wanted;
 let reason=!supported?'Automatic ironing is off for '+c.material+'. A compatible material-specific trial is required.':!candidate?a.normalReliability?'No substantial horizontal upward-facing area was measured in this orientation. Ironing cannot smooth slopes or vertical faces; orient the intended top parallel to the bed.':'The mesh face directions are unverified and no coaster intent was selected. Confirm a horizontal top in Studio before enabling ironing.':!wanted?'A horizontal top was detected, but no coaster, quality or surface-finish request was selected. Ironing is optional; enable it when a smoother top is worth the extra time.':intentOnly?'Your coaster selection makes ironing a useful trial, but the mesh face directions are unverified. Confirm the intended face is horizontal in Studio Preview.':'A substantial horizontal top and your '+(coaster?'coaster selection':keep?'existing ironing choice':'surface-quality request')+' favor a smoothing pass.';
 if(enabled){
  if(keep)reason+=' Keep your existing '+existing+' choice.';
  else reason+=' Top surfaces also irons flat areas below raised lettering; Topmost surface only irons the highest layer.';
  if(c.priority==='Fast')reason+=' This adds time despite Fast priority; choose No ironing if shortest duration matters more.';
  if(c.detail||c.use==='Figurine')reason+=' Raised artwork needs a small trial: ironing can soften tiny edges.';
  if(c.material.startsWith('PETG'))reason+=' PETG can collect on the nozzle and leave marks; use a clean nozzle and test a small patch.';
 }
 return {enabled,value:enabled?(keep?existing!:'Top surfaces'):'No ironing',reason,retained:enabled&&keep,measured,intentOnly};
}
