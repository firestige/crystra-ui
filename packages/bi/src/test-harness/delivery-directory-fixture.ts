import type { DeliverySearchRecord } from '../domain/delivery-search';
// Local UI fixtures: repeated Task context, unique Delivery and Trace identities.
export const deliveryDirectoryRecords: DeliverySearchRecord[] = Array.from({length:48},(_,index)=>({
  deliveryId:`delivery-${String(index+1).padStart(4,'0')}`,
  traceId:(index+1).toString(16).padStart(32,'0'),
  taskId:index===12?'demo-release-copy':index%2===0?'demo-release':'demo-ui',
  taskName:index%2===0?'发布插件市场方案':'UI 工作台设计',
  workflowId:index===12?'workflow-implementation-copy':index%3===0?'workflow-implementation':'workflow-review',
  workflowName:index%3===0?'Implementation':'Review',
  workflowVersion:index%4===0?'v3':'v2',
  startedAt:new Date(Date.parse('2026-09-09T14:08:00Z')-index*4*3600_000).toISOString(),
}));

// Proposed indexed-field capabilities for UI review; actual backend indexes are not asserted here.
export const deliveryDirectorySearchFields: import('../domain/delivery-search').DeliverySearchField[] = [
 {key:'taskName',label:'Task 名称',placeholder:'输入 Task 名称',match:'contains'},
 {key:'taskId',label:'Task ID',placeholder:'输入完整 Task ID',match:'exact'},
 {key:'workflowRef',label:'Workflow',placeholder:'名称或 name@version',match:'workflow'},
 {key:'deliveryId',label:'Delivery ID',placeholder:'输入完整 Delivery ID',match:'exact'},
];
