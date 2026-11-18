import {T} from "./atelier.js";
import {buildCastle} from "./castle.js";
import {howl as card} from "./parameters.js";

const params=new URLSearchParams(location.search),canvas=document.querySelector("canvas");
const castle=buildCastle(card);
const views={front:[0,20,85],side:[85,20,0],quarter:[48,22,73],eye:[-35,card.design.eyeHeightM,-48]};
const view=params.get("view")||"quarter",position=views[view]||views.quarter;
const scene=new T.Scene();scene.background=new T.Color(0xd9dcd6);
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.outputColorSpace=T.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const camera=new T.PerspectiveCamera(view==="eye"?54:37,1,.1,360);
const clay=new T.MeshStandardMaterial({color:0xb9b4a7,roughness:.96,side:T.DoubleSide});
if(params.get("surface")==="clay")castle.root.traverse(o=>{if(o.isMesh){o.material=clay;if(o.isInstancedMesh)o.instanceColor=null;}});
scene.add(castle.root,new T.HemisphereLight(0xe5f0f5,0xb4aa99,1.66));
const sun=new T.DirectionalLight(0xffefd9,2.55);sun.position.set(-35,68,52);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-33,right:33,top:40,bottom:-31,near:1,far:146});sun.shadow.camera.updateProjectionMatrix();
sun.shadow.mapSize.set(1536,1536);sun.shadow.normalBias=.044;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(640,640),new T.MeshStandardMaterial({color:0xd0cfc3,roughness:1}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
function render(){
  const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.position.fromArray(position);
  if(camera.aspect<1){
    camera.position.x/=camera.aspect;camera.position.z/=camera.aspect;
    if(view!=="eye")camera.position.y/=camera.aspect;
  }
  camera.lookAt(0,view==="eye"?19:21,0);camera.updateProjectionMatrix();
  renderer.render(scene,camera);canvas.dataset.ready="true";
}
render();window.addEventListener("resize",render);
