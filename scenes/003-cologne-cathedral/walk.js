const T = globalThis.THREE;
export const stops = [
  {id:"nave", x:.10, z:-43.1, yaw:0, pitch:.23},
  {id:"west", x:-11, z:55, yaw:-Math.atan2(11,56), pitch:.60},
  {id:"porch", x:0, z:7.6, yaw:0, pitch:.13},
  {id:"crossing", x:0, z:-77.65, yaw:-Math.PI/2, pitch:.26},
  {id:"choir", x:1.82, z:-119.45, yaw:2.55, pitch:.075},
  {id:"square", x:16, z:23, yaw:-2.56, pitch:.21},
  {id:"station", x:-48, z:-68, yaw:.73, pitch:.13},
  {id:"museum", x:10, z:-170, yaw:-1.20, pitch:.15}
];
export function navigator3D(camera,canvas,solids,eyeHeight,toggleLight) {
  const keys=new Set(), touches=new Map(), pos=new T.Vector3(), radius=.29;
  let yaw=0,pitch=0,drag=null,stick=null,pair=null,lastTap=null,phase=0,stopIndex=0;
  const clamp=T.MathUtils.clamp;
  function clear(x,z) {
    if(Math.abs(x)>192||z>155||z< -239)return false;
    for(const p of solids.posts)if((x-p.x)**2+(z-p.z)**2<(p.r+radius)**2)return false;
    for(const b of solids.blocks){
      const dx=x-b.x,dz=z-b.z,c=Math.cos(b.angle),s=Math.sin(b.angle);
      if(Math.hypot(Math.max(Math.abs(dx*c-dz*s)-b.hw,0),Math.max(Math.abs(dx*s+dz*c)-b.hd,0))<radius)return false;
    }
    if(solids.street&&!solids.street(x,z,radius))return false;
    return true;
  }
  function pose(bob=0){
    camera.position.set(pos.x,eyeHeight+bob+(solids.heightAt?solids.heightAt(pos.x,pos.z)+.025:0),pos.z);camera.rotation.order="YXZ";camera.rotation.set(pitch,yaw,0);
  }
  function resetInput(){keys.clear();touches.clear();stick=null;drag=null;pair=null;lastTap=null;}
  function jumpTo(id){
    const index=stops.findIndex(s=>s.id===id);if(index<0)return;
    const s=stops[index];stopIndex=index;resetInput();pos.set(s.x,0,s.z);yaw=s.yaw;pitch=s.pitch;phase=0;pose();
    document.body.dataset.place=s.id;
  }
  function next(){jumpTo(stops[(stopIndex+1)%stops.length].id);}
  window.addEventListener("keydown",e=>{
    if(e.ctrlKey||e.altKey||e.metaKey)return;
    const index=/^(?:Digit|Numpad)([1-8])$/.exec(e.code);
    if(index&&stops[Number(index[1])-1]){if(!e.repeat)jumpTo(stops[Number(index[1])-1].id);e.preventDefault();return;}
    if(e.code==="KeyL"||e.code==="KeyM"){if(!e.repeat){if(e.code==="KeyL")toggleLight();else next();}e.preventDefault();return;}
    if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","PageUp","PageDown","ShiftLeft","ShiftRight"].includes(e.code)){
      e.preventDefault();keys.add(e.code);
    }
  });
  window.addEventListener("keyup",e=>keys.delete(e.code));
  canvas.addEventListener("pointerdown",e=>{
    if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
    const a={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,start:e.timeStamp,travel:0};
    if(e.pointerType!=="touch"){drag=a;return;}
    touches.set(a.id,a);
    if(touches.size===2)pair={ids:new Set(touches.keys()),valid:[...touches.values()].every(p=>p.travel<12)};
    if(e.clientX<canvas.clientWidth*.43&&!stick)stick=a;
    else if(!drag)drag=a;
  });
  canvas.addEventListener("pointermove",e=>{
    const a=touches.get(e.pointerId)||(drag?.id===e.pointerId?drag:null);if(!a)return;
    const dx=e.clientX-a.x,dy=e.clientY-a.y;a.x=e.clientX;a.y=e.clientY;
    a.travel=Math.max(a.travel,Math.hypot(a.x-a.startX,a.y-a.startY));
    if(pair&&a.travel>12)pair.valid=false;
    if(drag===a){yaw-=dx*.0042;pitch=clamp(pitch-dy*.0039,-1.32,1.43);pose();}
  });
  function release(e){
    const a=touches.get(e.pointerId);
    if(a&&e.type==="pointerup"){
      const now=e.timeStamp;
      if(pair?.ids.has(a.id)){
        pair.ids.delete(a.id);if(!pair.ids.size){const cycle=pair.valid;pair=null;lastTap=null;if(cycle){next();return;}}
      }else if(a===drag&&a.travel<10&&now-a.start<520){
        if(lastTap&&now-lastTap.time<490&&Math.hypot(a.x-lastTap.x,a.y-lastTap.y)<33){toggleLight();lastTap=null;}
        else lastTap={x:a.x,y:a.y,time:now};
      }
    }
    if(e.type==="pointercancel")pair=null;
    touches.delete(e.pointerId);if(stick?.id===e.pointerId)stick=null;if(drag?.id===e.pointerId)drag=null;
  }
  for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,release);
  window.addEventListener("blur",resetInput);document.addEventListener("visibilitychange",()=>{if(document.hidden)resetInput();});
  function step(dt,reduced){
    const pressure=(a,b)=>Number(keys.has(a))-Number(keys.has(b));
    yaw+=1.30*dt*pressure("ArrowLeft","ArrowRight");pitch=clamp(pitch+dt*pressure("PageUp","PageDown"),-1.32,1.43);
    let sx=pressure("KeyD","KeyA"),sz=Number(keys.has("KeyS")||keys.has("ArrowDown"))-Number(keys.has("KeyW")||keys.has("ArrowUp"));
    if(stick){const x=stick.x-stick.startX,y=stick.y-stick.startY,l=Math.max(32,Math.hypot(x,y));sx+=x/l;sz+=y/l;}
    const len=Math.max(1,Math.hypot(sx,sz)),speed=keys.has("ShiftLeft")||keys.has("ShiftRight")?8.15:4;
    const dx=(sx*Math.cos(yaw)+sz*Math.sin(yaw))*dt*speed/len,dz=(sz*Math.cos(yaw)-sx*Math.sin(yaw))*dt*speed/len;
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.19));let dist=0;
    for(let i=0;i<n;i++){if(dx&&clear(pos.x+dx/n,pos.z)){pos.x+=dx/n;dist+=Math.abs(dx/n);}if(dz&&clear(pos.x,pos.z+dz/n)){pos.z+=dz/n;dist+=Math.abs(dz/n);}}
    phase+=dist*3.8;pose(reduced?0:Math.min(1,dist*20)*.017*Math.sin(phase));
  }
  jumpTo(stops.some(s=>"#"+s.id===location.hash)?location.hash.slice(1):"nave");
  window.addEventListener("hashchange",()=>jumpTo(location.hash.slice(1)));
  return {step};
}
