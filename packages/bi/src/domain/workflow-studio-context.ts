export function workflowStudioContext(params:URLSearchParams){
 const isNew=params.get('new_workflow')==='1';
 const id=params.get('workflow_definition_id'),revision=params.get('revision');
 const activityStudy=!isNew&&!id&&!revision;
 return {isNew,activityStudy,description:isNew?'描述目标，开始设计工作流':activityStudy?'从 Goal 到已验证实现':id==='build-and-sign'&&revision==='v3'?'构建与签名工作流':'工作流定义尚未解析',title:isNew?'新建工作流':id|| (activityStudy?'Implementation':'未指定工作流'),resolved:activityStudy||(!isNew&&id==='build-and-sign'&&revision==='v3'),view:params.get('view')==='resources'?'resources':params.get('view')==='crystallization'?'crystallization':'studio'};
}
