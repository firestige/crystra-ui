/** Draft read-only design projection. This is not the executable Workflow DSL. */
export interface ActivityEntity {
 id:string; kind:'activity'|'decision'|'final'|'reopen'|'group'|'artifact'|'boundary';
 title:string; summary:string; description:string; output:string;
 role?:string; model?:string; sourceRef?:string;
}
export interface ActivityFlow {
 id:string; kind:'main'|'subflow'|'triggered'; title:string;
 entryNodeId:string; exitNodeIds:string[]; nodeIds:string[];
 edges:{id:string;from:string;to:string;kind:'control'|'material';outcome:'continue'|'rework'|'success'|'stop';title:string;description:string;sourceRef?:string}[];
}
export interface ActivityRelation {
 id:string; kind:'subflow'|'trigger'; from:{flowId:string;nodeId:string};
 target:{flowId:string;entryNodeId:string;exitNodeId:string}; condition?:string;
 resume:{kind:'origin'}|{kind:'node';flowId:string;nodeId:string};
 inputs:string[]; outputs:string[]; sourceRef?:string;
}
export interface WorkflowActivityIR {
 schemaVersion:'0.1-draft';
 source:{kind:'example';id:string}|{kind:'definition';definitionId:string;revision:string;digest:string};
 title:string; nodes:ActivityEntity[]; flows:ActivityFlow[]; relations:ActivityRelation[];
}
/** Referential checks on typed input; not a general parser for arbitrary external JSON. */
export function validateActivityIR(ir:WorkflowActivityIR):string[]{
 const errors:string[]=[];
 const unique=(ids:string[],at:string)=>{if(new Set(ids).size!==ids.length)errors.push(at+': duplicate id');};
 unique(ir.nodes.map(n=>n.id),'nodes');unique(ir.flows.map(f=>f.id),'flows');unique(ir.relations.map(r=>r.id),'relations');
 if(ir.flows[0]?.kind!=='main'||ir.flows.filter(f=>f.kind==='main').length!==1)errors.push('flows: main must be first and unique');
 const entities=new Map(ir.nodes.map(n=>[n.id,n])),flows=new Map(ir.flows.map(f=>[f.id,f]));
 const contains=(flowId:string,nodeId:string)=>flows.get(flowId)?.nodeIds.includes(nodeId);
 for(const f of ir.flows){
  unique(f.nodeIds,f.id+': nodes');unique(f.edges.map(e=>e.id),f.id+': edges');
  for(const id of f.nodeIds)if(!entities.has(id))errors.push(f.id+': missing node '+id);
  if(!f.nodeIds.includes(f.entryNodeId))errors.push(f.id+': invalid entry');
  if(!f.exitNodeIds.length||f.exitNodeIds.some(id=>!f.nodeIds.includes(id)))errors.push(f.id+': invalid exit');
  for(const e of f.edges)if(!f.nodeIds.includes(e.from)||!f.nodeIds.includes(e.to))errors.push(f.id+': invalid edge '+e.id);
 }
 for(const r of ir.relations){
  if(!contains(r.from.flowId,r.from.nodeId))errors.push(r.id+': invalid source');
  const target=flows.get(r.target.flowId);
  if(!target||target.kind!==(r.kind==='trigger'?'triggered':'subflow'))errors.push(r.id+': invalid target');
  if(!contains(r.target.flowId,r.target.entryNodeId)||target?.entryNodeId!==r.target.entryNodeId)errors.push(r.id+': invalid target entry');
  if(!target?.exitNodeIds.includes(r.target.exitNodeId))errors.push(r.id+': invalid target exit');
  if(r.kind==='trigger'&&!r.condition?.trim())errors.push(r.id+': missing condition');
  if(r.kind==='subflow'&&entities.get(r.from.nodeId)?.kind!=='group')errors.push(r.id+': subflow source must be a group');
  if(r.resume.kind==='node'&&!contains(r.resume.flowId,r.resume.nodeId))errors.push(r.id+': invalid resume target');
 }
 return errors;
}
