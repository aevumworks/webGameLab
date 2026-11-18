const T=globalThis.THREE,clamp=T.MathUtils.clamp;
export const stops=[
  {id:"nave",name:"中殿",de:"Langhaus",x:.10,z:-43.1,yaw:0,pitch:.23,body:"中殿拱顶净高 43.35 米。面向东端，两侧各有两条侧廊。抬头可依次辨认尖拱、大拱上方的小拱廊和高侧窗。",link:"https://www.koelner-dom.de/erleben/der-dom-in-zahlen"},
  {id:"west",name:"西立面广场",de:"Westfassade",x:-19.0,z:96,yaw:-Math.atan2(19,97),pitch:.52,body:"西立面宽 61.54 米。左侧为北塔，高 157.18 米，右侧为南塔，高 157.22 米。走近中央门廊可以直接进入中殿。",link:"https://www.koelner-dom.de/erleben/der-dom-in-zahlen"},
  {id:"porch",name:"西门廊",de:"Westportal",x:0,z:7.6,yaw:0,pitch:.13,body:"三座尖拱门廊嵌在双塔之间。这里依据中世纪西立面 F 图复原拱券层次、壁龛和山花。经中央敞开的门进入长堂。",link:"https://commons.wikimedia.org/wiki/File:Fassadenplan_F_vom_K%C3%B6lner_Dom.jpg"},
  {id:"crossing",name:"交叉部",de:"Vierung",x:0,z:-77.65,yaw:-Math.PI/2,pitch:.26,body:"这里是中殿与横厅的交汇处。现在朝南，端墙上是方格彩窗。本作按独立色序表现光感。原窗设计者是格哈德·里希特。",link:"https://www.koelner-dom.de/kunstwerke/suedquerhausfenster"},
  {id:"choir",name:"唱诗席与回廊",de:"Chor und Chorumgang",x:0,z:-121.6,yaw:Math.PI,pitch:.105,body:"唱诗席东端的金色圣物箱是三王圣龛。穿过它后方的束柱即可进入回廊，七座小礼拜堂沿东端呈扇形展开。",link:"https://whc.unesco.org/en/list/292/"}
];
export function navigator3D(camera,canvas,solids,eye,onMove,onPlace){
  const keys=new Set(),pad={x:0,y:0},pos=new T.Vector3();
  let yaw=0,pitch=0,drag=null,stickId=null,phase=0,lastZone="";
  const R=.29;
  function clear(x,z){
    if(Math.abs(x)>80||z>134||z< -161)return false;
    for(const p of solids.posts)if((x-p.x)**2+(z-p.z)**2<(p.r+R)**2)return false;
    for(const b of solids.blocks){
      const xx=x-b.x,zz=z-b.z,co=Math.cos(b.angle),si=Math.sin(b.angle);
      const u=Math.abs(xx*co-zz*si)-b.hw,v=Math.abs(xx*si+zz*co)-b.hd;
      if(Math.hypot(Math.max(u,0),Math.max(v,0))<R)return false;
    }
    return true;
  }
  function zone(){if(pos.z>14)return "west";if(pos.z>-15 && Math.abs(pos.x)<30.8)return "porch";
    if(pos.z< -118 && Math.abs(pos.x)<28 ||pos.z< -98 && Math.abs(pos.x)<17)return "choir";
    if(pos.z< -66 && pos.z>-91 && Math.abs(pos.x)<43.2)return "crossing";
    if(Math.abs(pos.x)<23.8 && pos.z<0 && pos.z>-144.6)return "nave";return "west";}
  function renderPose(bob=0){camera.position.set(pos.x,eye+bob,pos.z);camera.rotation.order="YXZ";camera.rotation.set(pitch,yaw,0);const id=zone();if(lastZone!==id){lastZone=id;onPlace(id);}}
  function stop(){keys.clear();pad.x=pad.y=0;drag=null;stickId=null;thumb.style.transform="";}
  function jumpTo(id){const t=stops.find(s=>s.id===id);if(!t)return;stop();pos.set(t.x,0,t.z);yaw=t.yaw;pitch=t.pitch;phase=0;renderPose();canvas.focus({preventScroll:true});}
  function step(dt,reduced){
    if(document.querySelector("#visit").open||document.querySelector("#facts").open)return;
    if(keys.has("ArrowLeft"))yaw+=1.30*dt;if(keys.has("ArrowRight"))yaw-=1.30*dt;
    if(keys.has("PageUp"))pitch=clamp(pitch+dt,-1.32,1.42);if(keys.has("PageDown"))pitch=clamp(pitch-dt,-1.32,1.42);
    let sx=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0)+pad.x;
    let sz=(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-(keys.has("KeyW")||keys.has("ArrowUp")?1:0)+pad.y;
    const len=Math.hypot(sx,sz);if(len>1){sx/=len;sz/=len;}
    const speed=keys.has("ShiftLeft")||keys.has("ShiftRight")?8.15:4.0;
    const dx=(sx*Math.cos(yaw)+sz*Math.sin(yaw))*dt*speed,dz=(sz*Math.cos(yaw)-sx*Math.sin(yaw))*dt*speed;
    // Small substeps keep the walking capsule clear of narrow rails and door leaves at low frame rates.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.19));let distance=0;
    for(let i=0;i<steps;i++){if(clear(pos.x+dx/steps,pos.z)){pos.x+=dx/steps;distance+=Math.abs(dx/steps);}
      if(clear(pos.x,pos.z+dz/steps)){pos.z+=dz/steps;distance+=Math.abs(dz/steps);}}
    if(distance>.0001){phase+=distance*3.8;onMove();}
    renderPose(reduced?0:Math.min(1,distance*20)*.017*Math.sin(phase));
  }
  const accepted=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft","ShiftRight","PageUp","PageDown"]);
  window.addEventListener("keydown",e=>{if(!accepted.has(e.code)||e.ctrlKey||e.metaKey||e.altKey||document.querySelector("dialog[open]"))return;e.preventDefault();keys.add(e.code);});
  window.addEventListener("keyup",e=>keys.delete(e.code));
  canvas.addEventListener("pointerdown",e=>{if(e.button!==0||drag)return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.focus({preventScroll:true});});
  canvas.addEventListener("pointermove",e=>{if(drag?.id!==e.pointerId)return;const x=e.clientX-drag.x,y=e.clientY-drag.y;yaw-=x*.0042;pitch=clamp(pitch-y*.0039,-1.32,1.42);drag.x=e.clientX;drag.y=e.clientY;if(Math.abs(x)+Math.abs(y)>2)onMove();renderPose();});
  canvas.addEventListener("lostpointercapture",()=>{drag=null;});
  const stick=document.querySelector("#stick"),thumb=stick.firstElementChild;
  function stickMove(e){const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y),v=Math.min(1,len/28)/(len||1);pad.x=x*v;pad.y=y*v;thumb.style.transform="translate("+pad.x*20+"px,"+pad.y*20+"px)";}
  stick.addEventListener("pointerdown",e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);});
  stick.addEventListener("pointermove",e=>{if(stickId===e.pointerId)stickMove(e);});
  stick.addEventListener("lostpointercapture",()=>{stickId=null;pad.x=pad.y=0;thumb.style.transform="";});
  window.addEventListener("blur",stop);document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
  jumpTo("nave");return {jumpTo,step,stop,get location(){return lastZone;}};
}
