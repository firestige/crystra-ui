export const resourceGroups=['角色（Role）','技能（Skill）','脚本／工具','模板（Template）','活动指令','参考资料'] as const;
export type ResourcePresentation={id:string;type:'cli';name:string;renderer:'markdown';members:string[];aliases:string[]};
export type CatalogFile={path:string;content:string;internal:boolean;displayName?:string;presentation?:ResourcePresentation};
export type CatalogResource={id:string;aliases:string[];name:string;purpose:string;path:string;group:string;files:CatalogFile[]};
export function resourceCatalog(files:CatalogFile[],nodes:{id:string;kind:string;label:string;detail?:string}[]=[],edges:{from:string;to:string}[]=[]):CatalogResource[]{
 const name=(f:CatalogFile)=>f.content.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1]||f.content.match(/^#\s+(.+)$/m)?.[1]||f.path.split('/').at(-1)!.replace(/\.(role|prompt)?\.?[a-z0-9]+$/i,'').replaceAll('-',' ');
 const declared=files.filter(f=>f.presentation);const memberPaths=new Set(declared.flatMap(f=>f.presentation!.members));
 return files.flatMap(f=>{if(f.presentation){const p=f.presentation;return [{id:p.id,aliases:p.aliases,name:f.displayName||p.name,purpose:'',path:f.path,group:'脚本／工具',files:files.filter(member=>p.members.includes(member.path))}];}if(memberPaths.has(f.path))return [];
if(f.internal||/^(definition|schemas|validators|conformance|drivers|agents)\//.test(f.path))return [];const skill=f.path.match(/^skills\/([^/]+)\//);if(skill&&!f.path.endsWith('/SKILL.md'))return [];
 const group=skill?'技能（Skill）':/^roles\//.test(f.path)?'角色（Role）':/^prompts\//.test(f.path)?'活动指令':/^(cli|scripts)\//.test(f.path)?'脚本／工具':/^templates\//.test(f.path)?'模板（Template）':/\.(md|markdown|pdf|png|jpe?g|svg|webp|gif)$/i.test(f.path)?'参考资料':null;if(!group)return [];
 let title=name(f),purpose=f.content.match(/^description:\s*(.+)$/m)?.[1]||'';
 if(skill&&(!title||/^skill(?:\.md)?$/i.test(title)))title=skill[1];
 const resourceIds=edges.filter(e=>e.to==='file:'+f.path).map(e=>e.from);const role=nodes.find(n=>n.kind==='role'&&edges.some(e=>e.from===n.id&&resourceIds.includes(e.to)));if(role){title=role.label;try{purpose=JSON.parse(role.detail||'{}').responsibility||purpose;}catch{/* Missing optional metadata does not hide a resource. */}}
 const aliases=['file:'+f.path,...resourceIds.filter(id=>nodes.some(n=>n.id===id&&n.kind==='resource')),...(role?[role.id]:[])];
 return [{id:role?.id||aliases.find(id=>!id.startsWith('file:'))||'resource:'+f.path,aliases,name:f.displayName||title,purpose,path:f.path,group,files:skill?files.filter(x=>x.path.startsWith('skills/'+skill[1]+'/')):[f]}];});
}
