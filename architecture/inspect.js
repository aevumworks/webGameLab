import {buildings,readBuilding,buildBuilding} from "./models.js";
const T=globalThis.THREE, q=s=>document.querySelector(s),canvas=q("canvas"),select=q("select");
for(const [id,title] of Object.entries(buildings))select.add(new Option(title,id));
const requested=new URLSearchParams(location.search).get("model");select.value=Object.hasOwn(buildings,requested)?requested:"cologne";
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setClearColor(0xd2d6c8);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(39,1,.075,1600);
scene.add(new T.HemisphereLight(0xfff3d8,0x899e99,2.5));const sun=new T.DirectionalLight(0xffe2b9,2.1);sun.position.set(-60,90,65);scene.add(sun);
const grid=new T.GridHelper(220,110,0xa7ae9e,0xbac1b2);grid.position.y=-.26;scene.add(grid);
let model,version=0,radius=1,yaw=.65,pitch=.34,zoom=1,center=new T.Vector3();
function render(){camera.position.copy(center).add(new T.Vector3(Math.cos(pitch)*Math.sin(yaw),Math.sin(pitch),Math.cos(pitch)*Math.cos(yaw)).multiplyScalar(radius*zoom));camera.lookAt(center);renderer.render(scene,camera);}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(model)render();}window.addEventListener("resize",resize);resize();
function reset(){yaw=.64;pitch=.31;zoom=1;render();}q("#reset").onclick=reset;
async function show(){
  const id=select.value,seq=++version,card=await readBuilding(id);if(seq!==version)return;
  if(model){scene.remove(model);model.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});}
  model=buildBuilding(card);scene.add(model);const bounds=new T.Box3().setFromObject(model),sphere=bounds.getBoundingSphere(new T.Sphere());
  center.copy(sphere.center);radius=sphere.radius/Math.sin(T.MathUtils.degToRad(19.5))*Math.max(1,1/camera.aspect)*1.09;
  const ref=new URL(location.href);ref.searchParams.set("model",id);history.replaceState(null,"",ref);
  const a=q("#card");a.href="https://github.com/aevumworks/webGameLab/blob/main/knowledge/"+encodeURIComponent("建筑")+"/"+id+".md";
  q("#status").textContent=card.name+" · 米制参数模型";document.body.dataset.model=id;reset();
}
select.onchange=()=>show().catch(e=>q("#status").textContent=e.message);
const pointers=new Map();let pinch=0;function gap(){const [x,y]=pointers.values();return Math.hypot(x.x-y.x,x.y-y.y);}
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2)pinch=gap();};
canvas.onpointermove=e=>{const p=pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
if(pointers.size===2){const g=gap();if(g>2&&pinch>2)zoom=T.MathUtils.clamp(zoom*pinch/g,.16,3);pinch=g;}else{yaw-=dx*.008;pitch=T.MathUtils.clamp(pitch+dy*.006,-.14,1.42);}render();};
canvas.onlostpointercapture=e=>pointers.delete(e.pointerId);canvas.onwheel=e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.16,3);render();};
show().catch(e=>{q("#status").textContent=e.message;});
