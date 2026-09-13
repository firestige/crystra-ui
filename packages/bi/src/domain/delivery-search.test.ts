import { expect, it } from 'vitest';
import { searchDeliveries, filterDeliveryResults, selectedDelivery, type DeliverySearchRecord, type DeliverySearchField, type DeliverySearchCondition } from './delivery-search';
const older:DeliverySearchRecord={deliveryId:'delivery-1',traceId:'trace-1',taskId:'task-1',taskName:'发布方案',workflowId:'workflow-1',workflowName:'Implementation',workflowVersion:'v2',startedAt:'2026-09-08T10:00:00Z'};
const newer={...older,deliveryId:'delivery-2',traceId:'trace-2',workflowVersion:'v3',startedAt:'2026-09-09T10:00:00Z'};
const range=['2026-09-08T00:00:00Z','2026-09-10T00:00:00Z'] as const;
const fields:DeliverySearchField[]=[{key:'taskId',label:'Task ID',placeholder:'',match:'exact'},{key:'taskName',label:'Task 名称',placeholder:'',match:'contains'},{key:'workflowRef',label:'Workflow',placeholder:'',match:'workflow'},{key:'deliveryId',label:'Delivery ID',placeholder:'',match:'exact'}];
const condition=(field:DeliverySearchField['key'],value:string):DeliverySearchCondition=>({id:field+value,field,value});
it('only searches the explicitly selected indexed field and rejects unindexed fields',()=>{
 expect(searchDeliveries([older,newer],[condition('taskName','发布')],range,fields)).toHaveLength(2);
 expect(searchDeliveries([older,newer],[condition('taskId','发布')],range,fields)).toHaveLength(0);
 expect(searchDeliveries([older,newer],[condition('taskId','task')],range,fields)).toHaveLength(0);
 expect(searchDeliveries([older,newer],[condition('traceId','trace-1')],range,fields)).toHaveLength(0);
 expect(searchDeliveries([older,newer],[condition('deliveryId','delivery-2')],range,fields)).toEqual([newer]);
});
it('combines independently removable conditions and applies time bounds',()=>{
 const task=condition('taskId','task-1'),version=condition('workflowRef','Implementation@v2');
 expect(searchDeliveries([older,newer],[task,version],range,fields)).toEqual([older]);
 expect(searchDeliveries([older,newer],[task],range,fields)).toEqual([newer,older]);
 expect(searchDeliveries([older,newer],[version],range,fields)).toEqual([older]);
 expect(searchDeliveries([older,newer],[],['2026-09-08T00:00:00Z','2026-09-08T23:59:59Z'],fields)).toEqual([older]);
});
it('filters only current results and preserves other filters when one is removed',()=>{
 const copy={...older,deliveryId:'copy',taskId:'task-2'};
 const all=[older,newer,copy];
 const searched=searchDeliveries(all,[condition('taskId','task-1')],range,fields);
 expect(filterDeliveryResults(searched,{taskId:'task-2'})).toHaveLength(0);
 expect(filterDeliveryResults(all,{taskId:'task-1',workflowVersion:'v2'})).toEqual([older]);
 expect(filterDeliveryResults(all,{workflowVersion:'v2'})).toEqual([older,copy]);
 expect(selectedDelivery([newer,older],older.deliveryId)).toBe(older);
 expect(selectedDelivery([newer],older.deliveryId)).toBe(newer);
 expect(selectedDelivery([],newer.deliveryId)).toBeNull();
});

it('Workflow uses name keywords without @ and exact selectors with @',()=>{
 expect(searchDeliveries([older,newer],[condition('workflowRef','imple')],range,fields)).toEqual([newer,older]);
 expect(searchDeliveries([older,newer],[condition('workflowRef','Implementation@v2')],range,fields)).toEqual([older]);
 for(const value of ['imple@v2','Implementation@v','Implementation@','implementation@v2']) expect(searchDeliveries([older,newer],[condition('workflowRef',value)],range,fields)).toEqual([]);
});
