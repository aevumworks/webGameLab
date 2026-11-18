import {createCathedralStage} from "./stage.js";
import {navigator3D} from "./walk.js";

const T=globalThis.THREE,canvas=document.querySelector("#world");
async function start(){
  const {renderer,scene,camera,card,building,environment}=await createCathedralStage(canvas);
  let dirty=true,evening=false,ratio=1,slow=0;
  function toggleLight(){evening=!evening;environment.mode(evening);document.body.dataset.light=evening?"dusk":"day";dirty=true;}
  const walk=navigator3D(camera,canvas,building.userData.solids,card.design.eyeHeight,toggleLight);
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    ratio=Math.min(devicePixelRatio||1,1.5,1750/w);renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.fov=w/h<.84?77:67;camera.updateProjectionMatrix();dirty=true;
  }
  window.addEventListener("resize",resize);resize();
  const prev=new T.Vector3(Infinity,0,0),rotation=new T.Quaternion(),reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last=performance.now(),raf=0,timer=0;
  function cancel(){cancelAnimationFrame(raf);clearTimeout(timer);}
  function schedule(){if(!document.hidden){raf=requestAnimationFrame(frame);timer=setTimeout(()=>{cancelAnimationFrame(raf);frame(performance.now());},105);}}
  function frame(now){
    cancel();if(document.hidden)return;
    const dt=Math.min(.105,Math.max(0,(now-last)/1000));last=now;walk.step(dt,reduced);
    const lens=camera.aspect<.84?77:67+7*T.MathUtils.smoothstep(camera.position.z,6,36);
    if(Math.abs(camera.fov-lens)>.035){camera.fov=lens;camera.updateProjectionMatrix();dirty=true;}
    if(dirty||prev.distanceToSquared(camera.position)>1e-10||Math.abs(rotation.dot(camera.quaternion))<.9999999){
      if(!dirty&&dt>.058)slow++;else if(dt<.034)slow=Math.max(0,slow-1);
      if(slow>22&&ratio>.78){ratio=Math.max(.78,ratio*.84);renderer.setPixelRatio(ratio);slow=0;}
      renderer.render(scene,camera);prev.copy(camera.position);rotation.copy(camera.quaternion);dirty=false;
    }
    schedule();
  }
  document.addEventListener("visibilitychange",()=>{cancel();if(!document.hidden){last=performance.now();dirty=true;schedule();}});
  environment.mode(false);document.body.dataset.light="day";renderer.render(scene,camera);
  document.body.dataset.ready="true";schedule();
}
start().catch(e=>{document.body.dataset.error=e.message;console.error(e);});
