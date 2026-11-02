import {XMLParser,XMLValidator} from 'fast-xml-parser';
export interface SliceSummary {plate:number;seconds:number;grams:number;}
const list=(v:unknown):any[]=>v==null?[]:Array.isArray(v)?v:[v];
export function parseSliceInfo(xml:string):SliceSummary[]{
 if(xml.length>8*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new Error('Invalid or oversized slice summary.');
 const data=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',processEntities:false,parseAttributeValue:false}).parse(xml);
 const result:SliceSummary[]=[];
 for(const plate of list(data.config?.plate)){
  const fields=Object.fromEntries(list(plate.metadata).map(m=>[m['@_key'],m['@_value']]));
  const index=Number(fields.index),seconds=Number(fields.prediction),grams=Number(fields.weight);
  if(!Number.isInteger(index)||index<1||result.some(r=>r.plate===index)||!Number.isFinite(seconds)||seconds<=0||seconds>365*86400||!Number.isFinite(grams)||grams<=0||grams>100000)continue;
  result.push({plate:index,seconds,grams});
 }
 return result;
}
