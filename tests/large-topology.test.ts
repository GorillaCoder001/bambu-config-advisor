import {it,expect} from 'vitest';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
it('verifies closed geometry above the previous 200k-face cutoff',{timeout:20000},()=>{
 const segments=50001,p=new Float32Array(segments*4*9);let offset=0;
 const tri=(...v:number[][])=>{for(const q of v)for(const x of q)p[offset++]=x;};
 for(let i=0;i<segments;i++){
  const u=i/segments*2*Math.PI,v=(i+1)/segments*2*Math.PI;
  const a=[10*Math.cos(u),10*Math.sin(u),0],b=[10*Math.cos(v),10*Math.sin(v),0],c=[a[0],a[1],20],d=[b[0],b[1],20];
  tri(a,b,d);tri(a,d,c);tri([0,0,0],b,a);tri([0,0,20],c,d);
 }
 const a=analyzeMesh({positions:p,format:'STL',notes:[]});expect(a.topologyChecked).toBe(true);expect(a.watertight).toBe(true);expect(a.volume).toBeCloseTo(Math.PI*100*20,1);
});
