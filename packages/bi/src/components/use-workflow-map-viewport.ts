import {useEffect,useRef,useState,type RefObject} from 'react';
import {select,zoom,zoomIdentity,type ZoomBehavior} from 'd3';
import type {MapCamera} from '../domain/workflow-map-camera';
/** D3 owns gesture state and smooth camera interpolation. React only renders its transform. */
export function useWorkflowMapViewport(host:RefObject<HTMLDivElement|null>,onExplore?:()=>void){
 const exploreRef=useRef(onExplore);exploreRef.current=onExplore;
 const [camera,setCamera]=useState<MapCamera>({x:0,y:0,scale:1}),[moving,setMoving]=useState(false);
 const behavior=useRef<ZoomBehavior<HTMLDivElement,unknown>|null>(null);
 useEffect(()=>{const element=host.current;if(!element)return;const z=zoom<HTMLDivElement,unknown>().scaleExtent([.02,2]).extent((): [[number,number],[number,number]]=>[[0,0],[element.clientWidth,element.clientHeight]])
  .filter(event=>event.type==='wheel'||(!event.button&&!((event.target as Element).closest('[role="button"],.map-disclosure'))))
  .on('start',event=>{setMoving(true);if(event.sourceEvent)exploreRef.current?.();}).on('zoom',event=>setCamera({x:event.transform.x,y:event.transform.y,scale:event.transform.k})).on('end',()=>setMoving(false));
  behavior.current=z;const selection=select(element).call(z).on('dblclick.zoom',null);return()=>{selection.interrupt().on('.zoom',null);behavior.current=null;};
 },[host]);
 const move=(next:MapCamera,animate=true)=>{const element=host.current,z=behavior.current;if(!element||!z)return;const selection=select(element);selection.interrupt();const transform=zoomIdentity.translate(next.x,next.y).scale(next.scale);if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches)selection.call(z.transform,transform);else selection.transition().duration(560).call(z.transform,transform);};
 return {camera,moving,move};
}
