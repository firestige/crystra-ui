import {resourceCatalog,type CatalogResource} from './resource-catalog';
export type ResourceWorkspace={title:string;root:string;version:string;files:{path:string;content:string;internal:boolean;truncated:boolean;displayName?:string}[];nodes:{id:string;label:string;kind:string;file?:string;detail?:string}[];edges:{from:string;to:string;label:string}[]};
export type ResourceMutation={kind:'add'|'rename'|'delete';group:string;resource?:CatalogResource};
export type ResourceEvent={id:string;workspace:string;resourceId:string;operation:string;path:string;name:string;previousName?:string;affectedRefs:string[];status:'pending-runtime'};
declare global{interface Window{crystraResourceEvents?:ResourceEvent[]}}
export function resourceDependents(workspace:ResourceWorkspace,resource:CatalogResource){const ids=new Set([...resource.aliases,...resource.files.map(f=>'file:'+f.path)]);for(const n of workspace.nodes)if(n.kind==='resource'&&workspace.edges.some(e=>e.from===n.id&&ids.has(e.to)))ids.add(n.id);const refs=workspace.edges.filter(e=>ids.has(e.to)&&!ids.has(e.from));for(const file of workspace.files){if(ids.has('file:'+file.path)||!file.path.endsWith('.md'))continue;for(const match of file.content.matchAll(/\]\(([^\s)#]+)(?:#[^)]*)?\)/g)){try{const url=new URL(match[1],'https://workspace/'+file.path),to='file:'+decodeURIComponent(url.pathname.slice(1));if(url.host==='workspace'&&ids.has(to)&&!refs.some(e=>e.from==='file:'+file.path&&e.to===to))refs.push({from:'file:'+file.path,to,label:'文档链接'});}catch{/* Unresolvable links are handled by validation. */}}}return {ids,refs};}
export function applyResourceMutation(workspace:ResourceWorkspace,mutation:ResourceMutation,name:string,content:string){
 const resource=mutation.resource,clean=name.trim();if(mutation.kind!=='delete'&&!clean)throw Error('请输入资源名称');
 const catalog=resourceCatalog(workspace.files,workspace.nodes,workspace.edges);if(mutation.kind!=='delete'&&catalog.some(r=>r.path!==resource?.path&&r.group===mutation.group&&r.name===clean))throw Error('同类型已有此名称，请使用不同名称');
 let path=resource?.path||'',affectedRefs:string[]=[];
 if(mutation.kind==='delete'){
  if(!resource)throw Error('资源已不存在');const latest=catalog.find(r=>r.path===resource.path);if(!latest)throw Error('资源已不存在');const {ids,refs}=resourceDependents(workspace,latest);if(refs.length)throw Error('仍有引用，请先解除或替换引用后再删除');
  affectedRefs=workspace.edges.filter(e=>ids.has(e.from)&&!ids.has(e.to)).map(e=>e.to);const paths=new Set(latest.files.map(f=>f.path));workspace.files=workspace.files.filter(f=>!paths.has(f.path));workspace.nodes=workspace.nodes.filter(n=>!ids.has(n.id));workspace.edges=workspace.edges.filter(e=>!ids.has(e.from)&&!ids.has(e.to));
 }else if(mutation.kind==='rename'){
  const file=workspace.files.find(f=>f.path===path);if(!file)throw Error('资源已不存在');if(catalog.find(r=>r.path===path)?.name!==resource!.name)throw Error('名称已变化，请关闭后重新操作');file.displayName=clean;affectedRefs=resourceDependents(workspace,resource!).refs.map(e=>e.from);for(const n of workspace.nodes)if(n.id==='file:'+path)n.label=clean;
 }else{
  const id=crypto.randomUUID(),locations:Record<string,string>={'角色（Role）':`roles/${id}.role.md`,'技能（Skill）':`skills/${id}/SKILL.md`,'脚本／工具':`scripts/${id}.sh`,'模板（Template）':`templates/${id}.md`,'活动指令':`prompts/${id}.prompt.md`,'参考资料':`docs/${id}.md`};path=locations[mutation.group];if(!path)throw Error('未知资源类型');
  const refs:{from:string;to:string;label:string}[]=[];for(const match of content.matchAll(/\]\(([^\s)#]+)(?:#[^)]*)?\)/g)){const target=match[1];if(/^[a-z]+:|^#/i.test(target))continue;const resolved=new URL(target,'https://workspace/'+path);const local=decodeURIComponent(resolved.pathname.slice(1));if(resolved.host!=='workspace'||!workspace.files.some(f=>f.path===local))throw Error('无法解析引用：'+target);refs.push({from:'file:'+path,to:'file:'+local,label:'文档链接'});}
  workspace.files.push({path,displayName:clean,content,internal:false,truncated:false});workspace.nodes.push({id:'file:'+path,label:clean,kind:'file',file:path});workspace.edges.push(...refs);affectedRefs=refs.map(e=>e.to);
 }
 const event:ResourceEvent={id:crypto.randomUUID(),workspace:workspace.root,resourceId:resource?.id||resourceCatalog(workspace.files,workspace.nodes,workspace.edges).find(r=>r.path===path)!.id,operation:mutation.kind,path,name:mutation.kind==='delete'?resource!.name:clean,previousName:resource?.name,affectedRefs,status:'pending-runtime'};
 (window.crystraResourceEvents??=[]).push(event);window.dispatchEvent(new CustomEvent('crystra-resource-changed',{detail:event}));return event;
}
