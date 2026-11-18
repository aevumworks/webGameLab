import {readBuilding} from "../../architecture/models.js";
import {buildCologne} from "./cathedral.js";
import {surroundings} from "./light.js";
import {navigator3D,stops} from "./walk.js";
const T=globalThis.THREE, $=q=>document.querySelector(q),canvas=$("#world"),visit=$("#visit"),facts=$("#facts");
async function start(){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance",preserveDrawingBuffer:true});
  renderer.debug.onShaderError=(gl,program,v,f)=>{throw Error([gl.getProgramInfoLog(program),gl.getShaderInfoLog(v),gl.getShaderInfoLog(f)].filter(Boolean).join(" "));};
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const card=await readBuilding("cologne"),scene=new T.Scene();scene.fog=new T.FogExp2(0xbcb9b2,.00235);
  const camera=new T.PerspectiveCamera(68,1,.10,530),building=buildCologne(card);scene.add(building);
  const environment=surroundings(scene,building,renderer);let dirty=true,evening=false,dpr=1,slow=0;
  function moved(){document.body.classList.add("moving");}
  function location(id){document.body.dataset.place=id;$("#spot").textContent=stops.find(s=>s.id===id).name;for(const el of document.querySelectorAll(".place"))el.setAttribute("aria-current",String(el.dataset.place===id));}
  const walk=navigator3D(camera,canvas,building.userData.solids,card.design.eyeHeight,moved,location);
  for(const p of stops){const b=document.createElement("button");b.className="place";b.dataset.place=p.id;b.setAttribute("aria-current",String(p.id===walk.location));const label=document.createElement("span"),de=document.createElement("small");label.textContent=p.name;de.textContent=p.de;b.append(label,de);b.onclick=()=>{visit.close();walk.jumpTo(p.id);moved();dirty=true;};$("#stops").append(b);}
  function show(dialog){walk.stop();if(!dialog.open)dialog.showModal();}
  function info(){const s=stops.find(p=>p.id===walk.location);facts.querySelector("h2").textContent=s.name;facts.querySelector("em").textContent=s.de;facts.querySelector("p").textContent=s.body;facts.querySelector("a").href=s.link;show(facts);}
  $("#places").onclick=()=>show(visit);$("#details").onclick=info;
  for(const d of [visit,facts]){d.querySelector(".close").onclick=()=>d.close();d.addEventListener("close",()=>canvas.focus({preventScroll:true}));d.addEventListener("click",e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});}
  $("#time").onclick=()=>{evening=!evening;environment.mode(evening);$("#time").setAttribute("aria-pressed",String(evening));$("#time span").textContent=evening?"暮光":"日光";dirty=true;canvas.focus();};
  window.addEventListener("keydown",e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||document.querySelector("dialog[open]"))return;if(e.code==="KeyM")show(visit);if(e.code==="KeyE")info();if(e.code==="KeyH")document.body.classList.toggle("quiet");});
  canvas.addEventListener("dblclick",()=>document.body.classList.remove("quiet"));
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5,1660/w);
    renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.84?77:67;camera.updateProjectionMatrix();dirty=true;}
  window.addEventListener("resize",resize);resize();
  const previous=new T.Vector3(999,999,999),orientation=new T.Quaternion(),reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last=performance.now(),raf=0,timer=0;
  function cancel(){cancelAnimationFrame(raf);clearTimeout(timer);}
  function schedule(){if(document.hidden)return;raf=requestAnimationFrame(frame);timer=setTimeout(()=>{cancelAnimationFrame(raf);frame(performance.now());},105);}
  function frame(now){cancel();if(document.hidden)return;const dt=Math.min(.105,Math.max(0,(now-last)/1000));last=now;walk.step(dt,reduced);
    if(dirty||previous.distanceToSquared(camera.position)>1e-10||Math.abs(orientation.dot(camera.quaternion))<.9999999){
      if(!dirty&&dt>.058)slow++;else if(dt<.034)slow=Math.max(0,slow-1);
      if(slow>22&&dpr>.78){dpr=Math.max(.78,dpr*.84);renderer.setPixelRatio(dpr);slow=0;}
      renderer.render(scene,camera);previous.copy(camera.position);orientation.copy(camera.quaternion);dirty=false;
    }schedule();
  }
  document.addEventListener("visibilitychange",()=>{cancel();if(!document.hidden){last=performance.now();dirty=true;schedule();}});
  environment.mode(false);renderer.render(scene,camera);document.body.dataset.ready="true";$("#load").hidden=true;schedule();
}
start().catch(e=>{console.error(e);$("#load").hidden=true;$("#error").hidden=false;$("#error").textContent="场景加载失败。"+e.message;});
