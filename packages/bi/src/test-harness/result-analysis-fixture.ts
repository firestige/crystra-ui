// Synthetic call-level facts for interaction review, not provider quotes or production metrics.
import {deliveryDirectoryRecords} from './delivery-directory-fixture';
export const analysisDeliveries=deliveryDirectoryRecords;
export const analysisFacts=analysisDeliveries.flatMap((delivery,d)=>Array.from({length:12},(_,i)=>{
 const version=delivery.workflowVersion,cached=version==='v3'?720:240;
 return {date:delivery.startedAt.slice(0,10),delivery:delivery.deliveryId,version,role:i%2?'Reviewer':'Engineer',model:i%3?'Model A':'Model B',provider:i%4?'Provider A':'Provider B',input:1000+i*11+d*3,cached,output:180+i*3,cost:(1000+i*11+d*3-cached)*0.000002+cached*0.0000002+(180+i*3)*0.000008,ttft:350+(i%6)*120+d*5+(version==='v2'?140:0)};
}));
export const analysisDimensions = [{key:'date',label:'日期'},{key:'version',label:'Workflow 版本'},{key:'role',label:'Role'},{key:'model',label:'模型'},{key:'provider',label:'Provider'}] as const;
export type AnalysisDimension = typeof analysisDimensions[number]['key'];
export const analysisMetrics = [
 {key:'cost',label:'实际费用',unit:'USD',operations:[{key:'sum',label:'总费用'},{key:'perDelivery',label:'每 Delivery 平均费用'},{key:'mean',label:'每次调用平均费用'}]},
 {key:'cache',label:'输入 Token 缓存命中率',unit:'%',operations:[{key:'ratio',label:'缓存输入 Token / 全部输入 Token'}]},
 {key:'calls',label:'API 调用次数',unit:'次',operations:[{key:'count',label:'调用记录计数'}]},
 {key:'ttft',label:'首次输出延时',unit:'ms',operations:[{key:'p50',label:'P50'},{key:'p95',label:'P95'},{key:'mean',label:'算术平均'}]},
 {key:'input',label:'输入 Token 数',unit:'Token',operations:[{key:'sum',label:'求和'}]},
 {key:'output',label:'输出 Token 数',unit:'Token',operations:[{key:'sum',label:'求和'}]},
 {key:'cached',label:'缓存命中 Token 数',unit:'Token',operations:[{key:'sum',label:'求和'}]},
 {key:'uncached',label:'未命中缓存 Token 数',unit:'Token',operations:[{key:'sum',label:'求和'}]},
 {key:'tokens',label:'总 Token 数',unit:'Token',operations:[{key:'sum',label:'求和'}]},
] as const;
export type AnalysisMetric=typeof analysisMetrics[number]['key'];
export function analyzeFacts(deliveries:string[],dimensions:AnalysisDimension[],metrics:AnalysisMetric[],operations:Partial<Record<AnalysisMetric,string>>){
 const facts=analysisFacts.filter(row=>deliveries.includes(row.delivery));
 const groups=new Map<string,typeof facts>();
 for(const row of facts){const key=dimensions.length?dimensions.map(key=>row[key]).join(' · '):'全部记录';groups.set(key,[...(groups.get(key)??[]),row]);}
 return [...groups].map(([name,rows])=>({name,keys:dimensions.map(key=>rows[0][key]),count:rows.length,deliveryCount:new Set(rows.map(row=>row.delivery)).size,values:Object.fromEntries(metrics.map(metric=>{
  let value:number;
  if(metric==='cost'){value=rows.reduce((total,row)=>total+row.cost,0);if(operations.cost==='mean')value/=rows.length;if(operations.cost==='perDelivery')value/=new Set(rows.map(row=>row.delivery)).size;}
  else if(metric==='cache')value=100*rows.reduce((total,row)=>total+row.cached,0)/rows.reduce((total,row)=>total+row.input,0);
  else if(metric==='calls')value=rows.length;
  else if(metric!=='ttft'){value=rows.reduce((sum,row)=>sum+(metric==='tokens'?row.input+row.output:metric==='uncached'?row.input-row.cached:row[metric]),0);}
  else {const values=rows.map(row=>row.ttft).sort((a,b)=>a-b);value=operations.ttft==='mean'?values.reduce((a,b)=>a+b,0)/values.length:values[Math.ceil(values.length*(operations.ttft==='p50'?.5:.95))-1];}
  return [metric,value];
 })) as Record<AnalysisMetric,number>}));
}

export interface AnalysisItem { id:string; metric:AnalysisMetric; operation:string; name:string }
export function analyzeItems(deliveries:string[],dimensions:AnalysisDimension[],items:AnalysisItem[]){
 const base=analyzeFacts(deliveries,dimensions,[],{cost:'sum',cache:'ratio',calls:'count',ttft:'p95'});
 const values=items.map(item=>analyzeFacts(deliveries,dimensions,[item.metric],{cost:'sum',cache:'ratio',calls:'count',ttft:'p95',[item.metric]:item.operation}));
 return base.map((row,index)=>({...row,values:Object.fromEntries(items.map((item,i)=>[item.id,values[i][index].values[item.metric]]))}));
}
