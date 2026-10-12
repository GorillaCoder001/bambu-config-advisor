import {describe,it,expect} from 'vitest';
import {box,merge} from './fixtures';
import {analyzeMesh,FULL_TOPOLOGY_LIMIT} from '../src/analysis/mesh-analysis';
describe('geometry and mesh health',()=>{
 it('measures a flat coaster without suggesting elevated overhang',()=>{const a=analyzeMesh(box(100,100,6));expect(a.dimensions).toEqual([100,100,6]);expect(a.volume).toBeCloseTo(60000);expect(a.area).toBeCloseTo(22400);expect(a.contactArea).toBeCloseTo(10000);expect(a.overhangPercent).toBe(0);expect(a.health).toBe('Good');expect(a.vertices).toBe(8);expect(a.classifications[0].label).toBe('Flat / wide');});
 it('identifies tall proportions',()=>expect(analyzeMesh(box(10,10,100)).aspect).toBe(10));
 it('measures a thin global dimension without claiming local wall thickness',()=>expect(analyzeMesh(box(.3,100,100)).thinDimension).toBeCloseTo(.3));
 it('detects elevated undersides when there is a lower object',()=>{const a=analyzeMesh(merge(box(10,10,30,[0,0,15]),box(60,60,5,[0,0,32.5])));expect(a.overhangPercent).toBeGreaterThan(1);expect(a.bridgeCandidate).toBe(true);});
 it('detects multiple components and withholds unresolved volume',()=>{const a=analyzeMesh(merge(box(),box(10,10,10,[60,0,0])));expect(a.components).toBe(2);expect(a.volume).toBeNull();expect(a.health).toBe('Review recommended');});
 it('detects open meshes',()=>{const m=box();m.positions=m.positions.slice(9);const a=analyzeMesh(m);expect(a.boundaryEdges).toBeGreaterThan(0);expect(a.watertight).toBe(false);expect(a.volume).toBeNull();});
 it('detects reversed winding',()=>{const m=box();for(let i=0;i<m.positions.length;i+=9)for(let j=0;j<3;j++){const t=m.positions[i+3+j];m.positions[i+3+j]=m.positions[i+6+j];m.positions[i+6+j]=t;}const a=analyzeMesh(m);expect(a.invertedComponents).toBe(1);expect(a.health).toBe('Problem detected');expect(a.normalReliability).toBe(false);});
 it('detects duplicate faces and non-manifold edges',()=>{const a=analyzeMesh(merge(box(),{...box(),positions:box().positions.slice(0,9)}));expect(a.duplicateTriangles).toBe(1);expect(a.nonManifoldEdges).toBe(3);});
 it('detects zero-area faces',()=>{const m=merge(box(),{positions:new Float32Array(9),format:'STL',notes:[]});expect(analyzeMesh(m).degenerate).toBe(1);});
 it('does not mutate uploaded positions',()=>{const m=box(100,100,6);const old=new Float32Array(m.positions);analyzeMesh(m);expect(m.positions).toEqual(old);});
});


it('measures the full large model while explicitly withholding topology results',()=>{
 const cube=box().positions;const count=Math.ceil((FULL_TOPOLOGY_LIMIT+1)/12)*12;const positions=new Float32Array(count*9);for(let i=0;i<positions.length;i+=cube.length)positions.set(cube,i);
 const a=analyzeMesh({positions,format:'STL',notes:[]});expect(a.triangles).toBe(count);expect(a.dimensions).toEqual([20,20,20]);expect(a.area).toBeCloseTo(2400*count/12);expect(a.topologyChecked).toBe(false);expect(a.vertices).toBeNull();expect(a.boundaryEdges).toBeNull();expect(a.volume).toBeNull();expect(a.health).toBe('Review recommended');expect(a.normalReliability).toBe(false);
});
