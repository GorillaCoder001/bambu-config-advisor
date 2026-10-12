import { unzipSync } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { Mesh } from '../types';
export const LIMITS = {bytes:24*1024*1024, expanded:64*1024*1024, entries:128, triangles:120_000, vertices:500_000};
const fail=(message:string):never=>{throw new Error(message);};
function validatePositions(p:Float32Array){if(p.length===0||p.length%9)fail('The file contains no complete triangles.');if(p.length/9>LIMITS.triangles)fail('Model exceeds the 120,000-triangle limit. Simplify it in your CAD tool.');for(const v of p)if(!Number.isFinite(v)||Math.abs(v)>1e7)fail('Model contains invalid or excessive coordinates.');return p;}
export function parseSTL(buffer:ArrayBuffer):Mesh {
 if(buffer.byteLength>LIMITS.bytes)fail('File exceeds the 24 MB limit.');
 const d=new DataView(buffer);const count=buffer.byteLength>=84?d.getUint32(80,true):0;
 // Binary headers can begin with "solid". Exact record length takes priority.
 if(buffer.byteLength>=84&&84+count*50===buffer.byteLength){
  if(count>LIMITS.triangles)fail('Model exceeds the 120,000-triangle limit.');const p=new Float32Array(count*9);
  for(let i=0;i<count;i++)for(let k=0;k<9;k++)p[i*9+k]=d.getFloat32(84+i*50+12+k*4,true);
  return {positions:validatePositions(p),format:'STL',notes:['STL has no unit metadata. Dimensions assume millimeters; verify them in Bambu Studio.']};
 }
 const text=new TextDecoder('utf-8',{fatal:false}).decode(buffer);
 if(!/^\s*solid\b/i.test(text)||! /endsolid\b/i.test(text)||text.includes('\0'))fail('Invalid STL: expected ASCII facets or a complete binary triangle table.');
 const facets=text.match(/facet\s+normal\b[\s\S]*?endfacet/gi)||[];
 if(!facets.length)fail('ASCII STL contains no facets.');if(facets.length>LIMITS.triangles)fail('Model exceeds the 120,000-triangle limit.');
 const p=new Float32Array(facets.length*9);let offset=0;
 const num='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
 for(const facet of facets){const vs=[...facet.matchAll(new RegExp('vertex\\s+('+num+')\\s+('+num+')\\s+('+num+')','gi'))];if(vs.length!==3)fail('Each ASCII STL facet must contain exactly three valid vertices.');for(const v of vs)for(let k=1;k<=3;k++)p[offset++]=Number(v[k]);}
 const residue=text.replace(/facet\s+normal\b[\s\S]*?endfacet/gi,'');if(/\bvertex\b|\bfacet\b/i.test(residue))fail('Incomplete ASCII STL facet.');
 return {positions:validatePositions(p),format:'STL',notes:['STL has no unit metadata. Dimensions assume millimeters; verify them in Bambu Studio.']};
}
// Validate central-directory sizes BEFORE decompression; reject ZIP64, encryption and unsafe paths.
export function inspectZip(buffer:ArrayBuffer){
 const d=new DataView(buffer);let end=-1;for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--)if(d.getUint32(i,true)===0x06054b50&&i+22+d.getUint16(i+20,true)===buffer.byteLength){end=i;break;}
 if(end<0)fail('Invalid 3MF ZIP container.');const count=d.getUint16(end+10,true),size=d.getUint32(end+12,true),offset=d.getUint32(end+16,true);
 if(d.getUint16(end+4,true)||d.getUint16(end+6,true)||d.getUint16(end+8,true)!==count||count===65535||offset===0xffffffff||size===0xffffffff)fail('Multi-disk and ZIP64 3MF archives are not supported.');
 if(count>LIMITS.entries||offset+size>end)fail('3MF archive has too many entries or an invalid directory.');let pos=offset,total=0;const names=new Set<string>();
 const entries=new Map<string,{originalSize:number;compressedSize:number;local:number}>();
 for(let i=0;i<count;i++){
  if(pos+46>offset+size||d.getUint32(pos,true)!==0x02014b50)fail('Invalid 3MF ZIP directory.');
  const flags=d.getUint16(pos+8,true),method=d.getUint16(pos+10,true),compressed=d.getUint32(pos+20,true),original=d.getUint32(pos+24,true),len=d.getUint16(pos+28,true),extra=d.getUint16(pos+30,true),comment=d.getUint16(pos+32,true),local=d.getUint32(pos+42,true);
  if(flags&1||![0,8].includes(method)||original===0xffffffff||compressed===0xffffffff)fail('Encrypted or unsupported 3MF compression.');
  if(pos+46+len+extra+comment>offset+size)fail('Truncated 3MF directory.');
  const name=new TextDecoder().decode(new Uint8Array(buffer,pos+46,len));
  if(name.includes('..')||name.includes('\\')||name.startsWith('/')||/^[a-z]+:/i.test(name)||names.has(name))fail('Unsafe or duplicate 3MF entry path.');names.add(name);
  total+=original;if(total>LIMITS.expanded||original>LIMITS.expanded||(original>1024*1024&&original/Math.max(1,compressed)>250))fail('3MF exceeds safe decompression limits.');
  if(local+30>offset||d.getUint32(local,true)!==0x04034b50||d.getUint16(local+8,true)!==method||(d.getUint16(local+6,true)&1))fail('Invalid 3MF local entry.');
  const ll=d.getUint16(local+26,true),le=d.getUint16(local+28,true);if(local+30+ll+le+compressed>offset)fail('Invalid 3MF compressed entry size.');
  const localName=new TextDecoder().decode(new Uint8Array(buffer,local+30,ll));if(localName!==name)fail('3MF ZIP entry names disagree.');
  if(!(flags&8)&&(d.getUint32(local+18,true)!==compressed||d.getUint32(local+22,true)!==original))fail('3MF ZIP entry sizes disagree.');
  entries.set(name,{originalSize:original,compressedSize:compressed,local});pos+=46+len+extra+comment;
 }
 if(pos!==offset+size)fail('3MF ZIP directory length mismatch.');return entries;
}
const arr=(v:any):any[]=>v==null?[]:Array.isArray(v)?v:[v];
const identity=[1,0,0,0,1,0,0,0,1,0,0,0];
function transform(s:unknown):number[]{if(s==null)return identity;const a=String(s).trim().split(/\s+/).map(Number);if(a.length!==12||a.some(v=>!Number.isFinite(v)))fail('Invalid 3MF transform.');return a;}
function point(v:number[],m:number[]){return [v[0]*m[0]+v[1]*m[3]+v[2]*m[6]+m[9],v[0]*m[1]+v[1]*m[4]+v[2]*m[7]+m[10],v[0]*m[2]+v[1]*m[5]+v[2]*m[8]+m[11]];}
function det(m:number[]){return m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);}
export function parse3MF(buffer:ArrayBuffer):Mesh {
 if(buffer.byteLength>LIMITS.bytes)fail('File exceeds the 24 MB limit.');const entries=inspectZip(buffer);
 const files=unzipSync(new Uint8Array(buffer),{filter:e=>{const c=entries.get(e.name);if(!c||c.originalSize!==e.originalSize||c.compressedSize!==e.size)fail('3MF entry sizes disagree.');return e.name.toLowerCase().endsWith('.model');}});
 const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',removeNSPrefix:true,processEntities:false,parseAttributeValue:false});
 const docs=new Map<string,any>();let resourceTriangles=0,resourceVertices=0;
 for(const [path,bytes]of Object.entries(files)){
  if(bytes.length!==entries.get(path)?.originalSize)fail('Invalid 3MF decompressed length.');const xml=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))fail('XML entities and document types are not allowed.');if(XMLValidator.validate(xml)!==true)fail('Malformed 3MF XML.');
  const model=parser.parse(xml)?.model;if(!model)fail('3MF entry has no model root.');const unit=model['@_unit']||'millimeter';const factor=({micron:.001,millimeter:1,centimeter:10,meter:1000,inch:25.4,foot:304.8} as Record<string,number>)[unit];if(!factor)fail('Unsupported 3MF unit.');
  const objects=new Map<string,any>();for(const obj of arr(model.resources?.object)){
   const id=obj['@_id'];if(!id||objects.has(id))fail('Duplicate or missing 3MF object ID.');
   const vs=arr(obj.mesh?.vertices?.vertex);const ts=arr(obj.mesh?.triangles?.triangle);resourceTriangles+=ts.length;resourceVertices+=vs.length;
   if(resourceTriangles>LIMITS.triangles||resourceVertices>LIMITS.vertices)fail('3MF resources exceed model complexity limits.');
   const vertices=vs.map(v=>['x','y','z'].map(k=>{const raw=v['@_'+k];if(raw==null||String(raw).trim()===''||!Number.isFinite(Number(raw)))fail('Invalid 3MF vertex coordinate.');return Number(raw)*factor;}));
   const triangles=ts.map(t=>['v1','v2','v3'].map(k=>{const raw=t['@_'+k];if(raw==null||!/^\d+$/.test(raw)||Number(raw)>=vertices.length)fail('Invalid 3MF triangle vertex index.');return Number(raw);}));
   objects.set(id,{vertices,triangles,components:arr(obj.components?.component),type:obj['@_type']||'model'});
  }docs.set(path,{objects,build:arr(model.build?.item),factor});
 }
 const root=[...docs.keys()].find(p=>p.toLowerCase()==='3d/3dmodel.model')||fail('3MF must include 3D/3dmodel.model.');
 const output:number[]=[];const notes=['3MF build-item and component transforms are preserved; metadata, colours and existing slicer settings are not imported.'];let instances=0;
 function visit(path:string,id:string,stack:string[],transforms:number[][]){
  const key=path+'#'+id;if(stack.includes(key)||stack.length>32)fail('Cyclic or excessively nested 3MF components.');const obj=docs.get(path)?.objects.get(id);if(!obj)fail('3MF references a missing object.');if(!['model','other'].includes(obj.type))fail('Non-model 3MF resource types require review in Bambu Studio.');
  if(++instances>LIMITS.triangles)fail('3MF contains too many component instances.');
  if(obj.triangles.length){if(output.length/9+obj.triangles.length>LIMITS.triangles)fail('Expanded 3MF exceeds the 120,000-triangle limit.');const mirror=transforms.reduce((v,m)=>v*det(m),1)<0;
   for(const t of obj.triangles){const order=mirror?[t[0],t[2],t[1]]:t;for(const vi of order){let p=obj.vertices[vi];for(const m of transforms)p=point(p,m);output.push(...p);}}
  }
  for(const c of obj.components){let other=c['@_path']?String(c['@_path']).replace(/^\//,''):path;if(other.includes('..')||other.includes('\\')||/^[a-z]+:/i.test(other))fail('External 3MF references are not allowed.');const m=transform(c['@_transform']);m[9]*=docs.get(path).factor;m[10]*=docs.get(path).factor;m[11]*=docs.get(path).factor;visit(other,c['@_objectid'],[...stack,key],[m,...transforms]);}
 }
 const doc=docs.get(root);if(!doc.build.length)fail('3MF has no build items.');for(const item of doc.build){if(item['@_printable']==='0'||item['@_printable']==='false')continue;const m=transform(item['@_transform']);m[9]*=doc.factor;m[10]*=doc.factor;m[11]*=doc.factor;visit(root,item['@_objectid'],[],[m]);}
 if(doc.build.length>1)notes.push('Multiple build items are analyzed together. Check plate assignment and each part separately in Bambu Studio.');
 return {positions:validatePositions(new Float32Array(output)),format:'3MF',notes};
}
export function parseModel(buffer:ArrayBuffer,filename:string):Mesh {const ext=filename.split('.').at(-1)?.toLowerCase();if(ext==='stl')return parseSTL(buffer);if(ext==='3mf')return parse3MF(buffer);return fail('Unsupported format. Upload a binary/ASCII STL or a 3MF.');}
