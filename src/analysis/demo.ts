import {BoxGeometry,CylinderGeometry,ExtrudeGeometry,Shape} from 'three';
import type {Mesh} from '../types';
export function demoModel(type='coaster'):Mesh {
 const shape=new Shape();shape.moveTo(-8,0);for(const [x,z] of [[8,0],[8,25],[30,25],[30,35],[-30,35],[-30,25],[-8,25]])shape.lineTo(x,z);shape.closePath();
 const g=type==='tower'?new BoxGeometry(14,14,140):type==='overhang'?new ExtrudeGeometry(shape,{depth:10,bevelEnabled:false}):new CylinderGeometry(45,45,6,64);
 if(type==='overhang')g.rotateX(Math.PI/2);
 if(type==='coaster')g.rotateX(Math.PI/2);
 const raw=g.index?g.toNonIndexed():g;const positions=new Float32Array(raw.attributes.position.array);
 g.dispose();raw.dispose();return {positions,format:'Demo',notes:['Built-in synthetic sample, not your uploaded model.','STL-style sample units are millimeters.']};
}
