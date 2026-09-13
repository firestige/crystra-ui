import {expect,it} from 'vitest';
import {buildComparisonData,comparisonSamples} from './comparison-fixture';
import {deliveryDirectoryRecords} from './delivery-directory-fixture';
it('compares only selected Delivery, Role and version identities',()=>{
 const records=deliveryDirectoryRecords.slice(0,3);
 const data=buildComparisonData(records,['Engineer'],['v2'],'input');
 expect(data.dimensions).toEqual(['delivery-0002 · v2','delivery-0003 · v2']);
 expect(data.rows.map(row=>row.name)).toEqual(['Engineer']);
 const selected=buildComparisonData(records.slice(1,2),['Engineer'],['v2'],'output');
 expect(selected.dimensions).toHaveLength(1);
 const sample=comparisonSamples(records.slice(1,2)).find(row=>row.role==='Engineer')!;
 expect(selected.rows[0].values).toEqual([sample.output]);
 expect(buildComparisonData(records.slice(1,2),['Engineer'],['v2'],'mean').rows[0].values).toEqual([Math.round(sample.input/sample.calls)]);
 expect(buildComparisonData([],['Engineer'],['v2'],'input').dimensions).toEqual([]);
});
