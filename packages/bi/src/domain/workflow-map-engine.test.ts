import {it as test} from 'vitest';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {parseWorkflowMap,projectWorkflowMap,type WorkflowMapIR} from './workflow-map-ir';
import researchFixture from './workflow-map-research.json';
import {layoutWorkflowMap} from './workflow-map-engine';
for(const name of ['development','architecture','research'])for(const mode of ['collapsed','expanded'])test(name+' '+mode+' uses semantic IR only',async()=>{const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+name+'.json',import.meta.url),'utf8')) as WorkflowMapIR;const parsed=parseWorkflowMap(ir);assert.equal(parsed.ok,true);assert.deepEqual(parsed.issues.filter(i=>i.severity==='blocking'),[]);const before=JSON.stringify(ir);const expanded=new Set(mode==='expanded'?ir.nodes.filter(n=>n.kind==='group').map(n=>n.id):[]),projection=projectWorkflowMap(ir,expanded),layout=await layoutWorkflowMap(ir,expanded);assert.deepEqual(layout.nodes.map(n=>n.id).sort(),projection.nodes.map(n=>n.id).sort());assert.deepEqual(layout.edges.map(e=>e.id).sort(),projection.edges.map(e=>e.id).sort());assert.equal(JSON.stringify(ir),before);assert.ok(layout.width>0&&layout.height>0);for(const a of layout.nodes.filter(n=>!n.expanded))for(const b of layout.nodes.filter(n=>!n.expanded&&n.id>a.id))assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'nodes overlap '+a.id+' '+b.id);});
test('nested edge coordinates terminate on their actual activities',async()=>{
 const ir=researchFixture as WorkflowMapIR;
 const layout=await layoutWorkflowMap(ir,new Set(ir.nodes.filter(n=>n.kind==='group').map(n=>n.id)));
 for(const edge of layout.edges){const semantic=ir.edges.find(e=>e.id===edge.id)!;const points=[...edge.path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
 for(const [id,p] of [[semantic.from,points[0]],[semantic.to,points.at(-1)!]] as const){const n=layout.nodes.find(n=>n.id===id)!;assert.ok(p.x>=n.x-.01&&p.x<=n.x+n.width+.01&&p.y>=n.y-.01&&p.y<=n.y+n.height+.01,'edge detached from '+id+': '+edge.id);}}
});
test('renamed nested IDs are accepted without presentation tables',async()=>{
 const ir=structuredClone(researchFixture) as WorkflowMapIR;const id=(s:string)=>'arbitrary-'+s;
 for(const n of ir.nodes){n.id=id(n.id);if(n.parent)n.parent=id(n.parent);}for(const e of ir.edges){e.id=id(e.id);e.from=id(e.from);e.to=id(e.to);}
 const parsed=parseWorkflowMap(ir);assert.equal(parsed.ok,true);const result=await layoutWorkflowMap(ir,new Set(ir.nodes.filter(n=>n.kind==='group').map(n=>n.id)),'DOWN');assert.equal(result.nodes.length,ir.nodes.length);assert.equal(result.edges.length,ir.edges.length);
});
for(const name of ['development','architecture','research'])for(const direction of ['RIGHT','DOWN'] as const)test(name+' '+direction+' routes attach to diamond outlines and leave space before arrows',async()=>{
 const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+name+'.json',import.meta.url),'utf8')) as WorkflowMapIR;const layout=await layoutWorkflowMap(ir,new Set(ir.nodes.filter(n=>n.kind==='group').map(n=>n.id)),direction);
 for(const edge of layout.edges){const semantic=ir.edges.find(e=>e.id===edge.id)!;const p=[...edge.path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>({x:+m[1],y:+m[2]}));
 for(let i=1;i<p.length;i++)assert.ok(p[i].x===p[i-1].x||p[i].y===p[i-1].y,'non-orthogonal route '+edge.id+' '+JSON.stringify(p));
 const end=p.at(-1)!,before=p.at(-2)!;assert.ok(Math.hypot(end.x-before.x,end.y-before.y)>=24,'arrow lead too short '+edge.id);
 for(const [id,point] of [[semantic.from,p[0]],[semantic.to,end]] as const){if(ir.nodes.find(n=>n.id===id)!.kind!=='decision')continue;const n=layout.nodes.find(n=>n.id===id)!;const onOutline=Math.abs(point.x-n.x-n.width/2)/(n.width/2)+Math.abs(point.y-n.y-n.height/2)/(n.height/2);assert.ok(Math.abs(onOutline-1)<.001,'diamond endpoint outside actual outline '+edge.id);}
 }
});
test('development overview keeps phase control while implementation decisions remain nested',()=>{
 const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+'development.json',import.meta.url),'utf8')) as WorkflowMapIR;
 const overview=projectWorkflowMap(ir,new Set());assert.ok(!overview.nodes.some(n=>['next','pass','stable','clear','pack','fix'].includes(n.id)));
 assert.deepEqual(overview.nodes.filter(n=>n.kind==='decision').map(n=>n.id),['ready']);
 assert.ok(overview.edges.some(e=>e.from==='work'&&e.to==='delivery'&&e.label==='实现完成'));
 for(const id of ['plan','work','aborted'])assert.ok(overview.edges.some(e=>e.from==='ready'&&e.to===id));
 assert.ok(projectWorkflowMap(ir,new Set(['work'])).nodes.some(n=>n.id==='next'&&n.parent==='work'));
});
for(const direction of ['RIGHT','DOWN'] as const)test(direction+' independent branches use distinct silhouette ports',async()=>{
 const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+'development.json',import.meta.url),'utf8')) as WorkflowMapIR;
 for(const expanded of [new Set<string>(),new Set(ir.nodes.filter(n=>n.kind==='group').map(n=>n.id))]){
 const projection=projectWorkflowMap(ir,expanded),layout=await layoutWorkflowMap(ir,expanded,direction);
 for(const node of projection.nodes.filter(n=>!n.expanded))for(const endpoint of ['from','to'] as const){
 const incident=projection.edges.filter(e=>e[endpoint]===node.id);if(incident.length<2)continue;
 const points=incident.map(e=>{const route=layout.edges.find(r=>r.id===e.id)!;const p=[...route.path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)];const point=endpoint==='from'?p[0]:p.at(-1)!;return point[1]+','+point[2];});
 assert.equal(new Set(points).size,incident.length,'shared '+endpoint+' port on '+node.id);
 }
 }
});
for(const direction of ['RIGHT','DOWN'] as const)test(direction+' return routes use transverse connections',async()=>{
 const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+'development.json',import.meta.url),'utf8')) as WorkflowMapIR;
 const layout=await layoutWorkflowMap(ir,new Set(),direction),projection=projectWorkflowMap(ir,new Set());
 const returns=projection.edges.filter(e=>e.from==='ready'&&['plan','work'].includes(e.to));assert.equal(returns.length,2);
 for(const edge of returns){const route=layout.edges.find(e=>e.id===edge.id)!;const p=[...route.path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>({x:+m[1],y:+m[2]}));
 assert.ok(direction==='RIGHT'?p[0].x===p[1].x:p[0].y===p[1].y,'return must leave across layout direction');
 const a=p.at(-2)!,b=p.at(-1)!;assert.ok(direction==='RIGHT'?a.x===b.x:a.y===b.y,'return must enter across layout direction');
 }
});
test('overview adapts spacing to the viewport without shrinking node geometry',async()=>{
 const ir=JSON.parse(readFileSync(new URL('./workflow-map-'+'development.json',import.meta.url),'utf8')) as WorkflowMapIR;
 const narrow=await layoutWorkflowMap(ir,new Set(),'RIGHT',{width:1100,height:800}),wide=await layoutWorkflowMap(ir,new Set(),'RIGHT',{width:2000,height:800});
 assert.ok(narrow.width<wide.width,'spacing must adapt to available width');
 assert.ok(narrow.width<1600,'overview must not waste width on oversized gaps');
 assert.deepEqual(narrow.nodes.map(n=>[n.id,n.width,n.height]),wide.nodes.map(n=>[n.id,n.width,n.height]));
});
