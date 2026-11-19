import {giza} from "./parameters.js";
import {ground,toWorld} from "./plateau.js";
import {entranceZ,mouthX} from "./pyramid.js";
import {chamberView,coffer,galleryNorth,highFloor,interiorAt,routeFloor} from "./interior.js";
const T=globalThis.THREE;
const stops=["court","guardian","shrine","portal","gallery","chamber","plateau"];
export function walk(camera,canvas,court,canWalkOutside,changeSun,playback=false){
  const keys=new Set();
  const xy=new T.Vector2(), touch=new Map(),ray=new T.Raycaster();
  let yaw=0,pitch=0,foot=0,eye=1.67,place="court",checkpoint="court",phase=0,drag=null,stick=null,pair=null,lastTap=null;
  let blockMouseClick=false,lastTouchEnd=-Infinity;
  camera.rotation.order="YXZ";
  function surface(x,z){
    const interior=interiorAt(x,z);if(interior)return interior;
    if(x< -780||x>470||z< -892||z>477||Math.max(Math.abs(x),Math.abs(z))<giza.documented.base/2+.32)return null;
    if(Math.abs(x-mouthX)<2.46&&z<150&&z>entranceZ)return null;
    if(!canWalkOutside(x,z)||!court.canStand(x,z))return null;
    const paved=court.paving(x,z);return {floor:paved?.205:ground(x,z),eye:1.66,place:paved?"court":"plateau"};
  }
  function reset(){keys.clear();touch.clear();stick=null;drag=null;pair=null;lastTap=null;blockMouseClick=false;}
  function frame(){
    const portrait=camera.aspect<.86;
    camera.fov=checkpoint==="guardian"?(portrait?48:39):(portrait?65:57);
    camera.updateProjectionMatrix();
  }
  function pose(bob=0){camera.position.set(xy.x,foot+eye+bob,xy.y);camera.rotation.set(pitch,yaw,0,"YXZ");camera.updateMatrixWorld();}
  function moveTo(id){
    let at,look;
    function inCourt(x,z,y){const [a,b]=toWorld(x,z);return [a,y,b];}
    if(id==="court"){
      const aspect=canvas.clientWidth/canvas.clientHeight;
      const blend=T.MathUtils.smoothstep(aspect,.74,1.65);
      const across=(portrait,wide)=>T.MathUtils.lerp(portrait,wide,blend);
      at=inCourt(across(1.90,-2.55),across(16.8,15.0),0);
      look=inCourt(across(1.83,-4.30),across(-2.35,-2.60),across(8.00,8.61));
    }else if(id==="entry"){at=inCourt(4,39,0);look=inCourt(.5,-4,7);}
    else if(id==="guardian"){at=inCourt(-5.90,9.75,0);look=inCourt(3.00,-1.05,12.05);}
    else if(id==="shrine"){at=inCourt(-4.43,.94,0);look=court.target.toArray();}
    else if(id==="portal"){at=[mouthX,0,157];look=[mouthX,18.9,entranceZ-1];}
    else if(id==="gallery"){at=[mouthX,0,galleryNorth-2];look=[mouthX,routeFloor(galleryNorth-21)+3.35,galleryNorth-21];}
    else if(id==="chamber"){at=[chamberView.x,0,chamberView.z];look=[coffer.x+.12,highFloor+1.23,coffer.z];}
    else if(id==="plateau"){at=[305,0,42];look=[-160,43,-161];}
    else return;
    const s=surface(at[0],at[2]);if(!s)throw Error("Unreachable viewpoint "+id);
    reset();xy.set(at[0],at[2]);foot=s.floor;eye=s.eye;place=s.place;checkpoint=id;phase=0;
    yaw=Math.atan2(xy.x-look[0],xy.y-look[2]);pitch=Math.atan2(look[1]-foot-eye,Math.hypot(xy.x-look[0],xy.y-look[2]));
    frame();pose();document.body.dataset.place=place;document.body.dataset.view=id;
  }
  function cycle(){moveTo(stops[(stops.indexOf(checkpoint)+1)%stops.length]);}
  function act(clientX,clientY){
    if(camera.position.distanceTo(court.target)>6.70)return false;
    if(clientX!==undefined){
      const r=canvas.getBoundingClientRect(), ndc=new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2);
      ray.setFromCamera(ndc,camera);
      if(ray.ray.distanceToPoint(court.target)>1.58||ray.ray.direction.dot(court.target.clone().sub(camera.position))<0)return false;
    }
    document.body.dataset.shrine=court.toggle()?"open":"closed";return true;
  }
  if(playback)return {moveTo,step,keys,look(y,p){yaw=y;pitch=p;}};
  const recognized=["KeyW","KeyS","KeyA","KeyD","ShiftLeft","ShiftRight","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","PageUp","PageDown"];
  window.addEventListener("keydown",e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const digit=/^(?:Digit|Numpad)([1-7])$/.exec(e.code);
    if(digit){if(!e.repeat)moveTo(stops[Number(digit[1])-1]);e.preventDefault();return;}
    if(["KeyE","KeyL","KeyM"].includes(e.code)){
      if(!e.repeat){if(e.code==="KeyE")act();if(e.code==="KeyL")changeSun();if(e.code==="KeyM")cycle();}
      e.preventDefault();return;
    }
    if(recognized.includes(e.code)){keys.add(e.code);e.preventDefault();}
  });
  window.addEventListener("keyup",e=>keys.delete(e.code));window.addEventListener("blur",reset);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)reset();});
  function contact(id,x,y,time){return {id,x,y,x0:x,y0:y,start:time,d:0};}
  function moveContact(a,x,y){
    const dx=x-a.x,dy=y-a.y;a.x=x;a.y=y;
    a.d=Math.max(a.d,Math.hypot(a.x-a.x0,a.y-a.y0));if(pair&&a.d>12)pair.ok=false;
    if(a===drag){yaw-=dx*.0041;pitch=T.MathUtils.clamp(pitch-dy*.0038,-1.34,1.44);pose();}
  }
  function tap(x,y,now,isTouch){
    if(act(x,y)){lastTap=null;return;}
    if(isTouch&&x>=canvas.clientWidth*.43){
      if(lastTap&&now-lastTap.t<460&&Math.hypot(x-lastTap.x,y-lastTap.y)<33){changeSun();lastTap=null;}
      else lastTap={t:now,x,y};
    }
  }
  canvas.addEventListener("pointerdown",e=>{
    if(e.pointerType==="touch"||e.button!==0)return;
    canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    blockMouseClick=false;drag=contact(e.pointerId,e.clientX,e.clientY,e.timeStamp);
  });
  canvas.addEventListener("pointermove",e=>{
    if(e.pointerType!=="touch"&&drag?.id===e.pointerId)moveContact(drag,e.clientX,e.clientY);
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(type,e=>{
    if(e.pointerType==="touch"||drag?.id!==e.pointerId)return;
    blockMouseClick=drag.d>10;drag=null;
  });
  canvas.addEventListener("click",e=>{
    if(blockMouseClick){blockMouseClick=false;return;}
    if(e.timeStamp-lastTouchEnd<400)return;
    tap(e.clientX,e.clientY,e.timeStamp,e.pointerType==="touch"||e.sourceCapabilities?.firesTouchEvents);
  });
  // Non-passive touch listeners keep multi-finger movement in the canvas on mobile browsers.
  canvas.addEventListener("touchstart",e=>{
    e.preventDefault();
    for(const t of e.changedTouches){
      const a=contact(t.identifier,t.clientX,t.clientY,e.timeStamp);
      touch.set(a.id,a);
      if(a.x<canvas.clientWidth*.43&&!stick)stick=a;else if(!drag)drag=a;
    }
    if(touch.size===2&&!pair)pair={ok:[...touch.values()].every(a=>a.d<10),start:e.timeStamp};
    if(touch.size>2&&pair)pair.ok=false;
  },{passive:false});
  canvas.addEventListener("touchmove",e=>{
    e.preventDefault();for(const t of e.changedTouches){const a=touch.get(t.identifier);if(a)moveContact(a,t.clientX,t.clientY);}
  },{passive:false});
  for(const type of ["touchend","touchcancel"])canvas.addEventListener(type,e=>{
    e.preventDefault();lastTouchEnd=e.timeStamp;
    const cancelled=type==="touchcancel";if(cancelled&&pair)pair.ok=false;
    for(const t of e.changedTouches){
      const a=touch.get(t.identifier);if(!a)continue;
      if(!pair&&!cancelled&&a.d<11&&e.timeStamp-a.start<470)tap(t.clientX,t.clientY,e.timeStamp,true);
      touch.delete(a.id);if(drag===a)drag=null;if(stick===a)stick=null;
    }
    if(pair&&!touch.size){const ok=pair.ok&&e.timeStamp-pair.start<600;pair=null;lastTap=null;if(ok)cycle();}
  },{passive:false});
  function step(dt,reduced){
    const down=k=>Number(keys.has(k));
    yaw+=(down("ArrowLeft")-down("ArrowRight"))*dt*1.4;pitch=T.MathUtils.clamp(pitch+(down("PageUp")-down("PageDown"))*dt,-1.34,1.44);
    let sx=down("KeyD")-down("KeyA"),fw=Number(keys.has("KeyW")||keys.has("ArrowUp"))-Number(keys.has("KeyS")||keys.has("ArrowDown"));
    if(stick){const dx=stick.x-stick.x0,dy=stick.y-stick.y0,k=Math.max(40,Math.hypot(dx,dy));sx+=dx/k;fw-=dy/k;}
    const len=Math.max(1,Math.hypot(sx,fw));
    const speed=(keys.has("ShiftLeft")||keys.has("ShiftRight")?11.2:4.6)*(place==="passage"?.62:1)*dt/len;
    const dx=(sx*Math.cos(yaw)-fw*Math.sin(yaw))*speed,dz=(-sx*Math.sin(yaw)-fw*Math.cos(yaw))*speed;
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));let walked=0;
    function travel(x,z){
      const s=surface(x,z);if(!s||Math.abs(s.floor-foot)>.43)return;
      walked+=Math.hypot(x-xy.x,z-xy.y);xy.set(x,z);foot=s.floor;eye=T.MathUtils.damp(eye,s.eye,11,Math.max(dt,.025));
      place=s.place;
    }
    for(let i=0;i<n;i++){if(dx)travel(xy.x+dx/n,xy.y);if(dz)travel(xy.x,xy.y+dz/n);}
    if(walked===0){const s=surface(xy.x,xy.y);if(s)eye=T.MathUtils.damp(eye,s.eye,10,dt);}
    phase+=walked*3.8;pose(reduced?0:Math.sin(phase)*.017*Math.min(walked*16,1));
    document.body.dataset.place=place;return place;
  }
  document.body.dataset.shrine="closed";
  const hash=()=>location.hash.slice(1);
  function enter(){moveTo(stops.includes(hash())?hash():"entry");}
  enter();window.addEventListener("hashchange",enter);
  return {step,frame};
}
