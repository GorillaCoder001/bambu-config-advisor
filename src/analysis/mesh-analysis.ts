import type {Analysis, Mesh} from '../types';
export const FULL_TOPOLOGY_LIMIT=400_000;
export function analyzeMesh(mesh:Mesh,progress:(message:string)=>void=()=>{}):Analysis {
 const p=mesh.positions,n=p.length/9;if(!n)throw new Error('No geometry to analyze.');progress('Measuring geometry…');
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i++) {const a=i%3;min[a]=Math.min(min[a],p[i]);max[a]=Math.max(max[a],p[i]);}
 const dimensions=min.map((v,i)=>max[i]-v);if(Math.max(...dimensions)<1e-6)throw new Error('Model has no measurable extent.');
 const center=min.map((v,i)=>(v+max[i])/2),tol=Math.max(1e-6,Math.max(...dimensions)*1e-7),areaTol=tol*tol;
 const topologyChecked=n<=FULL_TOPOLOGY_LIMIT;
 const weld=new Map<string,number>(),parents=new Uint32Array(topologyChecked?n:0),signed=new Float64Array(topologyChecked?n:0);
 const edges=new Map<number,{count:number;balance:number;first:number}>(),faceSet=new Set<string>();
 let area=0,contactArea=0,top=0,bottom=0,overhang=0,steep=0,degenerate=0,duplicates=0;const bins=[0,0,0,0],flatAreas=[0,0,0,0,0,0];const smallEdges:number[]=[];
 const find=(v:number):number=>{let r=v;while(parents[r]!==r)r=parents[r];while(parents[v]!==v){const t=parents[v];parents[v]=r;v=t;}return r;};
 const join=(a:number,b:number)=>{a=find(a);b=find(b);if(a!==b)parents[b]=a;};if(topologyChecked)for(let i=0;i<n;i++)parents[i]=i;
 progress(topologyChecked?'Analyzing surfaces and mesh health…':'Large model: measuring all surfaces (detailed topology checks skipped)…');
 for(let i=0;i<n;i++){
  const o=i*9;const a=[p[o],p[o+1],p[o+2]],b=[p[o+3],p[o+4],p[o+5]],c=[p[o+6],p[o+7],p[o+8]];
  const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...cross),ar=length/2;
  if(ar<=areaTol){degenerate++;continue;}area+=ar;const normal=cross.map(v=>v/length);const zavg=(a[2]+b[2]+c[2])/3;
  if(topologyChecked){const ids=[a,b,c].map(q=>{const k=q.map(x=>Math.round(x/tol)).join(',');let id=weld.get(k);if(id==null){id=weld.size;weld.set(k,id);}return id;});
  const faceKey=[...ids].sort((a,b)=>a-b).join(',');if(faceSet.has(faceKey))duplicates++;else faceSet.add(faceKey);
  for(let k=0;k<3;k++){const x=ids[k],y=ids[(k+1)%3],key=Math.min(x,y)*(n*3)+Math.max(x,y),old=edges.get(key);if(old){old.count++;old.balance+=x<y?1:-1;join(i,old.first);}else edges.set(key,{count:1,balance:x<y?1:-1,first:i});}
  const ac=a.map((v,k)=>v-center[k]),bc=b.map((v,k)=>v-center[k]),cc=c.map((v,k)=>v-center[k]);signed[i]=(ac[0]*(bc[1]*cc[2]-bc[2]*cc[1])+ac[1]*(bc[2]*cc[0]-bc[0]*cc[2])+ac[2]*(bc[0]*cc[1]-bc[1]*cc[0]))/6;}
  if(normal[2]>.95)top+=ar;if(normal[2]<-.95)bottom+=ar;
  if(Math.max(a[2],b[2],c[2])-min[2]<=tol*4)contactArea+=Math.abs(cross[2])/2;
  for(let axis=0;axis<3;axis++)if(Math.abs(normal[axis])>.98)flatAreas[axis*2+(normal[axis]>0?1:0)]+=ar;
  // Face slope measured from horizontal, as Bambu's threshold angle is. Exclude bed-contact faces.
  if(normal[2]<-1e-5&&zavg-min[2]>tol*4){const slope=Math.acos(Math.min(1,Math.abs(normal[2])))*180/Math.PI;const bin=Math.min(3,Math.floor(slope/22.5));bins[bin]+=ar;if(slope<45)overhang+=ar;if(slope<30)steep+=ar;}
  if(i%Math.max(1,Math.floor(n/5000))===0){smallEdges.push(Math.hypot(...u),Math.hypot(...v),Math.hypot(...c.map((q,k)=>q-b[k])));}
 }
 if(area<=areaTol)throw new Error('Model contains only zero-area triangles.');
 let boundaryEdges=0,nonManifoldEdges=0,windingEdges=0;for(const e of edges.values()){if(e.count===1)boundaryEdges++;if(e.count>2)nonManifoldEdges++;if(e.count===2&&e.balance!==0)windingEdges++;}
 const volumes=new Map<number,number>();if(topologyChecked)for(let i=0;i<n;i++){const root=find(i);volumes.set(root,(volumes.get(root)||0)+signed[i]);}
 const components=volumes.size;const invertedComponents=[...volumes.values()].filter(v=>v < -areaTol*tol).length;
 const watertight=topologyChecked&&boundaryEdges===0&&nonManifoldEdges===0&&windingEdges===0&&degenerate===0&&duplicates===0;
 // Multiple shells may overlap or include cavities; do not sum absolute volumes and claim solid volume.
 const volume=watertight&&components===1&&invertedComponents===0?Math.abs([...volumes.values()][0]):null;
 const dense=n>80_000;const normalReliability=topologyChecked&&windingEdges===0&&nonManifoldEdges===0&&invertedComponents===0&&duplicates===0;
 const health=!topologyChecked?'Review recommended':nonManifoldEdges||windingEdges||degenerate||duplicates||invertedComponents?'Problem detected':boundaryEdges||components>1||dense?'Review recommended':'Good';
 smallEdges.sort((a,b)=>a-b);const apparentFeature=smallEdges[Math.floor(smallEdges.length*.05)]??null;
 const fineDetail=apparentFeature!=null&&apparentFeature<.7&&n>500;const aspect=dimensions[2]/Math.max(.001,Math.min(dimensions[0],dimensions[1]));
 const classifications:Analysis['classifications']=[];
 if(dimensions[2]<Math.max(dimensions[0],dimensions[1])*.12)classifications.push({label:'Flat / wide',confidence:'high',reason:'Height is less than 12% of the widest horizontal dimension.'});
 if(aspect>3)classifications.push({label:'Tall / narrow',confidence:'high',reason:'Height exceeds three times the narrower footprint dimension.'});
 if(fineDetail)classifications.push({label:'Possible fine detail',confidence:'low',reason:'Short sampled mesh edges suggest fine tessellation; they do not prove printable text or wall thickness.'});
 if(volume!=null&&volume/(dimensions.reduce((a,b)=>a*b,1)||1)<.25)classifications.push({label:'Shell / sparse form possible',confidence:'low',reason:'Solid volume occupies less than one quarter of the bounding box; this cannot distinguish an enclosure from a figurine.'});
 if(!classifications.length)classifications.push({label:'General 3D part',confidence:'medium',reason:'No distinctive bounding-box proportions; intended use needs your input.'});
 const notes=[...mesh.notes,'Original Z axis is the assumed print-up direction. The preview recenters visually; analysis retains original orientation.','Overhangs are area-weighted downward-facing surface candidates; occlusion and layer-by-layer support are not simulated.','Footprint is a bounding rectangle, not a polygon union. Contact area is projected coplanar triangle area and may overcount overlapping shells.','Bridge lengths, holes, local wall thickness and semantic text/figurine detection are not reliably measured. Review them in the slicer.'];
 if(!topologyChecked)notes.push('Large model: all triangles contribute to dimensions, area and surface measurements. Detailed edge topology, unique vertices, components and solid volume are not checked above 200,000 triangles; review mesh health in Bambu Studio.');
 if(components>1)notes.push('Volume unavailable for multiple components: overlapping shells and nested cavities have not been resolved.');
 if(!normalReliability)notes.push('Face winding is unverified or unreliable; orientation-dependent overhang and top-surface estimates require review.');
 if(volume==null)notes.push('Solid volume withheld: a closed, consistently wound single component is required. Self-intersections are not certified absent.');
 return {dimensions,min,max,triangles:n,topologyChecked,vertices:topologyChecked?weld.size:null,area,volume,footprint:dimensions[0]*dimensions[1],contactArea,aspect,height:dimensions[2],topPercent:top/area*100,bottomPercent:bottom/area*100,overhangPercent:overhang/area*100,steepPercent:steep/area*100,overhangBins:bins.map(v=>v/area*100),flatAreas,candidates:flatAreas.map((v,i)=>({axis:['−X','+X','−Y','+Y','−Z','+Z'][i],area:v})).sort((a,b)=>b.area-a.area).slice(0,3),health,boundaryEdges:topologyChecked?boundaryEdges:null,nonManifoldEdges:topologyChecked?nonManifoldEdges:null,windingEdges:topologyChecked?windingEdges:null,degenerate,duplicateTriangles:topologyChecked?duplicates:null,components:topologyChecked?components:null,invertedComponents:topologyChecked?invertedComponents:null,watertight,dense,classifications,fineDetail,apparentFeature,thinDimension:Math.min(...dimensions),bridgeCandidate:bins[0]/area>.002,normalReliability,notes};
}
