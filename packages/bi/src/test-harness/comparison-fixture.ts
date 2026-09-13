import type { DeliverySearchRecord } from '../domain/delivery-search';
import type { MatrixData } from '../domain/widget-families';
import { roles } from './observation-fixture';
export type ComparisonMetric = 'input'|'output'|'mean';
// UI-only measurements keyed by Delivery, never derived by distributing Task totals.
export function comparisonSamples(deliveries:readonly DeliverySearchRecord[]) {
 return deliveries.flatMap(delivery=>roles.map((role,index)=>{
  const seed=Number(delivery.deliveryId.split('-').at(-1))||1;
  const calls=2+(seed+index)%5;
  return {deliveryId:delivery.deliveryId,task:delivery.taskId,taskName:delivery.taskName,version:delivery.workflowVersion,role,calls,input:calls*(1100+seed*37+index*211),output:calls*(430+seed*13+index*71)};
 }));
}
export function buildComparisonData(deliveries:readonly DeliverySearchRecord[], selectedRoles:readonly string[], versions:readonly string[],metric:ComparisonMetric):MatrixData {
 const scope=deliveries.filter(delivery=>versions.includes(delivery.workflowVersion));
 const samples=comparisonSamples(scope);
 const rows=selectedRoles.map(role=>({name:role,values:scope.map(delivery=>{
  const sample=samples.find(row=>row.deliveryId===delivery.deliveryId&&row.role===role);
  if(!sample)return 0;
  return metric==='mean'?Math.round(sample.input/sample.calls):sample[metric];
 })}));
 return {family:'matrix',title:{input:'输入 Token',output:'输出 Token',mean:'单次平均输入 Token'}[metric],unit:' tokens',ordered:false,dimensions:scope.map(delivery=>`${delivery.deliveryId} · ${delivery.workflowVersion}`),rows,domain:[0,Math.max(1,...rows.flatMap(row=>row.values))]};
}
