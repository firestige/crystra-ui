import {useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent} from 'react';
import {Button,ButtonGroup,Chip,IconButton,Typography} from './design-system';
import {SelectField} from './state-components';
import {Tabs} from './collection-components';
import {ChecksPanel,ResourcesPanel,RehearsalPanel} from './workflow-projection-panels';
import {resources,resourceBindings,inspectBindings,startRehearsal,advanceRehearsal,rehearsalChoices,type Rehearsal} from '../domain/workflow-projection-tools';
import {Icon,type IconName} from './icon';
import complexExample from '../domain/workflow-activity-ir.example.json';
import simpleExample from '../domain/workflow-activity-ir.simple.json';
import fixtureLayouts from '../domain/workflow-activity-layouts.json';
import {validateActivityIR,type WorkflowActivityIR,type ActivityRelation} from '../domain/workflow-activity-ir';

const complexIR=complexExample as WorkflowActivityIR,simpleIR=simpleExample as WorkflowActivityIR;
for(const ir of [complexIR,simpleIR]){const errors=validateActivityIR(ir);if(errors.length)throw new Error(errors.join('; '));}
import type {ActivityLayout,ActivityDirection} from '../domain/workflow-activity-layout';
const layouts=fixtureLayouts as Record<ActivityDirection,Record<string,ActivityLayout>>;
type Selection={kind:'node'|'edge';id:string};
type ViewMemory={selection:Selection;zoom:number;left:number;top:number};
const badgeInfo={subflow:{icon:'git-branch' as IconName,label:'阶段展开'},trigger:{icon:'arrow-up-right' as IconName,label:'可触发流程'}};
const tones={continue:'neutral',rework:'return',success:'success',stop:'danger'};
export function WorkflowActivityStudy({mode='design',onDesign}:{mode?:'design'|'crystallization';onDesign?:()=>void}={}){
 const analyzing=mode==='crystallization';
 const [sampleScope,setSampleScope]=useState('all');
 const [candidate,setCandidate]=useState(false);
 const [simple,setSimple]=useState(false);
 const [scene,setScene]=useState('main');
 const [direction,setDirection]=useState<ActivityDirection>('COMPACT');
 const [selection,setSelection]=useState<Selection>({kind:'node',id:''});
 const [zoom,setZoom]=useState(0);
 const [drawer,setDrawer]=useState<'detail'|'help'|'issues'|'resources'|null>(null);
 const [fault,setFault]=useState(false);
 const [resourceId,setResourceId]=useState<string|null>(null);
 const [resourceNode,setResourceNode]=useState<string|undefined>();
 const [rehearsal,setRehearsal]=useState<Rehearsal|null>(null);
 const [playing,setPlaying]=useState(false);
 const [quoteStatus,setQuoteStatus]=useState('');
 const catalog=fault?resources.filter(r=>r.kind!=='skill'):resources;
 const issues=inspectBindings(complexIR,catalog,resourceBindings);
 const visit=rehearsal?.visits[rehearsal.cursor];
 const rehearsalHere=!!rehearsal&&rehearsal.flowId===scene;
 const activeEdge=rehearsalHere?visit?.edgeId:undefined;
 const [bounds,setBounds]=useState({width:1080,height:660});
 const views=useRef<Record<string,ViewMemory>>({});
 const viewport=useRef<HTMLDivElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const lastFocus=useRef<Element|null>(null);
 const pendingPosition=useRef<{left:number;top:number;focus?:string}|null>(null);
 const ir=simple?simpleIR:complexIR;
 const flow=ir.flows.find(f=>f.id===scene)!;
 const layout=layouts[direction][scene];
 const nodes=flow.nodeIds.map(id=>{const n=ir.nodes.find(n=>n.id===id)!;return {...n,label:n.title,subtitle:n.summary,copy:n.description,...layout.nodes[id]};});
 const edges=flow.edges.map(e=>({...e,copy:e.description,tone:e.kind==='material'?'material':tones[e.outcome],...layout.edges[e.id],label:e.title,labelBox:layout.edges[e.id].label}));
 const selectedNode=selection.kind==='node'?nodes.find(n=>n.id===selection.id):undefined;
 const selectedEdge=selection.kind==='edge'?edges.find(e=>e.id===selection.id):undefined;
 const incoming=ir.relations.filter(r=>r.target.flowId===scene);
 const outgoing=ir.relations.filter(r=>r.from.flowId===scene);
 const selectedRelations=outgoing.filter(r=>r.from.nodeId===selectedNode?.id);
 const fitScale=Math.min(1,bounds.width/layout.width,bounds.height/layout.height);
 const scale=zoom===0?fitScale:zoom;
 const svgWidth=layout.width*scale,svgHeight=layout.height*scale;
 useLayoutEffect(()=>{
  const el=viewport.current;if(!el)return;
  const observer=new ResizeObserver(()=>setBounds({width:el.clientWidth,height:el.clientHeight}));
  observer.observe(el);return()=>observer.disconnect();
 },[scene]);
 useLayoutEffect(()=>{
  if(pendingPosition.current&&viewport.current){
   const pos=pendingPosition.current;viewport.current.scrollTo({left:pos.left,top:pos.top,behavior:'auto'});
   if(pos.focus){const target=viewport.current.querySelector<SVGGElement>('[data-activity-node="'+pos.focus+'"]');if(target){target.focus({preventScroll:true});const rect=target.getBoundingClientRect(),frame=viewport.current.getBoundingClientRect();viewport.current.scrollLeft+=rect.left-frame.left-(frame.width-rect.width)/2;viewport.current.scrollTop+=rect.top-frame.top-(frame.height-rect.height)/2;}}
   pendingPosition.current=null;
  }
 },[scene,direction,zoom,selection.id,bounds.width,bounds.height]);
 useEffect(()=>{if(drawer)closeButton.current?.focus({preventScroll:true});},[drawer]);
 const close=()=>{setDrawer(null);if(lastFocus.current instanceof HTMLElement||lastFocus.current instanceof SVGElement)lastFocus.current.focus({preventScroll:true});};
 const openDrawer=(type:'detail'|'help'|'issues'|'resources')=>{lastFocus.current=document.activeElement;setDrawer(type);};
 const select=(kind:'node'|'edge',id:string)=>{setSelection({kind,id});openDrawer('detail');};
 const keyboard=(event:KeyboardEvent,kind:'node'|'edge',id:string)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(kind,id);}};
 const fit=()=>{setZoom(0);viewport.current?.scrollTo({top:0,left:0,behavior:'auto'});};
 const switchTab=(target:string,focus?:string)=>{
  if(target===scene&&!focus)return;
  setPlaying(false);
  const el=viewport.current;
  views.current[direction+scene]={selection,zoom,left:el?.scrollLeft||0,top:el?.scrollTop||0};
  const saved=views.current[direction+target]||{selection:{kind:'node' as const,id:''},zoom:direction==='COMPACT'?0:1,left:0,top:0};
  pendingPosition.current={left:saved.left,top:saved.top,focus};
  setScene(target);setZoom(saved.zoom);setSelection(focus?{kind:'node',id:focus}:saved.selection);setDrawer(null);
 };
 const changeDirection=(next:ActivityDirection)=>{if(next===direction)return;const el=viewport.current;views.current[direction+scene]={selection,zoom,left:el?.scrollLeft||0,top:el?.scrollTop||0};const saved=views.current[next+scene];pendingPosition.current={left:saved?.left||0,top:saved?.top||0};setDirection(next);setZoom(saved?.zoom??(next==='COMPACT'?0:1));setDrawer(null);};
 const follow=(r:ActivityRelation)=>switchTab(r.target.flowId,r.target.entryNodeId);
 const quote=(text:string)=>{
  const input=document.querySelector<HTMLTextAreaElement>('[data-host-owned="dsh-input"] textarea');
  if(!input){setQuoteStatus('当前输入区不可用');return;}
  input.value+=(input.value?'\n\n':'')+text;
  input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
  setQuoteStatus('已加入输入框，尚未发送');
 };
 const openResources=()=>{setResourceNode(selectedNode?.id);setResourceId(null);openDrawer('resources');};
 const start=()=>{setSimple(false);switchTab('ladder');setRehearsal(startRehearsal());setSelection({kind:'node',id:'calibrate'});setPlaying(false);setZoom(0);};
 const step=(edgeId:string)=>{
  if(!rehearsal)return;
  const next=advanceRehearsal(complexIR,rehearsal,edgeId);
  setRehearsal(next);setSelection({kind:'node',id:next.visits[next.cursor].nodeId});
  if(rehearsalChoices(complexIR,next).length!==1)setPlaying(false);
 };
 useEffect(()=>{
  if(!playing||!rehearsal||scene!==rehearsal.flowId)return;
  const choices=rehearsalChoices(complexIR,rehearsal);
  if(choices.length!==1)return;
  const timer=window.setTimeout(()=>{
   const next=advanceRehearsal(complexIR,rehearsal,choices[0].id);
   setRehearsal(next);setSelection({kind:'node',id:next.visits[next.cursor].nodeId});
   if(rehearsalChoices(complexIR,next).length!==1)setPlaying(false);
  },1200);
  return()=>window.clearTimeout(timer);
 },[playing,rehearsal,scene]);
 useEffect(()=>{if(!quoteStatus)return;const timer=window.setTimeout(()=>setQuoteStatus(''),3500);return()=>window.clearTimeout(timer);},[quoteStatus]);
 const locateResource=(id:string)=>{switchTab('ladder',id);setDrawer('resources');};
 const locateIssue=(id:string)=>{setSimple(false);switchTab('ladder',id);setZoom(0);setDrawer('issues');};
 const badge=(r:ActivityRelation)=>{
  const n=nodes.find(n=>n.id===r.from.nodeId)!;
  const siblings=outgoing.filter(link=>link.from.nodeId===n.id);
  const index=siblings.findIndex(link=>link.id===r.id);
  const halfWidth=n.width/2,halfHeight=n.height/2;
  const info=badgeInfo[r.kind],target=ir.flows.find(f=>f.id===r.target.flowId)!;
  const title=n.title+'：'+info.label+' · '+target.title+(r.condition?'（'+r.condition+'）':'');
  return <foreignObject key={r.id} x={n.x+halfWidth-siblings.length*36+12+index*36} y={n.y-halfHeight-18} width="36" height="36"><button className={'activity-node-badge badge-'+r.kind} data-node-badge={r.id} data-node-id={n.id} aria-label={title} title={title} onClick={()=>follow(r)}><Icon name={info.icon}/></button></foreignObject>;
 };
 const canvas=<div className="activity-tab-content">
   <div className="activity-flow-summary"><div><Typography variant="item-title">{flow.kind==='main'?ir.title:flow.title}</Typography><Typography variant="meta" tone="muted">{flow.kind==='main'?'主流程':flow.kind==='subflow'?'阶段展开':'可触发流程'}</Typography></div>
    <div data-flow-associations className="activity-flow-associations">{incoming.length>0&&<Typography variant="meta" tone="muted">{flow.kind==='subflow'?'所属活动':'可由以下活动触发'}：</Typography>}{incoming.map(r=><Button key={r.id} size="compact" appearance="ghost" aria-label={'定位来源：'+ir.nodes.find(n=>n.id===r.from.nodeId)?.title} onClick={()=>switchTab(r.from.flowId,r.from.nodeId)}>{incoming.filter(link=>ir.nodes.find(n=>n.id===link.from.nodeId)?.title===ir.nodes.find(n=>n.id===r.from.nodeId)?.title).length>1?ir.flows.find(f=>f.id===r.from.flowId)?.title+' · ':''}{ir.nodes.find(n=>n.id===r.from.nodeId)?.title}</Button>)}</div>
   </div>
   <div className="activity-canvas-stack">
    <div ref={viewport} className="activity-viewport" data-activity-canvas data-scene={scene} data-direction={direction} data-layout-engine="elk-layered" data-zoom={scale}>
     <div className="activity-svg-stage" style={{width:Math.max(bounds.width,svgWidth),height:Math.max(bounds.height,svgHeight)}}>
      <svg className="activity-svg" viewBox={'0 0 '+layout.width+' '+layout.height} style={{width:svgWidth,height:svgHeight}} role="group" aria-label={flow.title+'活动图'}>
     <defs>{['neutral','return','success','danger','material'].map(tone=><marker key={tone} id={'activity-arrow-'+tone} className={'activity-arrow tone-'+tone} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker>)}</defs>
     {layout.bands?.map(b=><g key={b.id} className="activity-composition-band" aria-label={b.title}><text x={b.x+16} y={b.y+23}>{b.title}</text></g>)}
     {edges.map(edge=><g key={edge.id} className={'activity-edge tone-'+edge.tone} data-rehearsal-active={activeEdge===edge.id} data-activity-edge={edge.id} data-from={edge.from} data-to={edge.to} data-selected={selection.kind==='edge'&&selection.id===edge.id} role="button" tabIndex={0} aria-label={'分支：'+edge.label} aria-pressed={selection.kind==='edge'&&selection.id===edge.id} onClick={()=>select('edge',edge.id)} onKeyDown={e=>keyboard(e,'edge',edge.id)}>
      <title>{edge.label}</title><path className="activity-edge-hit" d={edge.path}/><path className="activity-edge-line" d={edge.path} markerEnd={'url(#activity-arrow-'+edge.tone+')'}/>{edge.labelBox&&<text className="activity-edge-label" textAnchor="middle">{edge.labelBox.lines.map((line,i)=><tspan key={i} x={edge.labelBox!.x+edge.labelBox!.width/2} y={edge.labelBox!.y+19+i*22}>{line}</tspan>)}</text>}
     </g>)}
     {nodes.map(node=><g key={node.id} data-rehearsal-active={rehearsalHere&&visit?.nodeId===node.id} data-activity-node={node.id} className={'activity-node kind-'+node.kind} transform={'translate('+node.x+' '+node.y+')'} data-selected={selection.kind==='node'&&selection.id===node.id} role="button" tabIndex={0} aria-label={node.kind==='decision'?'路由：'+node.label:node.role?node.role+'：'+node.label:node.label} aria-pressed={selection.kind==='node'&&selection.id===node.id} onClick={()=>select('node',node.id)} onKeyDown={e=>keyboard(e,'node',node.id)}>
      <title>{node.copy}</title>
      {node.id===flow.entryNodeId&&<g className="activity-entry-marker" data-flow-entry={node.id}><circle cx={-node.width/2+8} cy={-node.height/2-13} r="5"/><text x={-node.width/2+20} y={-node.height/2-9}>{flow.kind==='main'?'起点':'流程入口'}</text></g>}
      {node.kind==='decision'?<path className="activity-node-shape" d={'M0 '+(-node.height/2)+'L'+node.width/2+' 0L0 '+node.height/2+'L'+(-node.width/2)+' 0Z'}/>:node.kind==='final'?<><circle className="activity-node-shape" r="14"/><circle className="activity-final-core" r="8"/></>:<rect className="activity-node-shape" x={-node.width/2} y={-node.height/2} width={node.width} height={node.height} rx={node.kind==='boundary'?node.height/2:12}/>}
      {analyzing&&node.id==='calibrate'&&<text x="0" y={-node.height/2-10} textAnchor="middle" className="studio-candidate-marker">结晶候选 · script</text>}{node.kind==='final'?<text className="activity-node-label" textAnchor="middle" y="37">{node.label}</text>:<><text className="activity-node-caption" textAnchor="middle" y={node.model?-25:-9}>{node.subtitle}</text><text className="activity-node-label" textAnchor="middle" y={node.model?1:node.kind==='decision'?12:17}>{node.label}</text>{node.model&&<text className="activity-node-model" textAnchor="middle" y="29">{node.model}</text>}</>}
     </g>)}


      {outgoing.map(badge)}
      {!simple&&issues.filter(issue=>issue.flowId===scene||(scene==='main'&&issue.flowId==='ladder')).map(issue=>{
       const node=nodes.find(n=>n.id===(scene==='main'?'ladder':issue.nodeId));if(!node)return null;
       return <foreignObject key={issue.id} x={node.x-node.width/2-14} y={node.y-node.height/2-16} width="32" height="32"><button className="projection-issue-badge" aria-label="定位缺失资源关注项" onClick={()=>locateIssue(issue.nodeId)}><Icon name="exclamation-mark"/></button></foreignObject>;
      })}
      {activeEdge&&layout.edges[activeEdge]&&<circle key={scene+'-'+rehearsal?.cursor+'-'+activeEdge} className="projection-flow-packet" r="6" aria-label="推演数据沿关系传递"><animateMotion dur="1s" path={layout.edges[activeEdge].path} fill="freeze"/></circle>}

      </svg>
     </div>
    </div>
    <div className="activity-viewport-tools"><ButtonGroup aria-label="活动图视口"><IconButton aria-label="缩小活动图" size="compact" disabled={scale<=.25} onClick={()=>setZoom(Math.max(.25,scale-.25))}><Icon name="minus"/></IconButton><button className="activity-zoom-label" title="100%" aria-label="100%" onClick={()=>setZoom(1)}>{Math.round(scale*100)}%</button><IconButton aria-label="放大活动图" size="compact" disabled={scale>=2} onClick={()=>setZoom(Math.min(2,scale+.25))}><Icon name="plus"/></IconButton><Button size="compact" appearance="ghost" onClick={fit}>适应视图</Button></ButtonGroup></div>
    {drawer&&<aside className="activity-detail-drawer" aria-label={drawer==='help'?'活动图帮助':drawer==='issues'?'静态关注':drawer==='resources'?'绑定资源':'节点详情'} data-section-id={drawer==='detail'?'workflow-inspector':'workflow-graph-help'}>
     <div className="activity-drawer-header"><Typography variant="section-title">{drawer==='help'?'阅读活动图':drawer==='issues'?'静态关注':drawer==='resources'?'绑定资源':selectedEdge?'关系详情':'节点详情'}</Typography><IconButton ref={closeButton} size="compact" aria-label="关闭详情" onClick={close}><Icon name="x"/></IconButton></div>
     {drawer==='issues'?<ChecksPanel issues={issues} fault={fault} onFault={()=>setFault(!fault)} onLocate={locateIssue} onQuote={quote}/>:drawer==='resources'?<ResourcesPanel key={(resourceId||'list')+'-'+(resourceNode||'all')} catalog={catalog} nodeId={resourceNode} resourceId={resourceId} onResource={setResourceId} onLocate={locateResource} onAll={()=>setResourceNode(undefined)} onQuote={quote}/>:drawer==='help'?<div className="activity-drawer-body"><Typography as="p" variant="description">第一页始终是主流程，后续 Tab 展开阶段或可触发流程。Tab 切换保留各自的缩放、滚动位置与选择。</Typography><Typography as="p" variant="description" tone="secondary">节点右上蓝色分支角标表示可展开阶段，琥珀色跳转角标表示满足条件可进入另一流程。点击角标切换到对应 Tab；没有关系就不显示角标。</Typography><Typography as="p" variant="description" tone="secondary">实线箭头是控制流，虚线箭头是材料交接。菱形表达判断，双圆表示终点。图中颜色说明设计路径，不表示本次运行状态。Implementation 的阶段 Tab 是视图分解，不是嵌套 Workflow；活动返回结果，由 Runtime 按已声明路径推进。跨图出口标明返回阶段，不代表流程完成。</Typography></div>:<div className="activity-drawer-body">
      <Icon name={(selectedNode?.icon||'arrows-exchange') as IconName} size="context-marker"/>
      <Typography as="h3" variant="section-title">{selectedNode?.label||selectedEdge?.label}</Typography>
      <Chip>{selectedEdge?'控制流 / 材料关系':selectedNode?.kind==='boundary'?'跨图出口':selectedNode?.kind==='artifact'?'材料':selectedNode?.kind==='decision'?'分支判断':selectedNode?.kind==='group'?'活动组':'活动'}</Chip>
      <Typography as="p" variant="description" tone="secondary">{selectedNode?.copy||selectedEdge?.copy}</Typography>
      <div className="activity-inspector-meta"><span>所在 Tab</span><span>{flow.title}</span></div>
      <div className="activity-inspector-meta">{selectedNode?<><span>输出</span><span>{selectedNode.output}</span></>:<><span>目标活动</span><span>{nodes.find(n=>n.id===selectedEdge?.to)?.label}</span></>}</div>
      {selectedNode?.sourceRef&&<div className="activity-inspector-meta"><span>定义依据</span><span>{selectedNode.sourceRef}</span></div>}
      {selectedNode?.role&&<div className="activity-inspector-meta"><span>负责角色</span><span>{selectedNode.role}</span></div>}
      {selectedNode?.model&&<div className="activity-inspector-meta"><span>模型绑定</span><span>{selectedNode.model}</span></div>}
      {analyzing&&<section className="studio-evidence" aria-label="节点结晶分析">
       <Chip>演示证据 · {sampleScope==='all'?'3 个 Delivery':'1 个 Delivery'}</Chip>
       {selectedNode?.id==='calibrate'?<>
        <Typography variant="item-title">候选：测试结果整理 → script</Typography>
        <Typography as="p" variant="description">所选样本中，读取测试报告、提取失败项与整理字段的步骤重复；测试策略与失败原因判断仍由 LLM 负责。</Typography>
        <Typography variant="label">执行样本</Typography>
        {(sampleScope==='all'?['demo-delivery-01','demo-delivery-02','demo-delivery-03']:[sampleScope]).map(id=><div className="activity-inspector-meta" key={id}><span>{id}</span><span>测试报告 → 失败项摘要</span></div>)}
        <Typography variant="label">候选输出</Typography><pre className="studio-candidate-code">{JSON.stringify({script:'summarize_test_report',input:'test-report.json',output:['failedTests','exitCode','duration']},null,2)}</pre>
        <Typography as="p" variant="description" tone="secondary">边界：报告 schema 必须已知；格式未知、缺失字段或读取失败时返回 LLM 处理。候选尚未验证，不推断生产收益。</Typography>
        <Button appearance="ghost" onClick={()=>{quote('请基于所选演示证据，为「校准测试」中的测试报告整理生成 script 候选。保留测试策略与失败原因判断由 LLM 负责，明确 schema 与异常回退；先展示配置差异，不应用。');setCandidate(true);onDesign?.();}}>带回流程设计</Button>
       </>:<Typography as="p" variant="description" tone="secondary">此节点尚无结晶候选。可将节点及样本范围带入 Chat，继续检查输入、输出和判断边界。</Typography>}
      </section>}
      {(selectedNode||selectedEdge)&&<Button size="compact" appearance="ghost" onClick={()=>quote((analyzing?'请研究结晶可能性：':'请调整工作流配置：')+(selectedNode?.label||selectedEdge?.label)+'；工作流 Implementation，流程 '+flow.title+'，对象 '+selection.id+(analyzing?'；演示样本 '+sampleScope:'；请先展示候选差异，不应用。'))}>{analyzing?'在 Chat 中研究':'在 Chat 中调整'}</Button>}
      {selectedNode&&<Button size="compact" appearance="outline" startIcon={<Icon name="file"/>} onClick={openResources}>查看关联资源</Button>}
      {selectedRelations.map(r=><div className="activity-relation-detail" key={r.id}><Button size="compact" appearance="outline" startIcon={<Icon name={badgeInfo[r.kind].icon}/>} onClick={()=>follow(r)}>{ir.flows.find(f=>f.id===r.target.flowId)?.title}</Button><Typography variant="description" tone="secondary">{r.condition||'此阶段的视图展开'}</Typography><Typography variant="meta" tone="muted">输出：{r.outputs.join('、')} · {r.resume.kind==='origin'?'完成后交回发起活动':'继续到「'+ir.nodes.find(n=>n.id===(r.resume.kind==='node'?r.resume.nodeId:''))?.title+'」'}</Typography></div>)}
     </div>}
    </aside>}
   </div>
  </div>;
 return <div className="activity-study activity-window-study" onKeyDown={e=>{if(e.key==='Escape'&&drawer){e.stopPropagation();close();}}}>
  <div className="activity-demo-bar"><div><Typography variant="meta" tone="muted">{analyzing?'执行证据投影':'当前流程'}</Typography></div><ButtonGroup aria-label="布局方向"><Button size="compact" appearance="segment" selected={direction==='COMPACT'} onClick={()=>changeDirection('COMPACT')}>紧凑布局</Button><Button size="compact" appearance="segment" selected={direction==='RIGHT'} onClick={()=>changeDirection('RIGHT')}>横向布局</Button><Button size="compact" appearance="segment" selected={direction==='DOWN'} onClick={()=>changeDirection('DOWN')}>纵向布局</Button></ButtonGroup></div>
  {analyzing&&<div className="projection-tool-strip" aria-label="结晶分析数据范围"><SelectField label="执行样本" value={sampleScope} onChange={e=>setSampleScope(e.target.value)} options={[{value:'all',label:'全部演示 Delivery · 3 个'},...['demo-delivery-01','demo-delivery-02','demo-delivery-03'].map(value=>({value,label:value}))]}/><Button appearance="ghost" onClick={()=>{switchTab('ladder','calibrate');setSelection({kind:'node',id:'calibrate'});openDrawer('detail');}}>定位结晶候选 · 校准测试</Button><Chip>演示数据</Chip></div>}
  {!analyzing&&candidate&&<div className="projection-tool-strip" aria-label="结晶候选状态"><Typography variant="description">测试报告整理 → script · 待 Chat 生成配置差异</Typography><Button appearance="ghost" onClick={()=>{setCandidate(false);}}>收起候选提示</Button></div>}
  <div className="projection-tool-strip" aria-label="投影工具">
   <div><Button size="compact" appearance={drawer==='issues'?'outline':'ghost'} tone={issues.length?'danger':'neutral'} startIcon={<Icon name={issues.length?'exclamation-circle':'circle-check'}/>} onClick={()=>drawer==='issues'?close():openDrawer('issues')}>静态关注 {issues.length}</Button>
   <Button size="compact" appearance={rehearsal?'outline':'ghost'} startIcon={<Icon name="arrow-right"/>} onClick={()=>rehearsal?switchTab(rehearsal.flowId,visit?.nodeId):start()}>{rehearsal?'定位推演':'打开推演'}</Button>
   <Button size="compact" appearance={drawer==='resources'?'outline':'ghost'} startIcon={<Icon name="file"/>} onClick={()=>drawer==='resources'?close():openResources()}>绑定资源 {catalog.length}</Button></div>
   <Typography variant="meta" tone="muted" role="status">{quoteStatus||(analyzing?'选择节点，检查执行证据与结晶边界':'选择节点或连线，通过 Chat 调整配置')}</Typography>
  </div>
  <section className="activity-window activity-tab-window" data-section-id="workflow-map" aria-label="工作流活动图">
   <div className="activity-tab-help"><IconButton size="compact" aria-label="活动图阅读帮助" onClick={()=>openDrawer('help')}><Icon name="help"/></IconButton></div>
   <Tabs aria-label="流程图" appearance="underline" value={scene} onValueChange={target=>switchTab(target)} className="activity-flow-tabs" items={ir.flows.map(f=>({value:f.id,label:f.title,panel:f.id===scene?canvas:null}))}/>
   {rehearsal&&<RehearsalPanel ir={complexIR} state={rehearsal} playing={playing} onPlay={()=>setPlaying(!playing)} onStep={step} onSeek={cursor=>{setPlaying(false);setRehearsal({...rehearsal,cursor});setSelection({kind:'node',id:rehearsal.visits[cursor].nodeId});}} onReset={()=>{setPlaying(false);setRehearsal(startRehearsal());setSelection({kind:'node',id:'calibrate'});}} onClose={()=>{setPlaying(false);setRehearsal(null);}} onLocate={()=>switchTab(rehearsal.flowId,visit?.nodeId)} onQuote={quote}/>}
   <div className="activity-window-footer activity-complete-legend"  data-graph-legend>
    <div className="activity-legend"><span><i className="legend-entry"/>起点 / 入口</span><span><i className="legend-activity"/>活动</span><span><i className="legend-decision"/>判断</span><span><i className="legend-final"/>终点</span><span><i className="legend-artifact"/>材料</span><span><i className="legend-boundary"/>跨图出口</span><span className="legend-badge-subflow"><Icon name="git-branch"/>阶段展开</span><span className="legend-badge-trigger"><Icon name="arrow-up-right"/>可触发流程</span></div>
    <div className="activity-legend"><span><i className="tone-neutral"/>控制流</span><span><i className="tone-return"/>条件 / 返工</span><span><i className="tone-success"/>通过</span><span><i className="tone-danger"/>停止 / 重开</span><span><i className="tone-material"/>材料交接</span><Typography variant="meta" tone="muted">角标点击切换 Tab · 不执行流程</Typography></div>
   </div>
  </section>
 </div>;
}
