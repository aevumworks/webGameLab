import {createStage} from "./stage.js";
import {walk} from "./walk.js";
const T=globalThis.THREE;

async function start(){
  const canvas=document.querySelector("canvas"),still=new URLSearchParams(location.search).has("still");
  const coarse=matchMedia("(pointer: coarse)").matches||canvas.clientWidth<620;
  const clay=new URLSearchParams(location.search).get("view")==="clay";
  const {renderer,scene,camera,outdoors,outside,pyramid,court,atmosphere}=await createStage(canvas,coarse,clay);
  function toggleSun(){document.body.dataset.light=atmosphere.toggle()?"dusk":"day";}
  const visitor=walk(camera,canvas,court,outside.passable,toggleSun);
  let ratio=1;
  function resize(){
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    ratio=Math.min(devicePixelRatio||1,coarse?1.35:1.6,(still?850:1800)/w);
    renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);
    camera.aspect=w/h;visitor.frame();
  }
  resize();
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last=0,raf,timer,slow=0,t=0;
  const lastDetail=new T.Vector3(Infinity,0,0);
  function render(now){
    const dt=last?Math.min(.087,Math.max(.001,(now-last)/1000)):1/30;
    last=now;t+=dt;const place=visitor.step(dt,reduced),moving=court.update(dt,reduced?0:t,camera.position);
    outdoors.visible=!(place==="gallery"||place==="chamber"||place==="antechamber"||(place==="passage"&&camera.position.z<75));
    if(outdoors.visible&&lastDetail.distanceToSquared(camera.position)>1){
      lastDetail.copy(camera.position);pyramid.userData.updateDetail(lastDetail);outside.updateDetail(lastDetail);
    }
    atmosphere.update(camera,place,dt,moving);renderer.render(scene,camera);
    if(!still){
      if(dt>.064)slow++;else if(dt<.042)slow=Math.max(0,slow-1);
      if(slow>30&&ratio>.76){ratio=Math.max(.76,ratio*.86);renderer.setPixelRatio(ratio);slow=0;}
    }
  }
  function cancel(){cancelAnimationFrame(raf);clearTimeout(timer);}
  function loop(now){cancel();if(document.hidden)return;render(now);schedule();}
  function schedule(){if(still||document.hidden)return;raf=requestAnimationFrame(loop);timer=setTimeout(()=>loop(performance.now()),108);}
  document.body.dataset.light="day";render(performance.now());document.body.dataset.ready="true";
  window.addEventListener("resize",()=>{resize();if(still)render(performance.now());});
  document.addEventListener("visibilitychange",()=>{cancel();last=0;if(!document.hidden)schedule();});
  schedule();
}
start().catch(error=>{document.body.dataset.error=error.message;console.error(error);});
