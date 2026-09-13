export interface DeliverySearchRecord {
  deliveryId: string;
  traceId: string;
  taskId: string;
  taskName: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  startedAt: string;
}
/** Supplied by the query adapter's indexed-field catalogue, not inferred from row properties. */
export interface DeliverySearchField {
  key: keyof DeliverySearchRecord | 'workflowRef';
  label: string;
  placeholder: string;
  match: 'exact' | 'contains' | 'workflow';
}
export interface DeliverySearchCondition { id: string; field: DeliverySearchField['key']; value: string }
export interface DeliveryFilters { taskId?: string; workflowId?: string; workflowVersion?: string }
export function searchDeliveries(records: readonly DeliverySearchRecord[], conditions: readonly DeliverySearchCondition[], range: readonly [string,string], fields: readonly DeliverySearchField[]) {
  const [start,end]=range.map(Date.parse);
  return records.filter(record=>{
    const time=Date.parse(record.startedAt);
    return time>=start && time<=end && conditions.every(condition=>{
      const field=fields.find(item=>item.key===condition.field);
      if(!field) return false;
      const actual=field.key==='workflowRef'?`${record.workflowName}@${record.workflowVersion}`:record[field.key];
      const expected=condition.value.trim();
      if(field.match==='workflow') return expected.includes('@')?actual===expected:record.workflowName.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
      return field.match==='exact'?actual===expected:actual.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
    });
  }).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)||a.deliveryId.localeCompare(b.deliveryId));
}
/** Only receives the current search result set. It never starts a new global search. */
export function filterDeliveryResults(results: readonly DeliverySearchRecord[], filters: DeliveryFilters) {
  return results.filter(record=>(!filters.taskId||record.taskId===filters.taskId)&&(!filters.workflowId||record.workflowId===filters.workflowId)&&(!filters.workflowVersion||record.workflowVersion===filters.workflowVersion));
}
export function selectedDelivery(records: readonly DeliverySearchRecord[], id: string | null | undefined) {
  return records.find(record=>record.deliveryId===id)??records[0]??null;
}
