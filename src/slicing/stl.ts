/** Binary STL for built-in samples only. Original uploads must keep their 3MF paint and metadata. */
export function sampleSTL(positions:Float32Array):ArrayBuffer{
 const triangles=positions.length/9,buffer=new ArrayBuffer(84+50*triangles),view=new DataView(buffer);view.setUint32(80,triangles,true);
 for(let t=0;t<triangles;t++)for(let v=0;v<9;v++)view.setFloat32(84+t*50+12+v*4,positions[t*9+v],true);
 return buffer;
}
