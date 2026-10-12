import {describe,it,expect} from 'vitest';
import {ascii,binary,box,xml,mf} from './fixtures';
import {parseSTL,parse3MF,parseModel,inspectZip,LIMITS} from '../src/analysis/parsers';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {strToU8,zipSync} from 'fflate';
describe('STL parsing',()=>{
 it('parses ASCII STL',()=>expect(parseSTL(ascii()).positions.length).toBe(108));
 it('parses binary STL whose header begins solid',()=>expect(parseSTL(binary()).positions.length).toBe(108));
 it('rejects a truncated binary file',()=>expect(()=>parseSTL(binary().slice(0,100))).toThrow('Invalid STL'));
 it('rejects malformed ASCII facet',()=>expect(()=>parseSTL(strToU8('solid x\nfacet normal 0 0 0\nvertex 1 2 3\nendfacet\nendsolid x').buffer as ArrayBuffer)).toThrow('three'));
 it('rejects nonfinite binary coordinates',()=>{const b=binary();new DataView(b).setFloat32(96,NaN,true);expect(()=>parseSTL(b)).toThrow('invalid');});
 it('rejects excessive triangle count before allocation',()=>{const b=new ArrayBuffer(84+(LIMITS.triangles+1)*50);new DataView(b).setUint32(80,LIMITS.triangles+1,true);expect(()=>parseSTL(b)).toThrow('triangle');});
 it('rejects unsupported format',()=>expect(()=>parseModel(binary(),'model.step')).toThrow('Unsupported'));
 it('rejects oversized files',()=>expect(()=>parseSTL(new ArrayBuffer(LIMITS.bytes+1))).toThrow('256 MB'));
});
describe('3MF parsing and security',()=>{
 it('parses core 3MF with correct volume',()=>expect(analyzeMesh(parse3MF(mf())).volume).toBeCloseTo(8000));
 it('preserves units and transforms',()=>{let s=xml(box(1,2,3),'inch').replace('<item objectid="1"/>','<item objectid="1" transform="1 0 0 0 1 0 0 0 1 1 0 0"/>');const a=analyzeMesh(parse3MF(mf(s)));expect(a.dimensions[0]).toBeCloseTo(25.4,3);expect(a.min[0]).toBeCloseTo(12.7,3);expect(a.dimensions[2]).toBeCloseTo(76.2,3);});
 it('expands component references and nested transforms',()=>{const s=xml().replace('</resources>','<object id="2"><components><component objectid="1" transform="1 0 0 0 1 0 0 0 1 20 0 0"/></components></object></resources>').replace('<item objectid="1"/>','<item objectid="2"/>');expect(analyzeMesh(parse3MF(mf(s))).min[0]).toBeCloseTo(10);});
 it('resolves production-extension component paths locally',()=>{const root='<model xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"><resources><object id="2"><components><component p:path="/3D/Objects/part.model" objectid="1"/></components></object></resources><build><item objectid="2"/></build></model>';expect(analyzeMesh(parse3MF(mf(root,{'3D/Objects/part.model':strToU8(xml())}))).volume).toBeCloseTo(8000);});
 it('corrects reflected transform winding, without changing geometry orientation',()=>{const s=xml().replace('<item objectid="1"/>','<item objectid="1" transform="-1 0 0 0 1 0 0 0 1 0 0 0"/>');const a=analyzeMesh(parse3MF(mf(s)));expect(a.invertedComponents).toBe(0);expect(a.volume).toBeCloseTo(8000);});
 it('rejects cyclic components',()=>{const s='<model><resources><object id="1"><components><component objectid="1"/></components></object></resources><build><item objectid="1"/></build></model>';expect(()=>parse3MF(mf(s))).toThrow('Cyclic');});
 it('rejects XML entities and DOCTYPE',()=>expect(()=>parse3MF(mf('<!DOCTYPE model [<!ENTITY x "abc">]>'+xml()))).toThrow('entities'));
 it('rejects malformed XML',()=>expect(()=>parse3MF(mf('<model><bad></model>'))).toThrow('Malformed'));
 it('rejects invalid vertex indices',()=>expect(()=>parse3MF(mf(xml().replace('v1="0"','v1="99999"')))).toThrow('index'));
 it('rejects an external URL component',()=>{const s=xml().replace('</resources>','<object id="2"><components><component path="https://example.com/part.model" objectid="1"/></components></object></resources>').replace('<item objectid="1"/>','<item objectid="2"/>');expect(()=>parse3MF(mf(s))).toThrow('External');});
 it('rejects traversal archive paths',()=>expect(()=>parse3MF(mf(xml(),{'../bad.model':strToU8(xml())}))).toThrow('Unsafe'));
 it('rejects declared decompression bomb before inflating',()=>{const b=mf();const d=new DataView(b);for(let i=0;i<b.byteLength-46;i++)if(d.getUint32(i,true)===0x02014b50){d.setUint32(i+24,LIMITS.expanded+1,true);break;}expect(()=>inspectZip(b)).toThrow('decompression');});
 it('rejects too many ZIP entries',()=>{const files:Record<string,Uint8Array>={};for(let i=0;i<LIMITS.entries+1;i++)files[i+'.txt']=strToU8('a');expect(()=>inspectZip(zipSync(files).buffer as ArrayBuffer)).toThrow('too many');});
 it('rejects disagreeing ZIP entry sizes',()=>{const b=mf();new DataView(b).setUint32(22,2,true);expect(()=>inspectZip(b)).toThrow('sizes');});
 it('rejects missing build items',()=>expect(()=>parse3MF(mf(xml().replace('<item objectid="1"/>','')))).toThrow('build'));
});


describe('expanded model capacity and project settings',()=>{
 it('accepts a binary STL above the old triangle cap',()=>{const positions=new Float32Array(130_008*9);const cube=box().positions;for(let i=0;i<positions.length;i+=cube.length)positions.set(cube,i);const mesh=parseSTL(binary({positions,format:'STL',notes:[]}));expect(mesh.positions.length/9).toBe(130_008);});
 it('accepts 3MF geometry above the old resource cap with compact mesh tables',()=>{const positions=new Float32Array(120_012*9);const cube=box().positions;for(let i=0;i<positions.length;i+=cube.length)positions.set(cube,i);const content=xml({positions,format:'STL',notes:[]});const bytes=zipSync({'3D/3dmodel.model':strToU8(content)},{level:0});expect(parse3MF(bytes.buffer as ArrayBuffer).positions.length/9).toBe(120_012);},20000);
 it('imports actual project settings and detects individual overrides',()=>{const mesh=parse3MF(mf(xml(),{'Metadata/project_settings.config':strToU8(JSON.stringify({layer_height:'0.2',wall_loops:3,nozzle_temperature:['220','230']})),'Metadata/model_settings.config':strToU8('<config><object id="1"><metadata key="wall_loops" value="5"/></object></config>')}));expect(mesh.currentSettings?.values.layer_height).toEqual(['0.2']);expect(mesh.currentSettings?.overrides).toEqual(['wall_loops']);expect(mesh.currentSettings?.values.nozzle_temperature).toEqual(['220','230']);});
 it('keeps valid geometry when optional settings metadata is malformed',()=>{const mesh=parse3MF(mf(xml(),{'Metadata/project_settings.config':strToU8('bad json')}));expect(mesh.positions.length).toBe(108);expect(mesh.currentSettings).toBeUndefined();expect(mesh.notes.join(' ')).toContain('could not be imported');});
 it('accepts more than 128 ordinary project entries',()=>{const extras:Record<string,Uint8Array>={};for(let i=0;i<150;i++)extras['Metadata/extra'+i+'.txt']=strToU8('metadata');expect(parse3MF(mf(xml(),extras)).positions.length).toBe(108);});
 it('parses single-quoted XML attributes',()=>expect(parse3MF(mf(xml().replaceAll('"',"'"))).positions.length).toBe(108));
});

it('ignores commented-out mesh tables instead of treating them as geometry',()=>{const content=xml().replace('<vertices>','<vertices><!-- <vertex x="999" y="999" z="999"/> -->');expect(analyzeMesh(parse3MF(mf(content))).dimensions).toEqual([20,20,20]);});
it('accepts binary STL at the new two-million-triangle boundary (over the old 24 MiB file cap)',()=>{const count=LIMITS.triangles;const buffer=new ArrayBuffer(84+count*50);const d=new DataView(buffer);d.setUint32(80,count,true);const cube=box().positions;for(let i=0;i<count;i++)for(let k=0;k<9;k++)d.setFloat32(84+i*50+12+k*4,cube[(i%12)*9+k],true);const mesh=parseSTL(buffer);expect(mesh.positions.length/9).toBe(count);expect(analyzeMesh(mesh).topologyChecked).toBe(false);},20000);
