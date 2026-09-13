import {ConfigurationFileInput,downloadConfiguration} from './configuration-file';
import {FixedColumnChartLayout} from './fixed-column-chart-layout';
import {WidgetTooltip} from './widget-tooltip';
import {List,ListItem} from './collection-components';
import {observationMatrix,compatibleChartItem,observationChartTypes,initialObservationSettings,exportObservationSetting,importObservationSetting,type ObservationSetting,type ObservationChart} from '../test-harness/observation-settings';
import {useRef,useState} from 'react';
import {useContainerWidth} from 'react-grid-layout';
import {Card,Typography,Button,ButtonGroup,Chip,IconButton,TextInput} from './design-system';
import {Icon} from './icon';
import {SelectField,SelectionControl,SearchField} from './state-components';
import {StructuredChart,StructuredChartLegend} from './structured-widget-charts';
import {analysisDimensions,analysisMetrics,analysisDeliveries,type AnalysisDimension,type AnalysisMetric,type AnalysisItem} from '../test-harness/result-analysis-fixture';
import {deliveryDirectorySearchFields} from '../test-harness/delivery-directory-fixture';
import {searchDeliveries,type DeliverySearchField} from '../domain/delivery-search';
import type {MatrixData} from '../domain/widget-families';
import '../widget-expression-study.css';
import '../result-analysis-preview.css';
function ResultChart({data,chartType}:{data:MatrixData;chartType:ObservationChart['chartType']}){
 const {containerRef,width}=useContainerWidth({initialWidth:500});
 return <div ref={containerRef} data-color-scope="chart"><StructuredChart data={data} view={chartType??"grouped-columns"} plotSize={{width:Math.max(240,width),height:230}}/></div>;
}
const definition=(key:AnalysisMetric)=>analysisMetrics.find(metric=>metric.key===key)!;
export function ResultAnalysisPreview({timeRange=['2026-09-03T00:00:00+08:00','2026-09-09T23:59:59+08:00'],rangeLabel='最近 7 天',embedded=false}:{timeRange?:readonly [string,string];rangeLabel?:string;embedded?:boolean}={}){
 const help=useRef<HTMLDialogElement>(null),catalog=useRef<HTMLDialogElement>(null),dataset=useRef<HTMLDialogElement>(null),serial=useRef(2);
 const [settings,setSettings]=useState(()=>structuredClone(initialObservationSettings));
 const [settingId,setSettingId]=useState('versions');
 const [chartId,setChartId]=useState('cost');
 const [settingsOpen,setSettingsOpen]=useState(true);
 const draggingChart=useRef<string|null>(null);
 const [dropTarget,setDropTarget]=useState<string|null>(null);
 const editor=useRef<HTMLDialogElement>(null);
 const [draft,setDraft]=useState<ObservationSetting|null>(null);
 const [notice,setNotice]=useState('');
 const fileInput=useRef<HTMLInputElement>(null);
 const allowed=analysisDeliveries.filter(row=>Date.parse(row.startedAt)>=Date.parse(timeRange[0])&&Date.parse(row.startedAt)<=Date.parse(timeRange[1]));
 const [subset,setSubset]=useState<string[]|null>(null);
 const deliveries=allowed.filter(row=>subset===null||subset.includes(row.deliveryId)).map(row=>row.deliveryId);
 const [draftSelection,setDraftSelection]=useState(deliveries);
 const activeSetting=settings.find(value=>value.id===settingId);
 const setting:ObservationSetting=draft??activeSetting??{id:'',name:'',charts:[]};
 const chart=setting.charts.find(value=>value.id===chartId)??setting.charts[0];
 const dirty=draft!==null&&JSON.stringify(draft)!==JSON.stringify(settings.find(value=>value.id===draft.id));
 const updateSetting=(patch:Partial<ObservationSetting>)=>setDraft(current=>current?{...current,...patch}:current);
 const updateChart=(patch:Partial<ObservationChart>)=>updateSetting({charts:setting.charts.map(value=>value.id===chart?.id?{...value,...patch}:value)});
 const items=chart?.items??[],primary=chart?.primary??'version',secondary=chart?.secondary??'';
 const setItems=(next:(value:AnalysisItem[])=>AnalysisItem[])=>updateChart({items:next(items)});
 const setPrimary=(value:AnalysisDimension)=>updateChart({primary:value,...value===secondary?{secondary:chart?.chartType==='heatmap'?primary:'' as const}:{}});
 const setSecondary=(value:AnalysisDimension|'')=>updateChart({secondary:value});
 const unique=()=>`setting-${Date.now()}-${serial.current++}`;
 const addChart=()=>{const id=unique();updateSetting({charts:[...setting.charts,{id,title:'新图表',items:[],primary:'version',secondary:''}]});setChartId(id);};
 const deleteChart=(id:string)=>{const index=setting.charts.findIndex(c=>c.id===id),charts=setting.charts.filter(c=>c.id!==id);updateSetting({charts});if(chart?.id===id)setChartId(charts[Math.min(index,charts.length-1)]?.id??'');};
 const moveChart=(source:string,target:string)=>{const charts=[...setting.charts],from=charts.findIndex(c=>c.id===source),to=charts.findIndex(c=>c.id===target);if(from<0||to<0||from===to)return;const [moved]=charts.splice(from,1);charts.splice(to,0,moved);updateSetting({charts});};
 const openEditor=(value:ObservationSetting)=>{setDraft(structuredClone(value));setChartId(value.charts[0]?.id??'');editor.current?.showModal();};
 const save=()=>{if(!draft)return;setSettings(current=>[...current.filter(value=>value.id!==draft.id),structuredClone(draft)]);setSettingId(draft.id);editor.current?.close();setDraft(null);setNotice('观察设置已保存');};
 const deleteSetting=(id:string)=>{const index=settings.findIndex(value=>value.id===id),target=settings[index];if(!target)return;const remaining=settings.filter(value=>value.id!==id);setSettings(remaining);if(settingId===id){setSettingId(remaining[Math.min(index,remaining.length-1)]?.id??'');setChartId('');}setNotice(`已删除观察设置“${target.name}”`);};
 const download=()=>{if(activeSetting)downloadConfiguration(exportObservationSetting(activeSetting),'observation-setting.json');};
 const [metricQuery,setMetricQuery]=useState(''),[category,setCategory]=useState('all');
 const [field,setField]=useState<DeliverySearchField['key']>('taskName'),[query,setQuery]=useState(''),[submitted,setSubmitted]=useState({field:'taskName' as DeliverySearchField['key'],value:''});
 const [workflow,setWorkflow]=useState(''),[version,setVersion]=useState('');
 const matches=searchDeliveries(allowed,submitted.value?[{id:'query',field:submitted.field,value:submitted.value}]:[],['2026-08-01T00:00:00Z','2026-09-10T00:00:00Z'],deliveryDirectorySearchFields).filter(row=>(!workflow||row.workflowId===workflow)&&(!version||row.workflowVersion===version));
 const add=(metric:AnalysisMetric)=>{const item=definition(metric),operation=item.operations.find(op=>compatibleChartItem(items,{metric,operation:op.key}));if(!operation)return;setItems(current=>[...current,{id:unique(),metric,operation:operation.key,name:item.label}]);catalog.current?.close();};
 const change=(id:string,patch:Partial<AnalysisItem>)=>setItems(current=>current.map(item=>item.id===id?{...item,...patch}:item));
 const modalClose=(ref:typeof help,title:string)=><IconButton appearance="ghost" aria-label={`关闭${title}`} onClick={()=>ref.current?.close()}><Icon name="x"/></IconButton>;
 return <section id="result-analysis-review" data-ui-owner="components" className={embedded?"result-analysis-embedded":undefined}><Card level="section" padding={embedded?"none":undefined} border={embedded?"none":undefined} heading={embedded?undefined:"对比分析"} actions={!embedded&&<IconButton appearance="ghost" aria-label="分析帮助" onClick={()=>help.current?.showModal()}><Icon name="help" /></IconButton>}>
 <div className="result-analysis-layout" data-settings-open={settingsOpen}><aside id="observation-settings-directory" className="result-analysis-sidebar" aria-label="观察设置目录" aria-hidden={!settingsOpen} inert={!settingsOpen}><div className="result-analysis-config">
  <section aria-label="观察设置">
   <div className="result-analysis-heading"><div className="observation-settings-title"><Typography as="h3" variant="section-title">观察设置</Typography>{embedded&&<IconButton appearance="ghost" aria-label="分析帮助" onClick={()=>help.current?.showModal()}><Icon name="help"/></IconButton>}</div><ButtonGroup className="observation-setting-actions" role="group" aria-label="观察设置操作">
    <WidgetTooltip text="修改设置" focusable={false}><IconButton appearance="ghost" aria-label="修改设置" disabled={!activeSetting} onClick={()=>activeSetting&&openEditor(activeSetting)}><Icon name="adjustments-horizontal" size="inline-action"/></IconButton></WidgetTooltip>
    <WidgetTooltip text="导出设置" focusable={false}><IconButton appearance="ghost" aria-label="导出设置" disabled={!activeSetting} onClick={download}><Icon name="download" size="inline-action"/></IconButton></WidgetTooltip>
    <WidgetTooltip text="导入设置" focusable={false}><IconButton appearance="ghost" aria-label="导入设置" onClick={()=>fileInput.current?.click()}><Icon name="upload" size="inline-action"/></IconButton></WidgetTooltip>
    <WidgetTooltip text="新建设置" focusable={false}><IconButton appearance="ghost" aria-label="新建" onClick={()=>openEditor({id:unique(),name:'新观察设置',charts:[]})}><Icon name="plus" size="inline-action"/></IconButton></WidgetTooltip>
   </ButtonGroup></div>
   <List aria-label="观察设置列表" selectionAppearance="surface">{settings.map(value=><ListItem key={value.id} actions={<><WidgetTooltip text="编辑设置" focusable={false}><IconButton appearance="ghost" aria-label={`编辑设置 ${value.name}`} onClick={()=>openEditor(value)}><Icon name="adjustments-horizontal" size="inline-action"/></IconButton></WidgetTooltip><WidgetTooltip text="删除设置" focusable={false}><IconButton appearance="ghost" aria-label={`删除设置 ${value.name}`} onClick={()=>deleteSetting(value.id)}><Icon name="trash" size="inline-action"/></IconButton></WidgetTooltip></>} primary={value.name} description={`${value.charts.length} 个图表`} selected={value.id===settingId} onActivate={()=>{setSettingId(value.id);setNotice('');}}/>)}</List>
   <ConfigurationFileInput inputRef={fileInput} label="导入观察设置文件" maxBytes={1000000} onFile={async file=>{const imported=importObservationSetting(await file.text());imported.id=unique();setSettings(current=>[...current,imported]);setSettingId(imported.id);setChartId('');setNotice('已导入观察设置');}} onError={error=>setNotice(error instanceof Error?error.message:'导入失败')}/>

   {notice&&<Typography variant="meta" role="status">{notice}</Typography>}
  </section>
 </div></aside><div className="result-analysis-output">
  <header className="result-analysis-heading observation-view-header"><div className="observation-view-title"><IconButton appearance="ghost" aria-label={settingsOpen?'收起观察设置':'展开观察设置'} aria-expanded={settingsOpen} aria-controls="observation-settings-directory" onClick={()=>setSettingsOpen(value=>!value)}><Icon name="chevron-down" className="observation-settings-chevron"/></IconButton><Typography as="h3" variant="section-title">{activeSetting?.name??'对比分析'}</Typography></div>{activeSetting&&<Button appearance="ghost" aria-label="数据范围" onClick={()=>{setDraftSelection(deliveries);dataset.current?.showModal();}}>{subset===null?'数据范围':`已选 ${deliveries.length} 个`}<Icon name="chevron-down"/></Button>}</header>
  {activeSetting&&<>{activeSetting.charts.length===0&&<Typography variant="description">添加图表开始配置观察视图。</Typography>}
  <FixedColumnChartLayout>{activeSetting.charts.map(value=><div key={value.id} data-observation-chart={value.id}><ObservationChartResult chart={value} deliveries={deliveries}/></div>)}</FixedColumnChartLayout></>}
  {!activeSetting&&<Typography variant="description">新建或导入观察设置以开始对比分析。</Typography>}
 </div></div></Card>
 <dialog ref={editor} className="result-analysis-help observation-setting-editor" aria-label="编辑观察设置" onCancel={()=>setDraft(null)} onClose={()=>setDraft(null)}>
  <Card level="section" heading="编辑观察设置" actions={modalClose(editor,'设置编辑器')}>
   {draft&&<div className="result-analysis-help-copy">
    <div className="observation-editor-workspace"><section className="observation-editor-list" aria-label="图表列表">
    <label className="observation-setting-name">设置名称<TextInput type="text" aria-label="设置名称" value={draft.name} onChange={event=>updateSetting({name:event.target.value})}/></label>
  <div className="result-analysis-heading"><Typography as="h3" variant="section-title">图表</Typography><WidgetTooltip text="添加图表" focusable={false}><IconButton appearance="ghost" aria-label="添加图表" onClick={addChart}><Icon name="plus" size="inline-action"/></IconButton></WidgetTooltip></div>
   <List aria-label="图表排序列表" aria-description="拖拽调整顺序，或按 Alt 加上、下箭头排序" selectionAppearance="surface">{setting.charts.map(value=><ListItem key={value.id} data-chart-id={value.id} data-drop-target={dropTarget===value.id||undefined} data-drop-edge={dropTarget===value.id&&draggingChart.current?(setting.charts.findIndex(c=>c.id===draggingChart.current)<setting.charts.findIndex(c=>c.id===value.id)?'after':'before'):undefined} draggable onDragStart={event=>{draggingChart.current=value.id;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',value.id);}} onDragOver={event=>{if(draggingChart.current){event.preventDefault();event.dataTransfer.dropEffect='move';setDropTarget(value.id);}}} onDrop={event=>{event.preventDefault();if(draggingChart.current)moveChart(draggingChart.current,value.id);draggingChart.current=null;setDropTarget(null);}} onDragEnd={()=>{draggingChart.current=null;setDropTarget(null);}} onKeyDown={event=>{if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();const index=setting.charts.findIndex(c=>c.id===value.id),target=setting.charts[index+(event.key==='ArrowUp'?-1:1)];if(target)moveChart(value.id,target.id);}}} leading={<Icon name="grip-vertical"/>} primary={value.title||'未命名图表'} actions={<WidgetTooltip text="删除图表" focusable={false}><IconButton appearance="ghost" aria-label={`删除图表 ${value.title||'未命名图表'}`} onClick={()=>deleteChart(value.id)}><Icon name="trash"/></IconButton></WidgetTooltip>} selected={chart?.id===value.id} onActivate={()=>setChartId(value.id)}/>)}</List>
   </section><section className="observation-editor-controls" aria-label="图表设置"><Typography as="h3" variant="section-title">图表设置</Typography>
   {chart&&<>
   <label className="observation-setting-name">图表标题<TextInput type="text" aria-label="图表标题" value={chart.title} onChange={event=>updateChart({title:event.target.value})}/></label>
   <div className="result-analysis-heading"><Button size="compact" appearance="ghost" onClick={()=>catalog.current?.showModal()}>添加数据列</Button></div>
   <List aria-label="已选数据列" selectionAppearance="surface">{items.map(item=><ListItem key={item.id} data-analysis-item={item.id} primary={definition(item.metric).label} description={definition(item.metric).unit} actions={<IconButton appearance="ghost" aria-label={`移除数据列 ${item.id}`} onClick={()=>{const remaining=items.filter(value=>value.id!==item.id);updateChart({items:remaining,...chart.valueItemIds?{valueItemIds:chart.valueItemIds.filter(id=>id!==item.id)}:{}});}}><Icon name="x"/></IconButton>}/>)}</List>
   {items.length===0&&<Typography variant="description">尚未添加数据列</Typography>}
   <SelectField label="图形类型" size="compact" value={chart.chartType??'grouped-columns'} onChange={event=>{const type=event.target.value as ObservationChart['chartType'];updateChart({chartType:type,...type==='heatmap'?{valueItemIds:items.slice(0,1).map(item=>item.id)}:{valueItemIds:undefined},...type==='area'?{primary:'date',secondary:primary==='date'?secondary:primary}:type==='heatmap'&&!secondary?{secondary:analysisDimensions.find(d=>d.key!==primary&&d.key!=='date')!.key}:{}});}} options={observationChartTypes}/>

   <SelectField size="compact" label={chart.chartType==='heatmap'?'列维度':chart.chartType==='radar'?'比较对象':chart.chartType==='grouped-bars'?'Y 轴 · 分类':'X 轴 · 分类'} value={primary} onChange={event=>setPrimary(event.target.value as AnalysisDimension)} options={analysisDimensions.filter(item=>chart.chartType!=='area'||item.key==='date').map(item=>({value:item.key,label:item.label}))}/>
   {chart.chartType!=='radar'&&<SelectField size="compact" label={chart.chartType==='heatmap'?'行维度':'系列分组'} value={secondary} onChange={event=>setSecondary(event.target.value as AnalysisDimension|'')} options={[...(chart.chartType==='heatmap'?[]:[{value:'',label:'仅按指标'}]),...analysisDimensions.filter(item=>item.key!==primary).map(item=>({value:item.key,label:item.label}))]}/>}
   <div className="observation-value-mapping"><Typography variant="meta">{chart.chartType==='heatmap'?'颜色指标':chart.chartType==='radar'?'指标轴':chart.chartType==='grouped-bars'?'X 轴 · 数值':'Y 轴 · 数值'}</Typography>
   {items.map(item=><div key={item.id} className="observation-value-field"><SelectionControl type={chart.chartType==='heatmap'?'radio':'checkbox'} name="chart-value-mapping" label={definition(item.metric).label} checked={chart.valueItemIds?chart.valueItemIds.includes(item.id):chart.chartType==='heatmap'?items[0]?.id===item.id:true} onChange={()=>{const selected=chart.valueItemIds??(chart.chartType==='heatmap'?items.slice(0,1):items).map(value=>value.id);updateChart({valueItemIds:chart.chartType==='heatmap'?[item.id]:selected.includes(item.id)?selected.filter(id=>id!==item.id):[...selected,item.id]});}}/>
   {definition(item.metric).operations.length>1&&<SelectField size="compact" label={`${item.id}计算口径`} hideLabel value={item.operation} onChange={event=>change(item.id,{operation:event.target.value,name:definition(item.metric).label+' · '+definition(item.metric).operations.find(op=>op.key===event.target.value)?.label})} options={definition(item.metric).operations.map(operation=>({value:operation.key,label:operation.label,disabled:!compatibleChartItem(items.filter(other=>other.id!==item.id),{metric:item.metric,operation:operation.key})}))}/>}
   </div>)}
   </div>
   </>}
   {!chart&&<Typography variant="description">选择或添加图表</Typography>}
  </section>
   <section className="observation-editor-preview" aria-label="设置图表预览">
    <div className="result-analysis-heading"><Typography as="h3" variant="section-title">{draft.name || '观察视图'}</Typography><Chip appearance="soft">演示数据</Chip></div>
    <FixedColumnChartLayout>{draft.charts.map(value=><div key={value.id} data-preview-chart={value.id}>
     <ObservationChartResult chart={value.items.length?value:{...value,items:[{id:'preview-placeholder',metric:'calls',operation:'count',name:'指标预览'}]}} deliveries={deliveries.length?deliveries:analysisDeliveries.slice(0,12).map(row=>row.deliveryId)}/>
    </div>)}</FixedColumnChartLayout>
    {!draft.charts.length&&<Typography variant="description">添加图表后在这里预览。</Typography>}
   </section></div>
    <div className="result-analysis-heading"><Button appearance="ghost" onClick={()=>editor.current?.close()}>取消</Button><Button onClick={save} disabled={!dirty||!draft.name.trim()}>保存设置</Button></div>
   </div>}
  </Card>
 </dialog>
 <dialog ref={catalog} className="result-analysis-help" aria-label="添加数据列">
  <Card heading="添加数据列" actions={modalClose(catalog,'数据列目录')}><div className="result-analysis-help-copy">
   <SearchField label="搜索指标" hideLabel placeholder="搜索指标名称" leading={<Icon name="search"/>} value={metricQuery} onChange={event=>setMetricQuery(event.target.value)}/>
   <SelectField label="指标分类" value={category} onChange={event=>setCategory(event.target.value)} options={[{value:'all',label:'全部'},{value:'usage',label:'资源与费用'},{value:'latency',label:'延时'}]}/>
   {analysisMetrics.filter(metric=>metric.label.includes(metricQuery.trim())&&(category==='all'||(category==='latency'?metric.key==='ttft':metric.key!=='ttft'))).map(metric=><Button key={metric.key} appearance="ghost" disabled={!metric.operations.some(op=>compatibleChartItem(items,{metric:metric.key,operation:op.key}))} onClick={()=>add(metric.key)}>{metric.label}<span> · {metric.unit}{!metric.operations.some(op=>compatibleChartItem(items,{metric:metric.key,operation:op.key}))?' · 请新建图表':''}</span><Icon name="plus"/></Button>)}
   {!analysisMetrics.some(metric=>metric.label.includes(metricQuery.trim())&&(category==='all'||(category==='latency'?metric.key==='ttft':metric.key!=='ttft')))&&<Typography variant="description">没有匹配的可用指标</Typography>}
  </div></Card>
 </dialog>
 <dialog ref={dataset} className="result-analysis-help result-analysis-dataset" aria-label="选择 Delivery">
  <Card heading="选择 Delivery" actions={modalClose(dataset,'数据范围')}><div className="result-analysis-help-copy">
   <div className="result-analysis-heading"><Typography variant="meta">全局范围：{rangeLabel} · {allowed.length} 个 Delivery</Typography><Button appearance="ghost" onClick={()=>setDraftSelection(allowed.map(row=>row.deliveryId))}>恢复全局范围</Button></div>
   <SearchField label="检索 Delivery" hideLabel leading={<SelectField className="result-analysis-field" label="检索字段" hideLabel appearance="embedded" value={field} onChange={event=>setField(event.target.value as DeliverySearchField['key'])} options={deliveryDirectorySearchFields.map(item=>({value:item.key,label:item.label}))}/>} placeholder={deliveryDirectorySearchFields.find(item=>item.key===field)?.placeholder} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();setSubmitted({field,value:query.trim()});}}}/>
   <details><summary>筛选结果</summary><div className="result-analysis-help-copy">
    <SelectField label="筛选工作流" value={workflow} onChange={event=>setWorkflow(event.target.value)} options={[{value:'',label:'全部工作流'},...[...new Map(analysisDeliveries.map(row=>[row.workflowId,row])).values()].map(row=>({value:row.workflowId,label:row.workflowName+' · '+row.workflowId}))]}/>
    <SelectField label="筛选版本" value={version} onChange={event=>setVersion(event.target.value)} options={[{value:'',label:'全部版本'},{value:'v2',label:'v2'},{value:'v3',label:'v3'}]}/>
   </div></details>
   <div className="result-analysis-heading"><Typography variant="meta">{matches.length} 条命中</Typography><Typography variant="meta">已选 {draftSelection.length} 个 · 当前命中已选 {matches.filter(row=>draftSelection.includes(row.deliveryId)).length} 个</Typography></div>
   <div className="result-analysis-heading"><Button appearance="ghost" onClick={()=>setDraftSelection(current=>[...new Set([...current,...matches.map(row=>row.deliveryId)])])}>选择全部命中</Button><Button appearance="ghost" onClick={()=>setDraftSelection(current=>current.filter(id=>!matches.some(row=>row.deliveryId===id)))}>取消当前命中</Button></div>
   <div className="result-analysis-delivery-list">{matches.map(row=><SelectionControl key={row.deliveryId} type="checkbox" label={`${row.deliveryId} · ${row.taskName} · ${row.workflowName}@${row.workflowVersion}`} checked={draftSelection.includes(row.deliveryId)} onChange={()=>setDraftSelection(current=>current.includes(row.deliveryId)?current.filter(id=>id!==row.deliveryId):[...current,row.deliveryId])}/>)}{matches.length===0&&<Typography variant="description">没有匹配的 Delivery</Typography>}</div>
   <Button onClick={()=>{const selected=draftSelection.filter(id=>allowed.some(row=>row.deliveryId===id));setSubset(selected.length===allowed.length?null:selected);dataset.current?.close();}}>应用数据范围</Button>
  </div></Card>
 </dialog>
 <dialog ref={help} className="result-analysis-help" aria-label="分析帮助">
  <Card heading="分析帮助" actions={modalClose(help,'分析帮助')}><div className="result-analysis-help-copy">
   <Typography variant="description">添加分析项并选择计算口径。一个 Card 只呈现一张图；兼容指标合并成同一绘图区中的系列。例如延时 P50 与 P95 可以共图，费用和延时不兼容，应添加另一张图表。计算口径改变也必须维持相同单位和统计粒度。指标目录只列出当前数据能力支持的指标。</Typography>
   <Typography variant="description">Delivery 是数据来源和下钻身份，默认按版本、Role、模型或 Provider 分组。每组显示 Delivery 数与有效调用数；同一次执行中的调用不等同于独立执行样本。费用同时支持总量、每 Delivery 平均和每调用平均。</Typography>
   <Typography variant="description">数据选择支持字段检索、结果过滤和逐项选择。“选择全部命中”覆盖完整命中集合；未命中的已选记录仍保留。关闭或 Escape 放弃本次选择修改，应用后才更新结果。</Typography>
   <Typography variant="description">本样本提供 48 个 Delivery 的合成调用记录，不代表真实费率、性能或独立随机样本。生产能力由数据接口声明，缺失数据不能补零；缓存率按原始 Token 汇总，延时分位数按有效调用计算。</Typography>
   <Typography variant="description">观察设置保存每张图表的指标、口径、轴与系列映射和排列尺寸。切换设置保留本次数据范围；范围变化不将设置标为未保存。导入／导出仅包含设置，不包含临时 Delivery 集合，导入失败不覆盖现有设置。新建／修改在模态框完成，取消或 Escape 丢弃草稿，不改变当前视图。样本保存仅限本页会话。</Typography>
   <Typography variant="description">先满足当前用户的真实比较需求，再根据 issue 扩展；不开放任意代码，也不生成 Workflow 结晶方案。</Typography>
   <Button onClick={()=>help.current?.close()}>知道了</Button>
  </div></Card>
 </dialog></section>;
}

function ObservationChartResult({chart,deliveries}:{chart:ObservationChart;deliveries:string[]}){
 chart={...chart,items:chart.items.filter(item=>!chart.valueItemIds||chart.valueItemIds.includes(item.id))};
 const matrix=observationMatrix(chart,deliveries);
 const dimensionLabel=(key:AnalysisDimension)=>analysisDimensions.find(d=>d.key===key)!.label;
 const metricLabels=[...new Set(chart.items.map(item=>definition(item.metric).label))].join(' / ');
 const data:MatrixData={...matrix,legendPlacement:'external',xAxisLabel:dimensionLabel(chart.primary),yAxisLabel:chart.chartType==='heatmap'?(chart.secondary?dimensionLabel(chart.secondary):''):`${metricLabels} (${matrix.unit})`,legendLabel:metricLabels};
 const error=!chart.items.length||!matrix.dimensions.length?'请选择指标和数据范围。':chart.chartType==='radar'&&matrix.dimensions.length<3?'雷达图需要至少三个兼容数据列作为辐射轴。':chart.chartType==='heatmap'&&!chart.secondary?'请选择热力图的行字段。':null;
 return <Card className="observation-chart-card" heading={chart.title||'未命名图表'} actions={!error&&<StructuredChartLegend data={data} view={chart.chartType??'grouped-columns'}/>}>
 {error?<Typography variant="description">{error}</Typography>:<ResultChart chartType={chart.chartType} data={data}/>}
 </Card>;
}
