'use client';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Choice = 'rise' | 'question' | 'sit' | 'object' | 'proof' | 'silent';
const replies: Record<Choice,string> = {
  rise: 'Le Greffier incline la tête. « Votre présence est constatée. Elle ne constitue pas un aveu. »',
  question: '« Parce que des témoignages se contredisent. Et parce que vous avez le droit de les examiner. »',
  sit: 'Un murmure traverse les bancs. « Vous pouvez rester assis. Le silence et le refus ne valent pas aveu. »',
  object: '« Votre objection est reçue. Ces griefs sont préliminaires, et la preuve reste à établir. »',
  proof: '« Les dossiers sont composés de témoignages, d’archives et de reconstitutions. Leur sélection peut être contestée. »',
  silent: '« Le silence est consigné. Il ne vaut pas aveu. »',
};
const labels: Record<Choice,string> = {
  rise:'Se lever',question:'Pourquoi suis-je ici ?',sit:'Rester assis',object:'Contester les accusations',proof:'Exiger la provenance des pièces',silent:'Garder le silence'
};
function Box({at,size,color='#30201b'}:{at:[number,number,number],size:[number,number,number],color?:string}){
 return <mesh position={at} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.85}/></mesh>;
}
function CameraDirection({view}:{view:number}){
 const {camera}=useThree();
 useEffect(()=>{
  if(view===2){camera.position.set(0,1.75,5.35);camera.lookAt(0,2,9.5)}
  else if(view===1){camera.position.set(3.5,2.25,4.5);camera.lookAt(0,1.6,-6)}
  else {camera.position.set(0,1.75,5.6);camera.lookAt(0,1.5,-8)}
  camera.updateProjectionMatrix();
 },[camera,view]);
 return null;
}
function Court({view}:{view:number}){
 return <Canvas shadows dpr={[1,1.5]} camera={{position:view===1?[3.5,2.25,4.5]:view===2?[0,2.2,6]:[0,1.75,5.6],fov:64}} gl={{antialias:true,powerPreference:'low-power'}} style={{position:'absolute',inset:0}}>
  <CameraDirection view={view}/><color attach="background" args={['#100c0c']}/><fog attach="fog" args={['#130e10',9,24]}/>
  <ambientLight intensity={0.48}/><hemisphereLight args={['#ad7782','#24130f',0.85]}/>
  <spotLight position={[0,7,-5]} intensity={25} angle={0.8} penumbra={0.8} castShadow color="#ffb5a0"/>
  <pointLight position={[-5,3,-3]} color="#b31c34" intensity={22} distance={13}/>
  <pointLight position={[5,3,-1]} color="#e14843" intensity={12} distance={11}/>
  <Box at={[0,-0.12,-2]} size={[15,0.2,21]} color="#39221e"/>
  <Box at={[0,5,-4]} size={[15,0.25,17]} color="#1a1316"/>
  <Box at={[0,2,-12]} size={[15,5,0.4]} color="#351a22"/>
  <Box at={[-7,2,-3]} size={[0.3,5,19]} color="#29151c"/>
  <Box at={[7,2,-3]} size={[0.3,5,19]} color="#29151c"/>
  {[-5,-2.5,0,2.5,5].map((x)=><group key={x}><Box at={[x,2.4,-11.7]} size={[0.14,4.6,0.18]} color="#6a292b"/><Box at={[x,4.4,-11.6]} size={[1.8,0.16,0.2]} color="#8d3539"/></group>)}
  {/* Double porte monumentale derrière le box : perspective retournée. */}
  <Box at={[0,2.65,8.1]} size={[5.4,5.4,0.6]} color="#1d1213"/>
  <Box at={[0,2.5,7.72]} size={[4.45,4.8,0.2]} color="#6d3c30"/>
  <Box at={[-1.06,2.45,7.55]} size={[2.04,4.52,0.15]} color="#41251f"/>
  <Box at={[1.06,2.45,7.55]} size={[2.04,4.52,0.15]} color="#41251f"/>
  {[-1,1].map(side=><group key={'door-'+side}>
   <Box at={[side*1.06,2.45,7.43]} size={[1.77,4.17,0.09]} color="#79503d"/>
   {[1.2,2.8,3.9].map((y,i)=><group key={i}><Box at={[side*1.06,y,7.34]} size={[1.55,i===1?1.25:0.65,0.08]} color="#2e1c1b"/><Box at={[side*1.06,y,7.28]} size={[1.3,i===1?1.03:0.44,0.07]} color="#56352a"/></group>)}
   <mesh position={[side*0.25,2.35,7.23]}><sphereGeometry args={[0.085,12,10]}/><meshStandardMaterial color="#d0a66d" metalness={0.8} roughness={0.25}/></mesh>
  </group>)}
  <Box at={[0,2.5,7.26]} size={[0.045,4.3,0.04]} color="#c54a3c"/>
  <Box at={[0,5.3,7.65]} size={[5.9,0.45,0.75]} color="#3c2425"/>
  <Box at={[-2.65,2.6,7.6]} size={[0.4,5.3,0.75]} color="#3c2425"/>
  <Box at={[2.65,2.6,7.6]} size={[0.4,5.3,0.75]} color="#3c2425"/>
  <pointLight position={[0,3,7]} color="#bc2836" intensity={7} distance={6}/>
  <pointLight position={[0,2.8,9]} color="#e33b3c" intensity={14} distance={7}/>
  {/* Verticales, panneaux et appliques pour rompre l'aspect géométrique nu. */}
  {[-6.3,-4.6,4.6,6.3].map(x=><group key={'column'+x}><Box at={[x,2.45,-6]} size={[0.45,4.9,0.65]} color="#53322c"/><Box at={[x,4.7,-6]} size={[0.72,0.3,0.85]} color="#795044"/></group>)}
  {[-1,1].map(side=><group key={'sconce'+side}><Box at={[side*6.72,2.75,-2]} size={[0.2,0.7,0.35]} color="#9b6952"/><pointLight position={[side*6.4,2.8,-2]} color="#e48a66" intensity={5} distance={5}/></group>)}
  <Box at={[0,0.5,-8.5]} size={[8,1,2]} color="#513027"/>
  <Box at={[0,1.65,-9.4]} size={[5,1.3,1.3]} color="#6a3b2f"/>
  <Box at={[0,2.1,-9.1]} size={[1.3,0.14,0.7]} color="#b18b6e"/>
  <Box at={[0,2.85,-9.8]} size={[1.2,1.5,0.16]} color="#311c1a"/>
  <Box at={[3.7,0.65,-6.7]} size={[1.8,1.3,1.2]} color="#57372c"/>
  <Box at={[3.7,1.5,-7]} size={[0.75,0.1,0.55]} color="#a27b60"/>
  <Box at={[-3.7,0.65,-6.7]} size={[1.8,1.3,1.2]} color="#57372c"/>
  <Box at={[0,0.45,3.7]} size={[3.1,0.9,0.22]} color="#7d4a37"/>
  <Box at={[-1.45,0.75,4.2]} size={[0.16,1.5,1.6]} color="#8c523d"/>
  <Box at={[1.45,0.75,4.2]} size={[0.16,1.5,1.6]} color="#8c523d"/>
  {[-1,1].map(side=>[0,1,2].map(i=><group key={side+'-'+i}><Box at={[side*4.5,0.45,1.2+i*1.8]} size={[3.3,0.26,0.9]} color="#5c392e"/><Box at={[side*4.5,0.9,1.65+i*1.8]} size={[3.3,0.9,0.18]} color="#452a26"/></group>))}
  {[-1,1].map(side=>[0,1,2,3].map(i=><group key={'p'+side+i}><mesh position={[side*(3.7+(i%2)*0.8),1.2,1.2+Math.floor(i/2)*1.8]}><sphereGeometry args={[0.18,10,8]}/><meshStandardMaterial color={i%2?'#6d5b57':'#9c8177'}/></mesh><Box at={[side*(3.7+(i%2)*0.8),0.82,1.2+Math.floor(i/2)*1.8]} size={[0.44,0.65,0.3]} color="#24232a"/></group>))}
  <mesh position={[3.7,2.2,-7]}><sphereGeometry args={[0.22,16,12]}/><meshStandardMaterial color="#b89a8a"/></mesh>
  <Box at={[3.7,1.72,-7]} size={[0.55,0.78,0.35]} color="#202128"/>
  <mesh position={[0,0.015,-2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.6,17]}/><meshStandardMaterial color="#49252a" roughness={1}/></mesh>
 </Canvas>
}
function murmur(ctx:AudioContext){
 const duration=3.5;const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);const a=buffer.getChannelData(0);let last=0;
 for(let i=0;i<a.length;i++){last=last*0.985+(Math.random()*2-1)*0.015;a[i]=last*0.6*Math.min(1,i/3000,(a.length-i)/15000)}
 const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=550;
 const gain=ctx.createGain();gain.gain.value=0.15;source.connect(filter).connect(gain).connect(ctx.destination);source.start();return {source,gain};
}
export default function TribunalPreview(){
 const [step,setStep]=useState(0);const [view,setView]=useState(0);const [alias,setAlias]=useState('');const [muted,setMuted]=useState(false);const [chosen,setChosen]=useState<Choice|null>(null);const [reduced,setReduced]=useState(false);
 const audio=useRef<{ctx:AudioContext,source:AudioBufferSourceNode,gain:GainNode}|null>(null);
 useEffect(()=>{try{const saved=localStorage.getItem('law-tribunal-preview');if(saved){const x=JSON.parse(saved);setAlias(x.alias||'');setStep(x.step||0);setChosen(x.chosen||null)}}catch{}return()=>{audio.current?.source.stop();void audio.current?.ctx.close()}},[]);
 useEffect(()=>{if(step>0)localStorage.setItem('law-tribunal-preview',JSON.stringify({alias,step,chosen}))},[alias,step,chosen]);
 function enter(){const name=alias.trim().slice(0,32)||'L’Accusé';setAlias(name);setStep(1);try{const ctx=new AudioContext();void ctx.resume();const m=murmur(ctx);audio.current={ctx,...m};const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(90,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(38,ctx.currentTime+0.6);g.gain.setValueAtTime(0.18,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.8);osc.connect(g).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.8)}catch{}}
 function advance(){if(step===1){setStep(2);if(audio.current)audio.current.gain.gain.setTargetAtTime(0.025,audio.current.ctx.currentTime,0.35)}else if(step===2)setStep(3);else if(step===4)setStep(5)}
 function choose(c:Choice){setChosen(c);setStep(step===2?3:4)}
 const button={background:'#201719',border:'1px solid #a36b70',color:'#f3e5df',padding:'13px 18px',cursor:'pointer',font:'inherit',minHeight:46} as const;
 return <main style={{minHeight:'100dvh',background:'#080709',color:'#efe5df',fontFamily:'Georgia,serif'}}>
 <header style={{display:'flex',justifyContent:'space-between',gap:12,padding:'14px 20px',alignItems:'center',fontFamily:'monospace',fontSize:12,letterSpacing:2,flexWrap:'wrap'}}><Link href="/" style={{color:'inherit'}}>THE LAW: REBIRTH</Link><span>PROTOTYPE DU TRIBUNAL · NON CANONIQUE</span><button style={button} onClick={()=>{setMuted(!muted);if(audio.current)audio.current.gain.gain.value=muted?0.1:0}}>{muted?'Réactiver le son':'Couper le son'}</button></header>
 <div style={{position:'relative',height:'min(65dvh,680px)',minHeight:320,overflow:'hidden',borderTop:'1px solid #512329',borderBottom:'1px solid #512329'}}>
 <Court view={view}/>
 <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(0deg,rgba(4,3,4,.82),transparent 42%,rgba(4,3,4,.4))'}}/>
 {step===0?<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(5,3,5,.75)',padding:20}}><section style={{maxWidth:520,textAlign:'center'}}><p style={{color:'#dd8890',letterSpacing:4}}>CONVOCATION</p><h1 style={{fontSize:'clamp(30px,5vw,58px)'}}>VOUS AVEZ ÉTÉ CONVOQUÉ.</h1><p>La salle vous attend. Le nom que vous choisirez sera porté au registre.</p><label style={{display:'block',margin:'20px 0'}}>Votre pseudonyme <input aria-label="Votre pseudonyme" maxLength={32} value={alias} onChange={e=>setAlias(e.target.value)} style={{display:'block',width:'100%',padding:14,marginTop:10,background:'#161115',border:'1px solid #9e5963',color:'white',fontSize:18}}/></label><button style={button} onClick={enter}>ENTRER DANS LE TRIBUNAL</button></section></div>:null}
 {step>0?<div style={{position:'absolute',top:14,left:14,right:14,display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><span style={{background:'#160c12dd',padding:10}}>ACCUSÉ : {alias}</span><div style={{display:'flex',gap:8}}><button style={button} onClick={()=>setView((view+1)%3)}>Regarder autour / vers la porte</button><button style={button} onClick={()=>setReduced(!reduced)}>{reduced?'Mouvement normal':'Réduire les mouvements'}</button></div></div>:null}
 {step>0?<div aria-live="polite" style={{position:'absolute',bottom:12,left:'max(12px,5%)',right:'max(12px,5%)',background:'#0a080be8',borderLeft:'3px solid #a73243',padding:'14px 18px',maxWidth:900,margin:'auto',maxHeight:'54%',overflowY:'auto'}}>
 <div style={{color:'#d99ba0',fontFamily:'monospace',fontSize:12,marginBottom:10}}>LE GREFFIER · AUDIENCE PRÉLIMINAIRE</div>
 {step===1?<><p>« Que l’accusé se lève. »</p><p>Les murmures s’éteignent. L’estrade demeure vide.</p><button style={button} onClick={advance}>Écouter le Greffier</button></>:null}
 {step===2?<><p>« {alias}, vous avez été convoqué sous ce nom. Vos déclarations seront consignées. »</p><p>« Rien de ce qui suit ne vaut condamnation. »</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['rise','question','sit'] as Choice[]).map(c=><button key={c} style={button} onClick={()=>choose(c)}>{labels[c]}</button>)}</div></>:null}
 {step===3?<><p>{chosen?replies[chosen]:'Le Greffier consulte le registre.'}</p><p>« Premier chef : avoir contribué à conserver une version des faits susceptible d’être contredite. Deuxième chef : avoir pris une décision dont les conséquences sur une personne absente n’étaient pas entièrement connues. Troisième chef : avoir soutenu une certitude fondée sur des pièces contestables. »</p><p>« Ce sont des allégations à examiner. Pas des faits établis. »</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['object','proof','silent'] as Choice[]).map(c=><button key={c} style={button} onClick={()=>choose(c)}>{labels[c]}</button>)}</div></>:null}
 {step===4?<><p>{chosen?replies[chosen]:''}</p><p>« Nous n’allons pas vous demander ce que vous auriez fait. Nous allons vous donner l’occasion de le faire. »</p><button style={button} onClick={advance}>Examiner le premier dossier</button></>:null}
 {step===5?<><p>« DOSSIER I — LA SIXIÈME PLACE. Cinq personnes. Six couverts. Une histoire que personne ne souhaite raconter. »</p><Link href="/jouer/sixieme-place" style={{...button,display:'inline-block',textDecoration:'none'}}>Entrer dans la reconstitution</Link><button style={{...button,marginLeft:8}} onClick={()=>{setStep(0);setChosen(null);localStorage.removeItem('law-tribunal-preview')}}>Recommencer la démo</button></>:null}
 </div>:null}
 </div><footer style={{padding:'16px 20px',fontFamily:'system-ui',fontSize:13,color:'#bfa7a6'}}>Prévisualisation artistique isolée : géométrie WebGL originale, son de foule synthétique et interactions de démonstration. Le pseudo est sauvegardé localement pour cette démo ; il n’est pas encore connecté au système d’inscription du jeu. Les accusations et les choix ne modifient pas les sauvegardes officielles.</footer>
 </main>
}
