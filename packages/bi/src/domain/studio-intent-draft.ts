/** Local UI fixture only. Production publication must use the Workflow owner gate. */
export type StudioChange='return-path'|'test-skill';
export type StudioDraft={returnPath:boolean;testSkill:boolean};
export const initialStudioDraft=():StudioDraft=>({returnPath:false,testSkill:false});
export const applyStudioChange=(d:StudioDraft,c:StudioChange):StudioDraft=>({...d,...(c==='return-path'?{returnPath:true}:{testSkill:true})});
export function checkStudioDraft(d:StudioDraft){return {identity:JSON.stringify(d),issues:[...(!d.returnPath?[{id:'return-path' as const,node:'accept',title:'验收未通过后，还没有安排下一步',detail:'补齐失败时的返回路径，才能保证这段流程可以继续。'}]:[]),...(!d.testSkill?[{id:'test-skill' as const,node:'red',title:'编写测试使用的资源尚未确定',detail:'选择可用的测试编写资源，并确认它适用于当前项目。'}]:[])]};}
export function publishStudioDraft(d:StudioDraft,check:ReturnType<typeof checkStudioDraft>){if(check.identity!==JSON.stringify(d)||check.issues.length||checkStudioDraft(d).issues.length)throw Error('当前草稿尚未通过发布检查');return {content:{...d},checkedIdentity:check.identity};}
