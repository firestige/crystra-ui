import {useRef,useState} from 'react';
import {Button,IconButton,Typography} from './design-system';
import {Icon} from './icon';
import type {WorkflowMapIR} from '../domain/workflow-map-ir';
import type {MapLayout} from '../domain/workflow-map-engine';
import type {MapCamera} from '../domain/workflow-map-camera';
export function WorkflowMapOutline({ir,selected,onLocate}:{ir:WorkflowMapIR;selected:string|null;onLocate:(id:string)=>void}){
 const [hidden,setHidden]=useState<Set<string>>(new Set());
 const branch=(parent?:string):React.ReactNode=><ul>{ir.nodes.filter(n=>n.parent===parent&&n.kind==='group').map(n=><li key={n.id}><div data-active={n.id===selected}><span>{n.kind==='group'&&<IconButton appearance="ghost" aria-label={(hidden.has(n.id)?'展开大纲 ':'收起大纲 ')+n.title} onClick={()=>setHidden(prev=>{const next=new Set(prev);next.has(n.id)?next.delete(n.id):next.add(n.id);return next;})}><Icon name="chevron-down" style={{transform:hidden.has(n.id)?'rotate(-90deg)':undefined}}/></IconButton>}</span><Button appearance="ghost" aria-label={'定位 '+n.title} aria-current={selected===n.id?'location':undefined} onClick={()=>onLocate(n.id)}>{n.title}</Button></div>{n.kind==='group'&&!hidden.has(n.id)&&branch(n.id)}</li>)}</ul>;
 return <nav aria-label="活动大纲"><Typography variant="label">活动大纲</Typography>{branch()}</nav>;
}
export function WorkflowMapMinimap({layout,camera,bounds,onMove}:{layout:MapLayout;camera:MapCamera;bounds:{width:number;height:number};onMove:(camera:MapCamera)=>void}){
 const dragging=useRef<{x:number;y:number}|null>(null);
 const world={x:-camera.x/camera.scale,y:-camera.y/camera.scale,width:bounds.width/camera.scale,height:bounds.height/camera.scale};
 const point=(event:React.PointerEvent<SVGSVGElement>)=>{const matrix=event.currentTarget.getScreenCTM();return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;};
 const move=(x:number,y:number)=>onMove({...camera,x:bounds.width/2-x*camera.scale,y:bounds.height/2-y*camera.scale});
 return <div className="map-minimap"><svg role="group" aria-label="缩略导航图" tabIndex={0} viewBox={`-24 -24 ${layout.width+48} ${layout.height+48}`} onPointerDown={event=>{const p=point(event);if(!p)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);dragging.current=(event.target as Element).hasAttribute('data-minimap-window')?{x:world.x+world.width/2-p.x,y:world.y+world.height/2-p.y}:{x:0,y:0};move(p.x+dragging.current.x,p.y+dragging.current.y);}} onPointerMove={event=>{if(!dragging.current)return;const p=point(event);if(p)move(p.x+dragging.current.x,p.y+dragging.current.y);}} onPointerUp={event=>{dragging.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}} onPointerCancel={()=>dragging.current=null} onKeyDown={event=>{const directions:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=directions[event.key];if(d){event.preventDefault();move(world.x+world.width/2+d[0]*world.width*.2,world.y+world.height/2+d[1]*world.height*.2);}}}>
 {layout.nodes.filter(n=>n.expanded).map(n=><rect key={n.id} x={n.x} y={n.y} width={n.width} height={n.height} rx="8" className="map-minimap-group"/>)}{layout.edges.map(e=><path key={e.id} d={e.path} className="map-minimap-edge"/>)}{layout.nodes.filter(n=>!n.expanded).map(n=><rect key={n.id} x={n.x} y={n.y} width={n.width} height={n.height} rx="8" className="map-minimap-node"/>)}<rect data-minimap-window x={world.x} y={world.y} width={world.width} height={world.height} className="map-minimap-window"/>
 </svg></div>;
}
