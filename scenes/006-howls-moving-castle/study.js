import {studyLayer,celMaterial} from "./cel.js";
import {engineSteam} from "./steam.js";
import {steamPlant} from "./drive-train.js";
import {T} from "./atelier.js";
import {contourRenderer} from "./contours.js";
import {buildCastle} from "./castle.js";
import {howl as card} from "./parameters.js";

const params=new URLSearchParams(location.search),canvas=document.querySelector("canvas");
const castle=buildCastle(card);
let layer=params.get("layer")||"final";
studyLayer(layer);
const views={front:[0,20,85],side:[85,20,0],quarter:[48,22,73],engine:[30,21,29],steam:[34,40,40],eye:[-35,card.design.eyeHeightM,-48]};
const view=params.get("view")||"quarter",position=views[view]||views.quarter;
const scene=new T.Scene();scene.background=new T.Color(layer==="shadow"||layer==="ink"?0xf3f3ef:0xd9dcd6);
const withSteam=(view==="steam"||params.get("plume")==="1")&&params.get("surface")!=="clay";
const steam=withSteam?engineSteam(castle):null,plant=steam?steamPlant():null;
if(steam){steam.reset(plant);steam.update(0,plant,"day");scene.add(steam.group);}
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.outputColorSpace=T.SRGBColorSpace;
const draw=contourRenderer(renderer);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.BasicShadowMap;
const camera=new T.PerspectiveCamera(view==="eye"?54:view==="engine"?43:37,1,.1,360);
const clay=new T.MeshStandardMaterial({color:0xb9b4a7,roughness:.96,flatShading:true,side:T.DoubleSide});
if(params.get("surface")==="clay")castle.root.traverse(o=>{if(o.isMesh){o.material=clay;if(o.isInstancedMesh)o.instanceColor=null;}});
scene.add(castle.root,new T.HemisphereLight(0xe5f0f5,0xb4aa99,1.66));
const sun=new T.DirectionalLight(0xffefd9,2.55);sun.position.set(26,66,76);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-33,right:33,top:40,bottom:-31,near:1,far:170});sun.shadow.camera.updateProjectionMatrix();
sun.shadow.mapSize.set(1536,1536);sun.shadow.normalBias=.044;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(640,640),params.get("surface")==="clay"?new T.MeshStandardMaterial({color:0xd0cfc3,roughness:1}):celMaterial({color:0xd0d1c9},"land"));
floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
function render(){
  const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.position.fromArray(position);
  if(withSteam&&view==="quarter"){camera.position.multiplyScalar(1.08);camera.position.y+=2;}
  steam?.resize(canvas.width,canvas.height,renderer.getPixelRatio());
  steam?.update(0,plant,"day");
  scene.background.set(layer==="shadow"||layer==="ink"?0xf3f3ef:0xd9dcd6);
  if(camera.aspect<1){
    camera.position.x/=camera.aspect;camera.position.z/=camera.aspect;
    if(view!=="eye")camera.position.y/=camera.aspect;
  }
  if(view==="engine")camera.lookAt(8,19,6);else if(view==="steam")camera.lookAt(9,39,-5);
  else camera.lookAt(0,view==="eye"?19:withSteam?24:21,0);camera.updateProjectionMatrix();
  if(params.get("surface")==="clay"||layer==="paint"||layer==="shadow")renderer.render(scene,camera);
  else draw(scene,camera,null,.98,layer==="ink");canvas.dataset.ready="true";
}
render();window.addEventListener("resize",render);
window.addEventListener("keydown",event=>{
  const layers={Digit1:"paint",Digit2:"shadow",Digit3:"ink",Digit4:"final"};
  if(!layers[event.code]||params.get("surface")==="clay")return;
  layer=layers[event.code];studyLayer(layer);render();
});
