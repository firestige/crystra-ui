import {Button,ButtonGroup,Chip,IconButton,Typography} from './design-system';
import {Icon} from './icon';
import type {WorkflowActivityIR} from '../domain/workflow-activity-ir';
import {resources,rehearsalChoices,type ProjectionIssue,type ProjectionResource,type Rehearsal} from '../domain/workflow-projection-tools';
const kindLabels={role:'Role',prompt:'Prompt',skill:'Skill',template:'Template',script:'Script'};
export function ChecksPanel({issues,fault,onFault,onLocate,onQuote}:{issues:ProjectionIssue[];fault:boolean;onFault:()=>void;onLocate:(id:string)=>void;onQuote:(text:string)=>void}){
 return <div className="projection-panel-body" data-projection-checks>
  <div className="projection-check-status" data-problem={issues.length>0}><Icon name={issues.length?'exclamation-circle':'circle-check'} size="context-marker"/><div><Typography as="h3" variant="item-title">{issues.length?issues.length+' 项需要关注':'已检查的引用均闭合'}</Typography><Typography variant="meta" tone="muted">自动检查 · 当前展示样本</Typography></div></div>
  <Typography as="p" variant="description" tone="secondary">检查图内引用与示例资源绑定。结果随样本更新；不代表已完成整个 Workflow 的形式化证明。</Typography>
  <div className="projection-check-rule"><Icon name="circle-check"/><span>节点、边与跨图引用</span><Chip tone="success">闭合</Chip></div>
  <div className="projection-check-rule" data-problem={issues.length>0}><Icon name={issues.length?'circle-x':'circle-check'}/><span>示例资源引用</span><Chip tone={issues.length?'danger':'success'}>{issues.length?'缺失':'闭合'}</Chip></div>
  {issues.map(issue=><article className="projection-issue" key={issue.id}>
   <Typography variant="meta" tone="error">资源引用无法解析</Typography>
   <Typography as="h3" variant="item-title">找不到 Evolutionary TDD Skill</Typography>
   <Typography as="p" variant="description" tone="secondary">“{issue.detail}”仍引用此 Skill，但当前故障样例的资源目录中没有它。</Typography>
   <code>tdd-skill</code>
   <ButtonGroup><Button size="compact" appearance="outline" onClick={()=>onLocate(issue.nodeId)}>定位活动</Button><Button size="compact" appearance="ghost" onClick={()=>onQuote('请检查编写 / 修改实现的 tdd-skill 缺失绑定样例，说明如何修订绑定。')}>引用到 Chat</Button></ButtonGroup>
  </article>)}
  <div className="projection-sample-control"><Typography variant="meta" tone="muted">故障注入 · 仅用于观察关注项的展示</Typography><Button size="compact" appearance="outline" onClick={onFault}>{fault?'恢复完整资源样例':'查看缺失绑定样例'}</Button></div>
 </div>;
}
export function ResourcesPanel({nodeId,resourceId,onResource,onLocate,onAll,onQuote,catalog=resources}:{catalog?:ProjectionResource[];nodeId?:string;resourceId:string|null;onResource:(id:string|null)=>void;onLocate:(id:string)=>void;onAll:()=>void;onQuote:(text:string)=>void}){
 const selected=catalog.find(r=>r.id===resourceId);
 const filtered=nodeId?catalog.filter(r=>r.nodeIds.includes(nodeId)):catalog;
 return <div className="projection-panel-body" data-projection-resources>
  {selected?<><Button size="compact" appearance="ghost" startIcon={<Icon name="arrow-left"/>} onClick={()=>onResource(null)}>资源列表</Button>
   <div className="projection-resource-heading"><Chip tone="primary">{kindLabels[selected.kind]}</Chip><Typography as="h3" variant="section-title">{selected.title}</Typography><Typography variant="meta" tone="muted">{selected.provenance}</Typography></div>
   <Typography as="p" variant="description" tone="secondary">{selected.description}</Typography>
   <div className="projection-resource-uses"><Typography variant="meta" tone="muted">示例中的使用位置</Typography>{selected.nodeIds.filter(n=>n!=='ladder').map(id=><Button key={id} size="compact" appearance="outline" onClick={()=>onLocate(id)}>{({implement:'编写 / 修改实现',refactor:'有限重构',calibrate:'校准测试','verify-rung':'验证 rung'} as Record<string,string>)[id]}</Button>)}</div>
   <Typography variant="code" className="projection-resource-path">{selected.path}</Typography>
   <pre className="projection-resource-content">{selected.content}</pre>
   <Button size="compact" appearance="outline" onClick={()=>onQuote('请结合当前 Workflow 分析资源 '+selected.path+' 的职责和使用方式，并给出需要的修订建议。')}>引用到 Chat 讨论</Button>
  </>:<>
   <div className="projection-resource-heading"><Typography as="h3" variant="item-title">{nodeId?'当前活动的关联资源':'Workflow 资源'}</Typography><Typography variant="description" tone="secondary">查看内容、定位使用位置，或引用到 Chat 继续设计。</Typography>{nodeId&&<Button size="compact" appearance="ghost" onClick={onAll}>查看全部资源</Button>}</div>
   {filtered.length===0&&<Typography variant="description" tone="muted">此活动暂无资源展示样例。</Typography>}
   {filtered.map(r=><button className="projection-resource-row" key={r.id} onClick={()=>onResource(r.id)}><div><Chip>{kindLabels[r.kind]}</Chip><Icon name="arrow-up-right"/></div><Typography as="strong" variant="item-title">{r.title}</Typography><Typography as="span" variant="description" tone="secondary">{r.description}</Typography></button>)}
   <Typography variant="meta" tone="muted">内容取自仓库；关联用于演示阅读组织，未替代正式 Route / Artifact 绑定。</Typography>
  </>}
 </div>;
}
export function RehearsalPanel({ir,state,playing,onPlay,onStep,onSeek,onReset,onClose,onLocate,onQuote}:{ir:WorkflowActivityIR;state:Rehearsal;playing:boolean;onPlay:()=>void;onStep:(edge:string)=>void;onSeek:(index:number)=>void;onReset:()=>void;onClose:()=>void;onLocate:()=>void;onQuote:(text:string)=>void}){
 const visit=state.visits[state.cursor],node=ir.nodes.find(n=>n.id===visit.nodeId)!,choices=rehearsalChoices(ir,state);
 const prev=state.visits[state.cursor-1]?.data||{};
 return <section className="projection-rehearsal" aria-label="交互推演" data-rehearsal-node={visit.nodeId}>
  <div className="projection-rehearsal-header"><div><Icon name="git-branch"/><Typography variant="item-title">测试阶梯 · 情景推演</Typography><Chip tone="primary">假设数据</Chip></div><ButtonGroup aria-label="推演播放控制">
   <IconButton size="compact" aria-label="推演上一步" disabled={state.cursor===0} onClick={()=>onSeek(state.cursor-1)}><Icon name="arrow-left"/></IconButton>
   <Button size="compact" appearance="outline" disabled={choices.length!==1} onClick={onPlay}>{playing?'暂停':'播放'}</Button>
   <Button size="compact" appearance="ghost" disabled={choices.length!==1} onClick={()=>onStep(choices[0].id)}>单步</Button>
   <IconButton size="compact" aria-label="重置推演" onClick={onReset}><Icon name="refresh"/></IconButton>
   <IconButton size="compact" aria-label="关闭推演" onClick={onClose}><Icon name="x"/></IconButton>
  </ButtonGroup></div>
  <div className="projection-rehearsal-body">
   <div className="projection-scenario"><Typography variant="meta" tone="muted">G-02 · 从已校准的 R2 开始</Typography><button className="projection-current-step" onClick={onLocate}>{node.title}<Icon name="target"/></button><Typography variant="description" tone="secondary">{choices.length>1?'到达分支，选择一个假设结果继续。':choices.length===0?'本次情景到达独立复核入口。':'当前假设：覆盖闭合，重构不引入回归。'}</Typography></div>
   <div className="projection-choices"><Typography variant="meta" tone="muted">{choices.length>1?'选择这一次的结果':'下一步'}</Typography>
    {choices.length>1?choices.map(e=><Button key={e.id} size="compact" appearance="outline" tone={e.outcome==='success'?'success':'primary'} onClick={()=>onStep(e.id)}>{e.title}</Button>):<Typography variant="description">{choices[0]?ir.nodes.find(n=>n.id===choices[0].to)?.title:'情景片段结束，可回看或重选'}</Typography>}
    <Button size="compact" appearance="ghost" onClick={()=>onQuote('请基于当前测试阶梯推演路径 '+state.visits.slice(0,state.cursor+1).map(v=>ir.nodes.find(n=>n.id===v.nodeId)?.title).join(' → ')+'，分析是否符合预期，并按需要给出其他情景或修改建议。')}>引用到 Chat，继续分析</Button>
   </div>
   <div className="projection-data"><Typography variant="meta" tone="muted">随路径传递的数据 · 展示字段</Typography><div key={state.cursor}>{Object.entries(visit.data).sort(([a],[b])=>Number(prev[b]!==visit.data[b])-Number(prev[a]!==visit.data[a])).map(([key,value])=><div key={key} data-changed={prev[key]!==value}><code>{({goal:'Goal',rung:'Rung',oracle:'测试基准',candidate:'候选',test:'测试结果',diagnostic:'诊断',coverage:'覆盖',refactor:'重构',ladder:'阶梯'} as Record<string,string>)[key]||key}</code><span>{value}</span></div>)}</div></div>
  </div>
  <div className="projection-history" aria-label="推演轨迹">{state.visits.map((v,i)=><button key={i} aria-current={i===state.cursor?'step':undefined} onClick={()=>onSeek(i)}><span>{i+1}</span>{ir.nodes.find(n=>n.id===v.nodeId)?.title}</button>)}</div>
 </section>;
}
