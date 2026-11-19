import {walk} from "../../walk.js";
import {toWorld,northRoad,ground} from "../../plateau.js";
import {mouthX as x} from "../../pyramid.js";
import {coffer,highFloor,galleryNorth} from "../../interior.js";
const T=globalThis.THREE;
export const fps=30;

// Rehearsed from the public-facing visitor controls. Every eye position is produced by
// the walking collision solver. Ellipses between distant waypoints are editorial cuts.
export function timeline(stage){
  const eye=stage.camera.clone(),visitor=walk(eye,stage.renderer.domElement,stage.court,stage.outside.passable,null,true);
  visitor.moveTo("entry");
  const legs={},frames=[],cuts=[];
  const world=(x,y,z)=>{const [wx,wz]=toWorld(x,z);return [wx,y,wz];};
  function reach(name,target){
    const samples=legs[name]??=[];
    visitor.keys.add("KeyW");
    for(let i=0;i<1700;i++){
      const dx=eye.position.x-target[0],dz=eye.position.z-target[1];
      if(Math.hypot(dx,dz)<.22)return;
      visitor.look(Math.atan2(dx,dz),0);
      const state=visitor.step(1/fps,false);
      samples.push({eye:eye.position.toArray(),state});
    }
    throw Error("Blocked visitor path near "+name+" "+eye.position.toArray().join(","));
  }
  for(const [name,target] of [
    ["approach",toWorld(2.5,27)],["court",toWorld(-.2,13)],
    ["shrine",toWorld(-4.43,.94)],["aisle",toWorld(-1.75,1.90)],["turn",toWorld(-2,-8)],
    ["court-exit",northRoad.at(0)]])reach(name,target);
  const drive=legs.road=[];
  for(let s=.85;s<northRoad.length+.85;s+=.85){
    const station=Math.min(s,northRoad.length),start=drive.length;
    reach("road",northRoad.at(station));
    for(let i=start;i<drive.length;i++)drive[i].station=station-.85+.85*(i-start+1)/(drive.length-start);
  }
  for(const [name,target] of [
    ["stairs",[x,116]],["entry",[x,74]],["gallery",[x,galleryNorth-4]],["climb",[x,4]],["ante",[x,-5]],
    ["room",[x,-8.55]],["stone",[3.15,-9.45]]])reach(name,target);

  const endOf=(name)=>legs[name].at(-1);
  function shot(name,path,n,aimFn,settings={}){
    cuts.push({id:name,start:frames.length});
    for(let i=0;i<n;i++){
      const t=i/(n-1),p=path[Math.min(i,path.length-1)];
      frames.push({id:name,space:"world",state:p.state,eye:p.eye,aim:aimFn(p.eye,t,p),door:0,light:0,fov:71,...settings});
    }
  }
  const gaze=(a,b)=>((_,t)=>a.map((n,i)=>T.MathUtils.lerp(n,b[i],t)));
  const ahead=(x,y,z)=>(p=>[p[0]+x,p[1]+y,p[2]+z]);
  const stick=(name)=>[endOf(name)];
  shot("pyramid-and-guardian",legs.approach,legs.approach.length,gaze(world(.5,7,-4),world(2,9,-2)),{fov:73});
  shot("look-up-at-anubis",legs.court,legs.court.length,gaze(world(2,9,-2),world(3.12,12,-1)),{fov:72});
  const doors=world(-4.93,1.59,-2.15);
  shot("walk-to-cabinet",legs.shrine,Math.min(66,legs.shrine.length),gaze(world(-4.7,2.45,-2),doors));
  shot("open-the-shrine",stick("shrine"),65,()=>doors,{fov:60});
  for(let i=0;i<65;i++){const p=frames[frames.length-65+i];p.door=T.MathUtils.smoothstep(i,6,48);p.fov=60-8*i/64;}
  shot("jackal-and-gold-chest",stick("shrine"),26,()=>world(-5.05,1.65,-3.08),{fov:40,door:1});
  const beside=legs.aisle.concat(legs.turn,legs["court-exit"]);
  const [gx,gz]=northRoad.at(8);
  function face(a,b,u){
    const angle=Math.atan2(a.x,a.z),delta=Math.atan2(Math.sin(Math.atan2(b.x,b.z)-angle),Math.cos(Math.atan2(b.x,b.z)-angle));
    const pitch=T.MathUtils.lerp(Math.asin(a.y),Math.asin(b.y),u),yaw=angle+delta*u;
    return new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  }
  shot("turn-from-the-shrine",beside,beside.length,(p,t)=>{
    const pos=new T.Vector3(...p),old=new T.Vector3(...doors).sub(pos).normalize();
    const gate=new T.Vector3(gx,2.4,gz).sub(pos).normalize();
    return pos.add(face(old,gate,T.MathUtils.smoothstep(t,0,.42))).toArray();
  },{door:1,fov:71});
  function roadShot(id,start,end,look){
    const path=drive.filter(p=>p.station>=start&&p.station<end);
    shot(id,path,path.length,(eye,t,p)=>look(p.station,t),{door:1,fov:72});
  }
  function along(s,advance,side,height){
    const [a,b]=northRoad.at(s+advance,side);return [a,ground(a,b)+height,b];
  }
  roadShot("beneath-the-lintel",0,22,(s,t)=>along(s,15,0,2.5-.6*t));
  roadShot("terrace-cut",25,44,(s,t)=>along(s,15,-2.6+2.4*t,2.2));
  roadShot("ruined-enclosure",45,63,(s,t)=>{
    const [a,b]=northRoad.at(60.4,10.6);
    return gaze(along(s,17,1,2.1),[a,ground(a,b)+1.58,b])(null,T.MathUtils.smoothstep(t,0,.48));
  });
  roadShot("limestone-beds",77,94,(s,t)=>{
    const [a,b]=northRoad.at(87,-16);
    return gaze([a,ground(a,b)+1.3,b],along(s,19,-2,2.4))(null,T.MathUtils.smoothstep(t,.4,1));
  });
  roadShot("turn-to-the-pyramid",126,146,(s,t)=>{
    const aim=along(s,18,0,2.5);
    return gaze(aim,[x,19.8,101])(null,t*.78);
  });
  roadShot("approach-the-steps",northRoad.length-18,northRoad.length+1,()=>[x,17.5,102]);
  shot("north-entrance",legs.stairs.slice(-84),84,p=>[x,18.5,101],{fov:73});
  const crossing=legs.entry.findIndex(p=>p.state==="passage");
  shot("enter-the-pyramid",legs.entry.slice(Math.max(0,crossing-40)),80,(p,t)=>[x,p[1]+.65-2.95*T.MathUtils.smoothstep(t,.14,.63),p[2]-5]);
  shot("low-passage",legs.gallery.slice(-105),105,(p,t)=>[x,p[1]+1+2*t,p[2]-4]);
  shot("corbelled-gallery",legs.climb.slice(53),84,(p,t)=>[x+.4*Math.sin(Math.PI*t),p[1]+2.6+2*Math.sin(Math.PI*t),p[2]-4]);
  shot("antechamber",legs.ante,Math.min(71,legs.ante.length),ahead(0,.08,-4));
  shot("turn-into-chamber",legs.room.concat(legs.stone),68,(p,t)=>{const u=T.MathUtils.smoothstep(t,.18,.73);return [T.MathUtils.lerp(x-.12,coffer.x,u),highFloor+1.12,T.MathUtils.lerp(-12,coffer.z,u)];},{fov:78});
  shot("granite-coffer",legs.stone,Math.min(48,legs.stone.length),()=>[coffer.x,highFloor+.8,coffer.z],{fov:72});
  return {frames,cuts};
}
