import {clamp} from "./atelier.js";

export function controls(canvas,action){
  const keys=new Set(),pointers=new Map(),stick={x:0,y:0};
  const command={KeyE:"use",KeyF:"board",KeyQ:"dial",KeyR:"chapter",KeyG:"fly",KeyT:"light",Space:"power"};
  const driveKeys=["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","ShiftLeft","ShiftRight","KeyC","ControlLeft","ControlRight"];
  let lastTap=0,timer=0,gesture=null;
  function reset(){keys.clear();pointers.clear();stick.x=0;stick.y=0;gesture=null;lastTap=0;clearTimeout(timer);}
  window.addEventListener("blur",reset);document.addEventListener("visibilitychange",()=>{if(document.hidden)reset();});
  window.addEventListener("keydown",e=>{
    if(e.metaKey||e.altKey||e.ctrlKey&&e.code!=="ControlLeft"&&e.code!=="ControlRight")return;
    if(!command[e.code]&&!driveKeys.includes(e.code))return;
    e.preventDefault();keys.add(e.code);if(!e.repeat&&command[e.code])action(command[e.code]);
  });
  window.addEventListener("keyup",e=>keys.delete(e.code));
  function dist(){const [a,b]=pointers.values();return Math.hypot(a.x-b.x,a.y-b.y);}
  canvas.addEventListener("pointerdown",e=>{
    canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    const touch=e.pointerType!=="mouse";
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY,time:performance.now(),touch,move:touch&&e.clientX<canvas.clientWidth*.43,drift:0,inChord:false});
    if(touch&&pointers.size===2){
      const [a,b]=pointers.values();gesture={start:performance.now(),distance:dist(),moved:a.drift>9||b.drift>9,ended:0};
      a.inChord=b.inChord=true;
    }
  });
  canvas.addEventListener("pointermove",e=>{
    const p=pointers.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    p.drift=Math.max(p.drift,Math.hypot(p.x-p.ox,p.y-p.oy));
    if(gesture&&pointers.size===2){
      const gap=dist();if(Math.abs(gap-gesture.distance)>1.5)action("zoom",(gesture.distance-gap)*.009);
      gesture.distance=gap;gesture.moved ||= p.drift>10;
    }
    if(p.move){stick.x=clamp((p.x-p.ox)/52,-1,1);stick.y=clamp((p.oy-p.y)/52,-1,1);}
    else action("look",dx,dy);
  });
  function release(e,cancelled){
    const p=pointers.get(e.pointerId);if(!p)return;pointers.delete(e.pointerId);
    if(p.move){stick.x=0;stick.y=0;}
    const now=performance.now();
    if(p.inChord){
      if(gesture){gesture.moved ||= cancelled||p.drift>10;gesture.ended++;
        if(gesture.ended===2){if(!gesture.moved&&now-gesture.start<440)action("chord");gesture=null;}}
      return;
    }
    if(cancelled||p.move||!p.touch||p.drift>10)return;
    if(now-p.time>480){action("dial");return;}
    if(now-lastTap<300){clearTimeout(timer);lastTap=0;action("board");}
    else{lastTap=now;timer=setTimeout(()=>{action("use");lastTap=0;},300);}
  }
  canvas.addEventListener("pointerup",e=>release(e,false));canvas.addEventListener("pointercancel",e=>release(e,true));
  canvas.addEventListener("lostpointercapture",e=>{if(pointers.has(e.pointerId))release(e,true);});
  canvas.addEventListener("wheel",e=>{e.preventDefault();action("zoom",e.deltaY*.001);},{passive:false});
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  const held=(a,b)=>Number(keys.has(a)||keys.has(b));
  return {get forward(){return clamp(held("KeyW","ArrowUp")-held("KeyS","ArrowDown")+stick.y,-1,1);},
    get side(){return clamp(held("KeyD","ArrowRight")-held("KeyA","ArrowLeft")+stick.x,-1,1);},
    get fast(){return keys.has("ShiftLeft")||keys.has("ShiftRight");},
    get rise(){return Number(keys.has("Space"))-Number(keys.has("KeyC")||keys.has("ControlLeft")||keys.has("ControlRight"));}};
}

export function mechanicalSound(canvas){
  let ctx;
  function enable(){
    if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)ctx=new Audio();}
    if(ctx?.state==="suspended")ctx.resume().catch(()=>{});
  }
  canvas.addEventListener("pointerdown",enable,{once:true});window.addEventListener("keydown",enable,{once:true,capture:true});
  function tone(from,to,duration,volume,wave="sine",delay=0){
    if(ctx?.state!=="running")return;
    const start=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,start+duration);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain).connect(ctx.destination);
    osc.start(start);osc.stop(start+duration+.01);
  }
  return {step(){tone(108,39,.27,.065,"triangle");tone(347,117,.11,.019,"sine",.035);},
    dial(slot){tone(376+slot*67,361+slot*67,.35,.044);tone(774+slot*97,742+slot*97,.23,.018,"sine",.026);},
    fire(){tone(150,72,.39,.03,"triangle");},door(){tone(176,90,.25,.034,"triangle");}};
}
