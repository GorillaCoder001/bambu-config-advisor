import type {Analysis,Context,Priority} from '../types';
export interface Policy {layer:number;walls:number;infill:number;top:number;bottom:number;outer:number;inner:number;topSpeed:number;infillSpeed:number;solidSpeed:number;initial:number;accel:number;outerAccel:number;topAccel:number;support:boolean;brim:number;detail:boolean;functional:boolean;}
export const priorityPolicies:Record<Priority,{layerFactor:number;outer:number;inner:number;top:number;infill:number;solid:number;accel:number;outerAccel:number;topAccel:number}>={
 'Maximum quality':{layerFactor:.25,outer:40,inner:80,top:25,infill:100,solid:75,accel:3000,outerAccel:1500,topAccel:800},
 'Balanced':{layerFactor:.4,outer:80,inner:140,top:60,infill:180,solid:140,accel:5000,outerAccel:2500,topAccel:1500},
 'Fast':{layerFactor:.5,outer:140,inner:200,top:100,infill:240,solid:180,accel:6000,outerAccel:4000,topAccel:2500},
 'Maximum strength':{layerFactor:.5,outer:50,inner:100,top:40,infill:130,solid:100,accel:3000,outerAccel:1800,topAccel:1000}
};
export interface Rule {id:string;when:(a:Analysis,c:Context)=>boolean;apply:(p:Policy,a:Analysis,c:Context)=>void;}
// Ordered, named, deterministic heuristics. These are starting-point adjustments, not manufacturer facts.
export const rules:Rule[]=[
 {id:'fine-detail',when:(a,c)=>a.fineDetail||c.detail||c.use==='Figurine',apply:(p,a,c)=>{p.detail=true;if(c.priority!=='Fast')p.layer=Math.min(p.layer,Math.max(.06,c.nozzle*.3));p.outer*=.8;p.topSpeed*=.8;}},
 {id:'functional-walls',when:(a,c)=>c.strong||c.priority==='Maximum strength'||['Functional','Mechanical part','Container','Bottle cover / sleeve','Outdoor','Heat-exposed'].includes(c.use),apply:p=>{p.functional=true;p.walls=4;p.infill=30;p.top=1;p.bottom=1;}},
 {id:'broad-top-shell',when:(a,c)=>a.normalReliability&&(a.topPercent>30||c.use==='Coaster / flat object'),apply:p=>{p.top=1.2;p.bottom=.8;p.walls=Math.max(p.walls,3);p.infill=Math.max(p.infill,20);}},
 {id:'petg-quality',when:(a,c)=>c.material.startsWith('PETG')&&c.priority==='Maximum quality',apply:p=>{p.outer=Math.min(p.outer,40);p.topSpeed=Math.min(p.topSpeed,25);p.initial=25;}},
 {id:'silk-visible-surfaces',when:(a,c)=>c.material==='PLA Silk',apply:p=>{p.outer=Math.min(p.outer,40);p.topSpeed=Math.min(p.topSpeed,35);}},
 {id:'flexible-speed',when:(a,c)=>c.material==='TPU',apply:p=>{p.outer=Math.min(p.outer,25);p.inner=Math.min(p.inner,35);p.topSpeed=Math.min(p.topSpeed,25);p.infillSpeed=Math.min(p.infillSpeed,35);p.solidSpeed=Math.min(p.solidSpeed,30);p.initial=15;p.accel=1500;p.outerAccel=800;p.topAccel=800;}},
 {id:'overhang-candidates',when:a=>a.overhangPercent>.3||!a.normalReliability,apply:p=>{p.support=true;}},
 {id:'tall-stability',when:a=>a.aspect>3||a.contactArea/Math.max(a.footprint,1)<.08,apply:p=>{p.brim=6;p.accel=Math.min(p.accel,3000);}},
 {id:'warp-prone-adhesion',when:(a,c)=>['ABS','ASA'].includes(c.material),apply:p=>{p.brim=Math.max(p.brim,8);}}
];
export function derivePolicy(a:Analysis,c:Context){const b=priorityPolicies[c.priority];const p:Policy={layer:Math.round(Math.max(.06,c.nozzle*b.layerFactor)*100)/100,walls:2,infill:15,top:.8,bottom:.6,outer:b.outer,inner:b.inner,topSpeed:b.top,infillSpeed:b.infill,solidSpeed:b.solid,initial:25,accel:b.accel,outerAccel:b.outerAccel,topAccel:b.topAccel,support:false,brim:0,detail:false,functional:false};const applied:string[]=[];for(const rule of rules)if(rule.when(a,c)){rule.apply(p,a,c);applied.push(rule.id);}return {policy:p,applied};}
