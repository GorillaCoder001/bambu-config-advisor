export type Confidence = 'high' | 'medium' | 'low';
export type Basis = 'Model' | 'Material' | 'Preference' | 'Preset';
export type Tab = 'Quality' | 'Strength' | 'Speed' | 'Support' | 'Others' | 'Filament' | 'Cooling';
export type Priority = 'Maximum quality' | 'Balanced' | 'Fast' | 'Maximum strength';
export interface CurrentSettings {values:Record<string,string[]>;source:string;notes:string[];overrides:string[];manualKeys?:string[];}
export interface Mesh {currentSettings?:CurrentSettings;positions: Float32Array; notes: string[]; format: 'STL'|'3MF'|'Demo';}
export interface Analysis {
 dimensions: number[]; min: number[]; max: number[]; triangles:number; vertices:number|null; topologyChecked?:boolean; area:number; volume:number|null;
 footprint:number; contactArea:number; aspect:number; height:number; topPercent:number; bottomPercent:number;
 overhangPercent:number; steepPercent:number; overhangBins:number[]; flatAreas: number[]; candidates:{axis:string;area:number}[];
 health:'Good'|'Review recommended'|'Problem detected'; boundaryEdges:number|null; nonManifoldEdges:number|null; windingEdges:number|null;
 degenerate:number; duplicateTriangles:number|null; components:number|null; invertedComponents:number|null; watertight:boolean; dense:boolean;
 classifications:{label:string;confidence:Confidence;reason:string}[]; fineDetail:boolean; apparentFeature:number|null;
 thinDimension:number; bridgeCandidate:boolean; normalReliability:boolean; notes:string[];
}
export interface Context {printer:string; extruder?:'main'|'auxiliary'; nozzle:number; material:string; manufacturer:string; profile:string;plate:string;priority:Priority;use:string;accuracy:boolean;finish:boolean;detail:boolean;strong:boolean;avoidSupport:boolean;dual:boolean;customVolume:number[];}
export interface Source {title:string;url:string;accessed?:string;version?:string;}
export interface SettingExplanation {meaning:string;tradeoff:string;check:string;evidence:string;definitionSource:Source;}
export interface Setting {explanation?:SettingExplanation;location?:string[];visibility?:string;availability?:string;studioApplicable?:boolean;studioMode?:'Advanced';intent?:'retain';tab:Tab;group:string;key:string;name:string;value:string;reason:string;confidence:Confidence;basis:Basis;status:'recommended'|'review';sources?:Source[];raw?:unknown;}
export interface Recommendation {printTime?:import('../recommendations/print-time').PrintTimeEstimate;title:string;settings:Setting[];warnings:{severity:'review'|'problem';text:string}[];rules:string[];materialNotes:string[];baseline:string;reviewed:string;}
