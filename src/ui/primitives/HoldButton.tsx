'use client';
import { useEffect,useRef,useState } from 'react';
import { Button } from './Button';
type Props={children:React.ReactNode;onConfirm:()=>void;simple:boolean;disabled?:boolean;className?:string};
export function HoldButton({children,onConfirm,simple,disabled,className=''}:Props){
 const [progress,setProgress]=useState(0);const [confirming,setConfirming]=useState(false);const timer=useRef<ReturnType<typeof setInterval>|null>(null);const started=useRef(0);const active=useRef(false);
 const cancel=()=>{if(timer.current)clearInterval(timer.current);timer.current=null;active.current=false;setProgress(0)};
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
 const start=()=>{if(simple||disabled)return;if(active.current)return;active.current=true;started.current=performance.now();timer.current=setInterval(()=>{const ratio=Math.min(1,(performance.now()-started.current)/1200);setProgress(ratio);if(ratio>=1){cancel();onConfirm()}},16)};
 const click=()=>{if(simple){if(confirming){setConfirming(false);onConfirm()}else setConfirming(true)}};
 return <Button className={className} disabled={disabled} onPointerDown={e=>{if(e.pointerType!=='mouse'||e.button===0)start()}} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();start()}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();cancel()}}} onClick={click} aria-label={typeof children==='string'?children:undefined}>{confirming?'Confirmer':children}<span className="hold-progress" style={{width:`${progress*100}%`}} aria-hidden="true"/></Button>
}
