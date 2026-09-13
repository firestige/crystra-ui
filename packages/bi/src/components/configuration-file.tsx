import type {RefObject} from 'react';

/** Configuration contents and validation belong to the caller. */
export function downloadConfiguration(text:string,filename:string){
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=filename;
 document.body.append(link);
 try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
export function ConfigurationFileInput({inputRef,label,onFile,onError,onBusy,maxBytes}:{
 inputRef:RefObject<HTMLInputElement|null>;label:string;onFile:(file:File)=>Promise<void>;
 onError:(error:unknown)=>void;onBusy?:(busy:boolean)=>void;maxBytes?:number;
}){
 return <input ref={inputRef} type="file" accept=".json,application/json" hidden aria-label={label} onChange={async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  onBusy?.(true);
  try{if(maxBytes&&file.size>maxBytes)throw Error('设置文件过大');await onFile(file);}catch(error){onError(error);}finally{onBusy?.(false);}
 }}/>;
}
