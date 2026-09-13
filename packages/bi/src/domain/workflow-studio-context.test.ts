import {expect,it} from 'vitest';
import {workflowStudioContext} from './workflow-studio-context';
it('keeps a workflow identity across its two work surfaces',()=>{
 expect(workflowStudioContext(new URLSearchParams()).title).toBe('Implementation');
 const c=workflowStudioContext(new URLSearchParams('workflow_definition_id=build-and-sign&revision=v3&view=crystallization'));
 expect(c.description).toBe('构建与签名工作流');
 expect(c).toMatchObject({title:'build-and-sign',view:'crystallization',resolved:true,activityStudy:false});
});
it('preserves unresolved identity and migrates old top-level tabs',()=>{
 expect(workflowStudioContext(new URLSearchParams('workflow_definition_id=unknown&revision=v7&view=runs'))).toMatchObject({title:'unknown',view:'studio',resolved:false});
 expect(workflowStudioContext(new URLSearchParams('new_workflow=1'))).toMatchObject({title:'新建工作流',resolved:false,isNew:true});
 expect(workflowStudioContext(new URLSearchParams('revision=v3'))).toMatchObject({title:'未指定工作流',resolved:false});
});
