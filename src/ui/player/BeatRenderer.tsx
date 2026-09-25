'use client';
import { useEffect,useState } from 'react';
import { motion,useReducedMotion } from 'motion/react';
import { renderText, type Beat, type Content, type GameState } from '../../engine';
export function BeatRenderer({beats,state,content,lawNumber,onDone,instant=false,reduceAnimations=false}:{beats:Beat[];state:GameState;content:Content;lawNumber?:number;onDone:()=>void;instant?:boolean;reduceAnimations?:boolean}){
 const reduced=useReducedMotion();const [shown,setShown]=useState(instant||reduced||reduceAnimations?beats.length:0);
 useEffect(()=>{if(shown>=beats.length){onDone();return}const t=setTimeout(()=>setShown(n=>n+1),shown===0?450:Math.max(1100,beats[shown-1]?.pauseMs??0));return()=>clearTimeout(t)},[shown,beats,onDone]);
 useEffect(()=>{const advance=(e:KeyboardEvent)=>{if(e.code==='Space'&&e.target===document.body&&shown<beats.length){e.preventDefault();setShown(beats.length)}};window.addEventListener('keydown',advance);return()=>window.removeEventListener('keydown',advance)},[shown,beats.length]);
 return <div className="beats" aria-live="polite" onClick={()=>{if(shown<beats.length)setShown(beats.length)}}>{beats.slice(0,shown).map((beat,i)=><motion.p key={`${i}-${beat.text}`} initial={reduced||reduceAnimations?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.4}} className={`serif beat ${beat.style??''} ${beat.text==='—'?'dash':''}`}>{renderText(beat.text,state,content,lawNumber)}</motion.p>)}</div>
}
