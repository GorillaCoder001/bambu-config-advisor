import {parseModel} from './parsers';
import {analyzeMesh} from './mesh-analysis';
self.onmessage=(event:MessageEvent<{buffer:ArrayBuffer;filename:string}>)=>{
 try{self.postMessage({type:'progress',message:'Parsing geometry…'});const mesh=parseModel(event.data.buffer,event.data.filename);const analysis=analyzeMesh(mesh,message=>self.postMessage({type:'progress',message}));self.postMessage({type:'complete',mesh,analysis}, {transfer:[mesh.positions.buffer]});}
 catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'The model could not be analyzed safely.'});}
};
