/** Build-time ELK adapter. Semantic IR stays coordinate-free; SVG consumes this output. */
import ELK from 'elkjs/lib/elk.bundled.js';
import type {ElkNode} from 'elkjs/lib/elk-api';
import type {WorkflowActivityIR, ActivityEntity} from './workflow-activity-ir';

export type ActivityDirection = 'RIGHT' | 'DOWN' | 'COMPACT';
type Point = {x:number;y:number};
export type ActivityLayout = {
 engine:'elk-layered';routing:'ORTHOGONAL';direction:ActivityDirection;width:number;height:number;
 bands?:{id:string;title:string;x:number;y:number;width:number;height:number}[];
 nodes:Record<string,Point & {width:number;height:number;icon:string}>;
 edges:Record<string,{path:string;points:Point[];label?:Point & {width:number;height:number;lines:string[]}}>;
};
const textWidth=(text:string,size:number)=>Array.from(text).reduce((sum,c)=>sum+(/[\u2e80-\uffef]/u.test(c)?1:.62)*size,0);
function wrap(text:string,maxWidth=160){
 const lines:string[]=[];let line='';
 for(const char of text){if(line&&textWidth(line+char,15)>maxWidth){lines.push(line.trim());line='';}line+=char;}
 if(line.trim())lines.push(line.trim());return lines;
}
function measure(node:ActivityEntity){
 if(node.kind==='final')return {width:28,height:28,icon:'circle-check'};
 if(node.kind==='decision')return {width:Math.max(230,textWidth(node.title,16)*2+32,textWidth(node.summary,12)*2+36),height:152,icon:'arrows-exchange'};
 return {width:Math.ceil(Math.max(node.model?260:180,textWidth(node.title,19)+40,textWidth(node.summary,14)+40,node.model?textWidth(node.model,16)+40:0)),height:node.model?104:84,icon:node.kind==='artifact'?'file':node.kind==='group'?'command':node.kind==='reopen'?'exclamation-circle':node.role==='Reviewer'?'shield-lock':'file'};
}
export async function layoutActivityFlow(ir:WorkflowActivityIR,flowId:string,direction:ActivityDirection):Promise<ActivityLayout>{
 if(direction==='COMPACT')return layoutCompactActivityFlow(ir,flowId);
 const flow=ir.flows.find(f=>f.id===flowId);if(!flow)throw new Error('Unknown activity flow: '+flowId);
 const measures=new Map(flow.nodeIds.map(id=>{
  const entity=ir.nodes.find(n=>n.id===id);if(!entity)throw new Error('Unknown activity: '+id);
  const body=measure(entity),final=entity.kind==='final';
  // Reserve the entire visual envelope, including badges and the final caption.
  const left=final?Math.max(20,(textWidth(entity.title,19)+16-body.width)/2):16,top=24;
  return [id,{...body,left,top,outerWidth:body.width+left*2,outerHeight:body.height+top+(final?40:16)}] as const;
 }));
 const children:ElkNode[]=flow.nodeIds.map(id=>{
  const m=measures.get(id)!;
  const ports=['in','out'].flatMap(side=>{
   const incident=flow.edges.filter(e=>side==='in'?e.to===id:e.from===id);
   return incident.map((edge,index)=>{
    const offset=incident.length===1?0:((index/(incident.length-1))-.5)*.6;
    return {id:edge.id+'-'+side,width:0,height:0,
     x:direction==='RIGHT'?(side==='in'?0:m.outerWidth):m.left+m.width*(.5+offset),
     y:direction==='RIGHT'?m.top+m.height*(.5+offset):(side==='in'?0:m.outerHeight),
     layoutOptions:{'elk.port.side':direction==='RIGHT'?(side==='in'?'WEST':'EAST'):(side==='in'?'NORTH':'SOUTH')}};
   });
  });
  return {id,width:m.outerWidth,height:m.outerHeight,layoutOptions:{'elk.portConstraints':'FIXED_POS'},ports};
 });
 const labelLines=new Map<string,string[]>();
 const graph:ElkNode={id:flowId,layoutOptions:{
  'elk.algorithm':'layered','elk.direction':direction,'elk.edgeRouting':'ORTHOGONAL','elk.randomSeed':'17',
  'elk.padding':'[top=36,left=36,bottom=36,right=36]',
  'elk.spacing.nodeNode':'48','elk.spacing.edgeNode':'24','elk.spacing.edgeEdge':'20',
  'elk.layered.spacing.nodeNodeBetweenLayers':'56','elk.layered.spacing.edgeNodeBetweenLayers':'24',
  'elk.layered.spacing.edgeEdgeBetweenLayers':'20','elk.layered.considerModelOrder.strategy':'NODES_AND_EDGES',
  'elk.layered.mergeEdges':'false','elk.layered.nodePlacement.strategy':'NETWORK_SIMPLEX',
 },children,edges:flow.edges.map(e=>{
  const show=e.kind==='material'||e.outcome!=='continue'||flow.edges.filter(other=>other.from===e.from&&other.kind==='control').length>1;
  const lines=show?wrap(e.title):[];labelLines.set(e.id,lines);
  return {id:e.id,sources:[e.id+'-out'],targets:[e.id+'-in'],layoutOptions:{'elk.layered.priority.straightness':e.kind==='control'&&e.outcome==='continue'?'100':'0','elk.layered.priority.direction':e.kind==='control'&&e.outcome==='continue'?'10':'1'},labels:show?[{id:e.id+'-label',text:lines.join('\n'),width:Math.ceil(Math.max(...lines.map(line=>textWidth(line,15))))+12,height:lines.length*22+8,layoutOptions:{'elk.edgeLabels.placement':'CENTER'}}]:[]};
 })};
 const result=await new ELK().layout(graph);
 const nodes:ActivityLayout['nodes']={};
 for(const n of result.children||[]){const m=measures.get(n.id)!;nodes[n.id]={x:n.x!+m.left+m.width/2,y:n.y!+m.top+m.height/2,width:m.width,height:m.height,icon:m.icon};}
 const edges:ActivityLayout['edges']={};
 for(const e of result.edges||[]){
  const semantic=flow.edges.find(edge=>edge.id===e.id)!,from=nodes[semantic.from],to=nodes[semantic.to];
  if(e.sections?.length!==1)throw new Error('Expected one ELK edge section: '+e.id);
  const s=e.sections[0];
  const boundary=(node:typeof from,id:string,port:Point,sign:number):Point=>{
   const diamond=ir.nodes.find(n=>n.id===id)!.kind==='decision';
   if(direction==='RIGHT')return {x:node.x+sign*node.width/2*(diamond?1-Math.abs(port.y-node.y)/(node.height/2):1),y:port.y};
   return {x:port.x,y:node.y+sign*node.height/2*(diamond?1-Math.abs(port.x-node.x)/(node.width/2):1)};
  };
  const first=boundary(from,semantic.from,s.startPoint,1),last=boundary(to,semantic.to,s.endPoint,-1);
  const points=[first,s.startPoint,...s.bendPoints||[],s.endPoint,last].map(p=>({x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100})).filter((p,i,all)=>!i||p.x!==all[i-1].x||p.y!==all[i-1].y);
  const l=e.labels?.[0];
  edges[e.id]={path:points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(''),points,...l?{label:{x:l.x!,y:l.y!,width:l.width!,height:l.height!,lines:labelLines.get(e.id)!}}:{}};
 }
 return {engine:'elk-layered',routing:'ORTHOGONAL',direction,width:result.width!,height:result.height!,nodes,edges};
}

/** Authored presentation groups; grouping never adds an executable activity. */
type Composition=string|{id:string;direction:'RIGHT'|'DOWN';title?:string;alignEdge?:string;children:Composition[]};
const compositions:Record<string,Composition>={
 main:{id:'main-layout',direction:'DOWN',children:[
  {id:'goal-loop',title:'逐 Goal 推进',direction:'RIGHT',children:['intake','select-goal','ladder',{id:'review-commit',direction:'DOWN',children:['review','commit']}]},
  {id:'finish',title:'全部 Goal 完成后',direction:'RIGHT',children:['whole-verify','finalize','done']},
 ]},
 ladder:{id:'ladder-layout',direction:'RIGHT',children:[
  {id:'test-preparation',direction:'DOWN',children:['calibrate','refine-handoff']},
  {id:'implementation-loop',direction:'DOWN',alignEdge:'rung-red',children:['implement','rung-result']},
  {id:'closing',direction:'DOWN',children:['coverage','refactor','verify-rung']},
  {id:'handoffs',direction:'DOWN',children:['review-handoff','recorded-return']},
 ]},
 research:{id:'research-layout',direction:'RIGHT',children:['request',{id:'scouting',direction:'DOWN',children:['scouter','research-note']},'return-source']},
 simple:{id:'simple-layout',direction:'RIGHT',children:['simple-input','simple-write','simple-review','simple-done']},
};
type Side='NORTH'|'SOUTH'|'EAST'|'WEST';
type ExportPort={side:Side;path:Point[]};
type Composed={id:string;width:number;height:number;nodes:ActivityLayout['nodes'];edges:ActivityLayout['edges'];ports:Record<string,ExportPort>;bands:NonNullable<ActivityLayout['bands']>};
async function layoutCompactActivityFlow(ir:WorkflowActivityIR,flowId:string):Promise<ActivityLayout>{
 const flow=ir.flows.find(f=>f.id===flowId),composition=compositions[flowId];
 if(!flow||!composition)throw new Error('Compact composition required for '+flowId);
 const entities=new Map(flow.nodeIds.map(id=>[id,ir.nodes.find(n=>n.id===id)!]));
 const special:Record<string,[Side,Side]>={
  'review-closed':['SOUTH','NORTH'],'next-goal':['SOUTH','SOUTH'],'all-goals':['SOUTH','NORTH'],
  'implementation-result':['SOUTH','NORTH'],'rung-red':['NORTH','SOUTH'],
  'oracle-ambiguity':['SOUTH','NORTH'],'rung-green':['EAST','WEST'],
  'coverage-ready':['SOUTH','NORTH'],'refactor-ready':['SOUTH','NORTH'],
  'coverage-red':['WEST','EAST'],'refactor-red':['WEST','EAST'],
  'next-rung':['SOUTH','SOUTH'],
  'research-output':['SOUTH','NORTH'],'research-handoff':['EAST','SOUTH'],'simple-revise':['SOUTH','SOUTH'],
 };
 const sides=(id:string):[Side,Side]=>special[id]||['EAST','WEST'];
 const collectAligned=(c:Composition):string[]=>typeof c==='string'?[]:[...(c.alignEdge?[c.alignEdge]:[]),...c.children.flatMap(collectAligned)];
 const alignedEdges=new Set(collectAligned(composition));
 const move=(p:Point,x:number,y:number):Point=>({x:p.x+x,y:p.y+y});
 const path=(points:Point[])=>points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('');
 function shiftedEdge(e:ActivityLayout['edges'][string],x:number,y:number){const points=e.points.map(p=>move(p,x,y));return {...e,points,path:path(points),...e.label?{label:{...e.label,x:e.label.x+x,y:e.label.y+y}}:{}};}
 async function compose(c:Composition):Promise<Composed>{
  if(typeof c==='string'){
   const n=entities.get(c);if(!n)throw new Error('Missing presentation entity: '+c);
   const m=measure(n),left=n.kind==='final'?Math.max(16,(textWidth(n.title,19)+16-m.width)/2):14,top=24;
   const width=m.width+2*left,height=m.height+top+(n.kind==='final'?40:14),cx=left+m.width/2,cy=top+m.height/2;
   const incidents=flow!.edges.flatMap(e=>[...(e.from===c?[{id:e.id+'-from',side:sides(e.id)[0]}]:[]),...(e.to===c?[{id:e.id+'-to',side:sides(e.id)[1]}]:[])]);
   const ports:Composed['ports']={};
   for(const p of incidents){
    const same=incidents.filter(i=>i.side===p.side),i=same.findIndex(s=>s.id===p.id),primary=same.find(s=>[...alignedEdges].some(id=>s.id===id+'-from'||s.id===id+'-to'));
    const others=same.filter(s=>s!==primary),otherIndex=others.findIndex(s=>s.id===p.id);
    const offset=primary?(p===primary||p.id===primary.id?0:others.length===1?-.25:(otherIndex/(others.length-1)-.5)*.5):same.length===1?0:(i/(same.length-1)-.5)*.5,diamond=n.kind==='decision';
    const horizontal=p.side==='EAST'||p.side==='WEST',sign=p.side==='EAST'||p.side==='SOUTH'?1:-1;
    const body=horizontal?{x:cx+sign*m.width/2*(diamond?1-Math.abs(offset)*2:1),y:cy+m.height*offset}:{x:cx+m.width*offset,y:cy+sign*m.height/2*(diamond?1-Math.abs(offset)*2:1)};
    const outer=horizontal?{x:sign>0?width:0,y:body.y}:{x:body.x,y:sign>0?height:0};ports[p.id]={side:p.side,path:[body,outer]};
   }
   return {id:c,width,height,nodes:{[c]:{x:cx,y:cy,width:m.width,height:m.height,icon:m.icon}},edges:{},ports,bands:[]};
  }
  const children=await Promise.all(c.children.map(compose));
  const locate=(id:string)=>children.findIndex(child=>!!child.nodes[id]);
  const alignment=c.alignEdge?flow!.edges.find(e=>e.id===c.alignEdge):undefined;
  const alignmentOffsets=children.map(child=>alignment?(child.nodes[alignment.from]?.x??child.nodes[alignment.to]?.x??0):0);
  const maxAnchor=Math.max(...alignmentOffsets);
  const localEdges=flow!.edges.filter(e=>locate(e.from)>=0&&locate(e.to)>=0&&locate(e.from)!==locate(e.to));
  const graph:ElkNode={id:c.id,layoutOptions:{
   'elk.algorithm':'layered','elk.direction':c.direction,'elk.edgeRouting':'ORTHOGONAL','elk.randomSeed':'17',
   'elk.partitioning.activate':'true','elk.layered.nodePlacement.strategy':alignment?'INTERACTIVE':'NETWORK_SIMPLEX',
   'elk.padding':c.title?'[top=36,left=16,bottom=16,right=16]':'[top=14,left=14,bottom=14,right=14]',
   'elk.spacing.nodeNode':'32','elk.spacing.edgeNode':'12','elk.spacing.edgeEdge':'12',
   'elk.layered.spacing.nodeNodeBetweenLayers':'28','elk.layered.spacing.edgeNodeBetweenLayers':'12','elk.layered.spacing.edgeEdgeBetweenLayers':'12',
   'elk.layered.compaction.postCompaction.strategy':alignment?'NONE':'LEFT_RIGHT_CONSTRAINT_LOCKING','elk.layered.mergeEdges':'false',
  },children:children.map((child,i)=>({id:child.id,width:child.width,height:child.height,...alignment?{x:maxAnchor-alignmentOffsets[i],y:children.slice(0,i).reduce((sum,ch)=>sum+ch.height+32,0)}:{},layoutOptions:{'elk.partitioning.partition':String(i),'elk.portConstraints':'FIXED_POS'},ports:Object.entries(child.ports).map(([id,p])=>({id,...p.path.at(-1)!,width:0,height:0,layoutOptions:{'elk.port.side':p.side}}))})),edges:localEdges.map(e=>{
   const show=e.kind==='material'||e.outcome!=='continue'||c.direction==='DOWN'||flow!.edges.filter(other=>other.from===e.from&&other.kind==='control').length>1;const lines=wrap(e.title,132);
   return {id:e.id,sources:[e.id+'-from'],targets:[e.id+'-to'],labels:show?[{id:e.id+'-label',text:lines.join('\n'),width:Math.ceil(Math.max(...lines.map(l=>textWidth(l,15))))+10,height:lines.length*22+8,layoutOptions:{'elk.edgeLabels.placement':alignedEdges.has(e.id)?'TAIL':'CENTER'}}]:[]};
  })};
  const solved=await new ELK().layout(graph),result:Composed={id:c.id,width:solved.width!,height:solved.height!,nodes:{},edges:{},ports:{},bands:[]};
  const childPorts:Composed['ports']={};
  for(const n of solved.children||[]){
   const child=children.find(ch=>ch.id===n.id)!,x=n.x!,y=n.y!;
   for(const [id,node] of Object.entries(child.nodes))result.nodes[id]={...node,x:node.x+x,y:node.y+y};
   for(const [id,e] of Object.entries(child.edges))result.edges[id]=shiftedEdge(e,x,y);
   for(const [id,p] of Object.entries(child.ports))childPorts[id]={side:p.side,path:p.path.map(pt=>move(pt,x,y))};
   for(const b of child.bands)result.bands.push({...b,x:b.x+x,y:b.y+y});
  }
  for(const e of solved.edges||[]){
   if(e.sections?.length!==1)throw new Error('Unexpected composed section count: '+e.id);
   const s=e.sections[0],route=[s.startPoint,...s.bendPoints||[],s.endPoint];
   const points=[...childPorts[e.id+'-from'].path,...route,...[...childPorts[e.id+'-to'].path].reverse()];
   const label=e.labels?.[0];result.edges[e.id]={points,path:path(points),...label?{label:{x:label.x!,y:label.y!,width:label.width!,height:label.height!,lines:label.text!.split('\n')}}:{}};
  }
  const consumed=new Set(localEdges.flatMap(e=>[e.id+'-from',e.id+'-to']));
  for(const [id,p] of Object.entries(childPorts))if(!consumed.has(id)){
   const last=p.path.at(-1)!,end=p.side==='EAST'?{x:result.width,y:last.y}:p.side==='WEST'?{x:0,y:last.y}:p.side==='SOUTH'?{x:last.x,y:result.height}:{x:last.x,y:0};
   result.ports[id]={side:p.side,path:[...p.path,end]};
  }
  if(c.title)result.bands.push({id:c.id,title:c.title,x:0,y:0,width:result.width,height:result.height});
  return result;
 }
 const result=await compose(composition);
 // A declared aligned connection can use a straight segment if the final scene
 // proves it unobstructed. Otherwise preserve ELK's route; never invent a detour.
 for(const alignedEdge of alignedEdges){
  const edge=result.edges[alignedEdge],semantic=flow.edges.find(e=>e.id===alignedEdge)!;
  const first=edge.points[0],last=edge.points.at(-1)!;
  const boxes=[...Object.entries(result.nodes).filter(([id])=>id!==semantic.from&&id!==semantic.to).map(([,n])=>({x:n.x-n.width/2-2,y:n.y-n.height/2-2,width:n.width+4,height:n.height+4})),...Object.values(result.edges).flatMap(e=>e.label?[e.label]:[])];
  const clear=Math.abs(first.x-last.x)<.1&&boxes.every(b=>first.x<=b.x||first.x>=b.x+b.width||Math.max(first.y,last.y)<=b.y||Math.min(first.y,last.y)>=b.y+b.height);
  if(clear){edge.points=[first,last];edge.path=path(edge.points);}
 }

 if(Object.keys(result.nodes).length!==flow.nodeIds.length||Object.keys(result.edges).length!==flow.edges.length)throw new Error('Composition must preserve all nodes and relationships');
 return {engine:'elk-layered',routing:'ORTHOGONAL',direction:'COMPACT',width:result.width,height:result.height,nodes:result.nodes,edges:result.edges,bands:result.bands};
}
