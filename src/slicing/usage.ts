/** Kernel filament_mm already includes its prime tower. Never add purge a second time. */
export function filamentGrams(lengths:number[],diameters:number[],densities:number[]):number|null{
 if(!lengths.length)return null;
 let total=0;
 for(let i=0;i<lengths.length;i++){
  if(lengths[i]===0)continue;
  const d=diameters.length===1?diameters[0]:diameters[i],rho=densities.length===1?densities[0]:densities[i];
  if(!Number.isFinite(lengths[i])||lengths[i]<0||!Number.isFinite(d)||d<=0||!Number.isFinite(rho)||rho<=0)return null;
  total+=lengths[i]*Math.PI*(d/2)**2*rho/1000;
 }
 return total>0?total:null;
}
