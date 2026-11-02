import {describe,it,expect} from 'vitest';
import {filamentGrams} from '../src/slicing/usage';
import {sampleSTL} from '../src/slicing/stl';
describe('sliced material usage',()=>{
 it('uses each material density without double counting the tower',()=>{expect(filamentGrams([1000,2000],[1.75,1.75],[1.24,1.27])).toBeCloseTo(Math.PI*(1.75/2)**2*(1.24+2*1.27),7);});
 it('refuses missing or invalid density for a used material',()=>{expect(filamentGrams([1000,2000],[1.75],[1.24,NaN])).toBeNull();expect(filamentGrams([-1],[1.75],[1.24])).toBeNull();expect(filamentGrams([1000],[NaN],[1.24])).toBeNull();});
 it('does not require density for unused slots',()=>{expect(filamentGrams([1000,0],[1.75],[1.24,NaN])).toBeGreaterThan(0);});
 it('encodes sample positions in millimetres without translating them',()=>{const v=new DataView(sampleSTL(new Float32Array([1,2,3,4,5,6,7,8,9])));expect(v.getUint32(80,true)).toBe(1);expect(v.getFloat32(96,true)).toBe(1);expect(v.getFloat32(128,true)).toBe(9);});
});
