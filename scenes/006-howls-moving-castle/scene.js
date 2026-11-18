import {T,clamp,mix} from "./atelier.js";
import {buildCastle} from "./castle.js";
import {geography,buildLandscape} from "./landscape.js";
import {landmarks} from "./places.js";
import {atmosphere,engineSmoke} from "./weather.js";
import {hearthRoom,oldDoors,newDoors} from "./hearth.js";
import {controls,mechanicalSound} from "./controls.js";
import {howl as card} from "./parameters.js";

const design=card.design,canvas=document.querySelector("canvas");
const params=new URLSearchParams(location.search),still=params.has("still");
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const world=new T.Scene(),geo=geography(design),land=buildLandscape(geo),sites=landmarks(geo);
const castle=buildCastle(card),weather=atmosphere(world),smoke=engineSmoke(castle),room=hearthRoom(design);
world.add(land.root,sites.root,castle.root,smoke.points);
const camera=new T.PerspectiveCamera(43,1,.13,6400),target=new T.Vector3(),eye=new T.Vector3();
const walk={x:0,y:0,z:0,yaw:0,pitch:0},orbit={yaw:.65,pitch:-.08,radius:82};
const drive={x:0,z:0,yaw:-.11,speed:0,phase:.7,alt:0,wantedAlt:0,power:0,motion:0,lastDryX:0,lastDryZ:0};
const moods=["day","gold","dusk","night"];
let mode="drive",place="waste",lighting=0,clock=0,footTime=0,footstep=0,previous=0,frame=0;
let input,sound,smokeFresh=true,crossing=0,passage=null,previewPlace="";
const previewCamera=new T.PerspectiveCamera(64,320/512,.13,6400);
const portalTarget=new T.WebGLRenderTarget(320,512,{depthBuffer:true,stencilBuffer:false});
portalTarget.texture.colorSpace=T.SRGBColorSpace;
room.doorOpening(0,portalTarget.texture);
const idle=job=>window.requestIdleCallback?window.requestIdleCallback(job,{timeout:650}):setTimeout(job,30);
let roomPrepared=false,harborPrepared=false,entryPreviewQueued=false,portalTime=-1;
let portalFrame=-1,portalDraws=0,portalTriangles=0;
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const start=params.get("place")||"castle";
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<650?1.35:1.55));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize);resize();
function setMode(value,id){mode=value;place=id;canvas.dataset.mode=value;canvas.dataset.place=id;}
function setWalker(x,z,yaw,pitch=0,level=null){
  walk.x=x;walk.z=z;walk.yaw=yaw;walk.pitch=pitch;
  walk.y=level??sites.ground(x,z);footTime=0;
}
function outsideFloor(x,z){
  const terrain=sites.ground(x,z);
  if(drive.alt>.5||Math.hypot(x-drive.x,z-drive.z)>55)return terrain;
  return Math.max(terrain,castle.gangway.floorAt(x,z)??terrain);
}
function standByCastle(landing=false){
  const at=landing?castle.gangway.landing():castle.gangway.approach();
  sites.activate(at.x,at.z);
  if(sites.blocked(at.x,at.z,.27)){
    const sill=castle.gangway.sill();setWalker(sill.x,sill.z,sill.yaw,.026,sill.y);
  }else setWalker(at.x,at.z,at.yaw-(landing?.54:0),landing?.19:.35,outsideFloor(at.x,at.z));
  setMode("walk","waste");
}
function outside(id){
  if(id==="waste"){
    standByCastle();
  }else{
    const a=sites.arrival(id);sites.activate(a.x,a.z);setWalker(a.x,a.z,a.yaw,id==="palace"?.13:id==="front"?.21:id==="memory"?.11:.015);
  }
  setMode("walk",id);
}
function enterRoom(from,atDoor=false,upstairs=false){
  drive.speed=0;drive.motion=0;passage=null;previewPlace="";entryPreviewQueued=false;room.doorOpening(0);
  if(["market","meadow"].includes(from))room.chapter(true);
  if(["harbor","palace"].includes(from))room.chapter(false);
  const id=(room.later?newDoors:oldDoors).indexOf(from);if(id>=0)room.select(id);
  setMode("room",upstairs?"bedroom":"hearth");
  if(upstairs)setWalker(-1.80,-.48,1.13,.02,3.50);
  else if(atDoor)setWalker(3.28,-.53,-1.74,0,0);
  else setWalker(2.55,1.84,-.90,-.035,0);
  crossing=.52;
  sound?.door();
}
function takeHelm(){
  passage=null;room.doorOpening(0);setMode("drive",castle.flying?"flight":"waste");sites.activate(drive.x,drive.z);
}
function landable(x,z){
  if(sites.blocked(x,z,10.5))return false;
  for(const [dx,dz] of [[8,0],[-8,0],[0,9],[0,-9]])if(geo.wet(x+dx,z+dz))return false;
  return true;
}
function lowerToGround(){
  if(!landable(drive.x,drive.z)){drive.x=drive.lastDryX;drive.z=drive.lastDryZ;smokeFresh=true;}
  castle.form(false);drive.wantedAlt=0;
}
function board(){
  if(mode==="room"){takeHelm();return;}
  if(mode==="drive"){
    if(castle.flying||drive.alt>1){lowerToGround();drive.alt=0;}
    drive.speed=0;drive.motion=0;outside("waste");return;
  }
  const foot=castle.gangway.approach();
  if(Math.hypot(walk.x-drive.x,walk.z-drive.z)<castle.scale*13.2||
     Math.hypot(walk.x-foot.x,walk.z-foot.z)<3.0||castle.gangway.floorAt(walk.x,walk.z)!==null)takeHelm();
}
function nearCastleDoor(){
  const sill=castle.gangway.sill();
  return Math.hypot(walk.x-sill.x,walk.z-sill.z)<2.15&&Math.abs(walk.y-sill.y)<.62;
}
function thresholdView(id){
  const a=id==="waste"?castle.gangway.approach():sites.arrival(id);
  if(previewPlace!==id){sites.activate(a.x,a.z);land.update(new T.Vector3(a.x,0,a.z),clock);previewPlace=id;}
  const dist=Math.max(.17,5.21-walk.x),lateral=walk.z+.72,height=design.eyeHeightM+walk.y;
  const f=Math.sin(a.yaw),g=-Math.cos(a.yaw),ex=a.x-f*dist-g*lateral,ez=a.z-g*dist+f*lateral;
  const y=sites.ground(a.x,a.z)+height,near=dist+.014,ratio=near/dist;
  previewCamera.position.set(ex,y,ez);previewCamera.lookAt(ex+f,y,ez+g);
  previewCamera.projectionMatrix.makePerspective((-.74-lateral)*ratio,(.74-lateral)*ratio,(2.425-height)*ratio,(.055-height)*ratio,near,6400);
  previewCamera.projectionMatrixInverse.copy(previewCamera.projectionMatrix).invert();sites.update(clock);
  weather.update(previewCamera,previewCamera.position,clock,id==="front"||id==="memory"?id:moods[lighting],false);
  smoke.points.visible=previewCamera.position.distanceTo(castle.root.position)<410;
  renderer.setRenderTarget(portalTarget);renderer.render(world,previewCamera);
  portalFrame=frame;portalDraws=renderer.info.render.calls;portalTriangles=renderer.info.render.triangles;
  renderer.setRenderTarget(null);portalTime=clock;
}
function prepareAlongRoute(){
  if(still)return;
  if(!roomPrepared&&frame>8){
    roomPrepared=true;if(mode!=="room")idle(()=>{renderer.compileAsync(room.scene,camera);});
  }
  if(!harborPrepared&&(mode==="room"||mode==="walk"&&place==="waste")){
    harborPrepared=true;idle(()=>{
      const harbor=sites.prepare("harbor");
      renderer.setRenderTarget(portalTarget);renderer.compileAsync(harbor,previewCamera,world);renderer.setRenderTarget(null);
      renderer.compileAsync(harbor,previewCamera,world);
    });
  }
  if(mode==="room"&&!room.later&&!entryPreviewQueued){
    entryPreviewQueued=true;idle(()=>{if(mode==="room"&&!passage&&!previewPlace)thresholdView("harbor");});
  }
}
function use(){
  if(mode==="drive"){enterRoom("waste");return;}
  if(mode==="room"){
    if(walk.y<1&&Math.hypot(walk.x+1.97,walk.z+3.20)<2.42){room.stoke();sound.fire();return;}
    if(walk.y<1&&Math.hypot(walk.x-4.95,walk.z+.72)<3.0){
      if(passage){if(walk.x<4.50){passage.closing=!passage.closing;sound.door();}}
      else{sound.door();passage={to:room.destination,elapsed:0,closing:false};portalTime=-1;}
    }
    return;
  }
  if(nearCastleDoor()&&drive.alt<2.0){enterRoom("waste");return;}
  const district=geo.district(walk.x,walk.z);
  if(district!=="waste"){
    const [x,z]=sites.door(district);
    if(Math.hypot(walk.x-x,walk.z-z)<3.65){enterRoom(district,true);return;}
  }
  if(district==="meadow"||district==="memory"){
    const [x,z]=geo.places[district];
    if(Math.hypot(walk.x-x,walk.z-z-2)<4.5){outside(district==="meadow"?"memory":"meadow");sound.dial(3);}
  }
}
function action(key,a,b){
  switch(key){
    case "look":
      if(mode==="drive"){orbit.yaw-=a*.006;orbit.pitch=clamp(orbit.pitch+b*.005,-.25,1.14);}
      else{walk.yaw-=a*.0042;walk.pitch=clamp(walk.pitch-b*.004,-1.17,1.16);}
      break;
    case "zoom":if(mode==="drive")orbit.radius=clamp(orbit.radius*Math.exp(a),36,163);break;
    case "board":board();break;
    case "use":use();break;
    case "dial":
      if(mode==="room"&&!passage){
        room.turn();sound.dial(room.slot);
      }break;
    case "chapter":
      if(mode==="room"&&!passage){room.chapter();sound.dial(room.slot);}
      break;
    case "chord":if(mode==="room")action("chapter");else if(mode==="drive")action("fly");else action("light");break;
    case "fly":
      if(mode==="drive"){
        if(castle.flying)lowerToGround();
        else{castle.form(true);drive.wantedAlt=53;room.chapter(true);}
        place=castle.flying?"flight":"waste";canvas.dataset.place=place;
      }break;
    case "power":if(mode==="drive"){drive.power=1;sound.fire();}break;
    case "light":lighting=(lighting+1)%moods.length;break;
  }
}
input=controls(canvas,action);sound=mechanicalSound(canvas);
function stepCastle(dt){
  const active=mode==="drive",thrust=active?input.forward:0,turn=active?input.side:0;
  drive.power=Math.max(0,drive.power-dt*.43);
  const pace=castle.flying?(input.fast?40:24):input.fast?17.5:10.2;
  const desired=thrust*(pace+drive.power*3.7)*(thrust<0?.64:1);
  drive.speed=mix(drive.speed,desired,1-Math.exp(-dt*(thrust?2.7:4.9)));
  const dyaw=-turn*dt*(castle.flying?.67:.83)*(thrust<-.01?-.8:1);
  drive.yaw+=dyaw;orbit.yaw+=dyaw;
  const nx=drive.x+Math.sin(drive.yaw)*drive.speed*dt,nz=drive.z+Math.cos(drive.yaw)*drive.speed*dt;
  const canFly=castle.flying&&drive.alt>24;
  if(Math.abs(nx)<geo.extent-22&&Math.abs(nz)<geo.extent-22&&(canFly||landable(nx,nz))){
    drive.x=nx;drive.z=nz;if(!castle.flying&&drive.alt<1){drive.lastDryX=nx;drive.lastDryZ=nz;}
  }else drive.speed=0;
  if(castle.flying&&active)drive.wantedAlt=clamp(drive.wantedAlt+input.rise*dt*13,31,157);
  drive.alt=mix(drive.alt,drive.wantedAlt,1-Math.exp(-dt*1.1));
  const amount=clamp(Math.abs(drive.speed)/7+Math.abs(turn)*.63,0,1);
  drive.motion=mix(drive.motion,amount,1-Math.exp(-dt*6));
  if(Math.abs(drive.speed)>.07||turn||thrust)drive.phase+=dt*Math.max(2.4,Math.abs(drive.speed)*.68+Math.abs(turn)*6.0);
  const halfStep=Math.floor(drive.phase/Math.PI);
  if(halfStep!==footstep&&mode==="drive"&&!castle.flying&&drive.motion>.27)sound.step();
  footstep=halfStep;
  castle.root.rotation.y=drive.yaw;
  castle.root.position.set(drive.x,geo.height(drive.x,drive.z)+drive.alt,drive.z);
  castle.pose(clock,drive.phase,drive.motion,geo.height,clamp(drive.alt/25,0,1));
}
function stepWalker(dt){
  const f=input.forward,s=input.side,mag=Math.max(1,Math.hypot(f,s));
  const v=mode==="room"?(input.fast?3.5:2.6):(input.fast?8.4:4.0);
  const dx=(Math.sin(walk.yaw)*f+Math.cos(walk.yaw)*s)/mag*v*dt;
  const dz=(-Math.cos(walk.yaw)*f+Math.sin(walk.yaw)*s)/mag*v*dt;
  function accept(x,z){
    if(mode==="room")return room.canWalk(x,z,walk.y,passage?.elapsed>.46)&&Math.abs(room.floor(x,z,walk.y)-walk.y)<.46;
    const sy=Math.sin(drive.yaw),cy=Math.cos(drive.yaw),a=x-drive.x,b=z-drive.z;
    const localX=(a*cy-b*sy)/castle.scale,localZ=(a*sy+b*cy)/castle.scale;
    const y=outsideFloor(x,z),localY=(y-castle.root.position.y)/castle.scale;
    if(drive.alt<2&&Math.abs(localX)<4.2&&Math.abs(localZ)<4.5)return false;
    if(drive.alt<2&&castle.gear.obstructs(localX,localY,localZ))return false;
    return !sites.blocked(x,z,.23)&&Math.abs(y-walk.y)<Math.max(.58,Math.hypot(dx,dz)*1.05);
  }
  if(dx&&accept(walk.x+dx,walk.z))walk.x+=dx;
  if(dz&&accept(walk.x,walk.z+dz))walk.z+=dz;
  walk.y=mode==="room"?room.floor(walk.x,walk.z,walk.y):outsideFloor(walk.x,walk.z);
  footTime+=Math.hypot(dx,dz);
  const next=mode==="room"?(walk.y>2.9?"bedroom":"hearth"):geo.district(walk.x,walk.z);
  if(next!==place){place=next;canvas.dataset.place=next;}
}
function fitCamera(){
  if(mode==="drive"){
    const fov=43,portrait=Math.max(1,1.04/camera.aspect),distance=orbit.radius*portrait;
    const focusY=castle.root.position.y+design.walkingHeightM*.46;
    target.set(drive.x+4.6*Math.cos(orbit.yaw),focusY,drive.z-4.6*Math.sin(orbit.yaw));
    eye.set(target.x+Math.sin(orbit.yaw)*Math.cos(orbit.pitch)*distance,
      target.y+Math.sin(orbit.pitch)*distance,target.z+Math.cos(orbit.yaw)*Math.cos(orbit.pitch)*distance);
    eye.y=Math.max(eye.y,geo.height(eye.x,eye.z)+1.55);camera.position.copy(eye);camera.lookAt(target);
    if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  }else{
    const bob=reduced?0:Math.sin(footTime*3.10)*.027;
    camera.position.set(walk.x,walk.y+design.eyeHeightM+bob,walk.z);
    target.set(walk.x+Math.sin(walk.yaw)*Math.cos(walk.pitch),camera.position.y+Math.sin(walk.pitch),walk.z-Math.cos(walk.yaw)*Math.cos(walk.pitch));
    camera.lookAt(target);if(camera.fov!==65){camera.fov=65;camera.updateProjectionMatrix();}
  }
}
function initial(){
  stepCastle(0);
  if(start==="flight"){castle.form(true);room.chapter(true);drive.wantedAlt=drive.alt=63;takeHelm();}
  else if(start==="approach"||start==="landing")standByCastle(start==="landing");
  else if(start==="hearth"||start==="bedroom")enterRoom("waste",false,start==="bedroom");
  else if(start==="waste"){
    const x=16,z=27;setWalker(x,z,Math.atan2(-x,z),.27);setMode("walk","waste");
  }else if(Object.hasOwn(geo.places,start))outside(start);
  else takeHelm();
}
function smoothPassage(value){return clamp(value,0,1);}
function render(stamp){
  const dt=previous?Math.min(.09,(stamp-previous)/1000):0;previous=stamp;clock+=dt;frame++;
  stepCastle(dt);
  if(passage){
    passage.elapsed=clamp(passage.elapsed+(passage.closing?-dt:dt),0,.58);
    room.doorOpening(smoothPassage(passage.elapsed/.58));
    if(passage.closing&&passage.elapsed===0)passage=null;
  }
  if(mode!=="drive")stepWalker(dt);
  if(mode==="room"&&passage&&!passage.closing&&walk.x>=5.07&&Math.abs(walk.z+.72)<.47){
    const destination=passage.to,turn=walk.yaw-Math.PI/2,pitch=walk.pitch;
    passage=null;outside(destination);walk.yaw+=turn;walk.pitch=pitch;crossing=.48;
  }
  fitCamera();
  crossing=Math.max(0,crossing-dt);
  if(crossing>0||canvas.style.filter)canvas.style.filter=crossing>0?"brightness("+(1-crossing*.42).toFixed(3)+")":"";
  if(mode==="room"){
    if(passage&&passage.elapsed>.04&&clock-portalTime>(walk.x>4.2?.065:.14))thresholdView(passage.to);
    room.update(clock,dt);renderer.render(room.scene,camera);
  }
  else{
    const focus=mode==="drive"?castle.root.position:camera.position;
    sites.activate(focus.x,focus.z);sites.update(clock);land.update(camera.position,clock);
    const area=geo.district(focus.x,focus.z),mood=area==="front"||area==="memory"?area:moods[lighting];
    weather.update(camera,focus,clock,mood,false);
    if(smokeFresh){smoke.reset();smokeFresh=false;}
    const close=camera.position.distanceTo(castle.root.position)<410;
    smoke.points.visible=close;
    if(close)smoke.update(dt,clock,canvas.height/(2*Math.tan(T.MathUtils.degToRad(camera.fov*.5))),drive.motion);
    renderer.render(world,camera);
  }
  canvas.dataset.ready="true";prepareAlongRoute();
  if(!still)requestAnimationFrame(render);
}
export function runningGear(){return castle.gear.diagnostics();}
export function tourState(){
  return {mode,place,frame,castle:{x:drive.x,z:drive.z,y:castle.root.position.y,heading:drive.yaw,speed:drive.speed,phase:drive.phase,flying:castle.flying,altitude:drive.alt},
    walker:{...walk},stairs:{lower:castle.gangway.approach(),platform:castle.gangway.landing(),door:castle.gangway.sill()},camera:camera.position.toArray(),dial:room.destination,doorTravel:passage?.elapsed??0,later:room.later,fire:room.flare,lighting:moods[lighting],
    draws:renderer.info.render.calls+(mode==="room"&&portalFrame===frame?portalDraws:0),
    triangles:renderer.info.render.triangles+(mode==="room"&&portalFrame===frame?portalTriangles:0)};
}
initial();requestAnimationFrame(render);
