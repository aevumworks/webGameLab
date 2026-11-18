import {createStage} from "../../stage.js";
import {frameCount,framePose,fps} from "./camera.js";
import {createOptics} from "./optics.js";
const T=globalThis.THREE;
const query=new URLSearchParams(location.search);

export const player=createStage(document.querySelector("canvas"),false).then(stage=>{
  const {camera,scene,court,atmosphere,pyramid,outside,renderer}=stage;
  const spaces={court:court.root,guardian:scene.getObjectByName("Standing Anubis"),
    cabinet:scene.getObjectByName("Jackal cabinet"),jackal:scene.getObjectByName("Recumbent Anubis")};
  const optics=createOptics(renderer,camera),aim=new T.Vector3(),detail=new T.Vector3(Infinity,0,0);
  let prevOpening=-1,prevShot="",width=0,height=0;
  function resize(w,h){
    if(w===width&&h===height)return;
    width=w;height=h;renderer.setPixelRatio(1);renderer.setSize(w,h,false);optics.resize(w,h);camera.aspect=w/h;
  }
  function draw(frame){
    const pose=framePose(frame),space=spaces[pose.space];
    camera.position.fromArray(pose.eye);space.localToWorld(camera.position);
    aim.fromArray(pose.aim);space.localToWorld(aim);camera.lookAt(aim);
    camera.fov=pose.fov;camera.updateProjectionMatrix();
    court.setOpening(pose.opening);court.update(0,frame/fps);
    if(detail.distanceToSquared(camera.position)>1||prevShot!==pose.id){
      detail.copy(camera.position);pyramid.userData.updateDetail(detail);outside.updateDetail(detail);
    }
    atmosphere.update(camera,"court",1/fps,Math.abs(prevOpening-pose.opening)>.0001||prevShot!==pose.id,pose.light);
    prevOpening=pose.opening;prevShot=pose.id;
    optics.draw(scene,camera.position.distanceTo(aim),pose.iris*height/1920,frame);
  }
  function fit(){const el=renderer.domElement;resize(Math.max(2,Math.round(el.clientWidth*devicePixelRatio)),Math.max(2,Math.round(el.clientHeight*devicePixelRatio)));}
  fit();draw(0);document.body.dataset.ready="true";
  if(!query.has("capture")){
    let elapsed=0,previous,animation,paused=false;
    function tick(now){
      if(previous!==undefined)elapsed=(elapsed+now-previous)%(1000*frameCount/fps);
      previous=now;draw(Math.floor(elapsed*fps/1000));animation=requestAnimationFrame(tick);
    }
    function sync(){cancelAnimationFrame(animation);previous=undefined;if(!paused&&!document.hidden)animation=requestAnimationFrame(tick);}
    function toggle(){paused=!paused;sync();}
    renderer.domElement.addEventListener("click",toggle);window.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.repeat){e.preventDefault();toggle();}});
    window.addEventListener("resize",()=>{fit();draw(Math.floor(elapsed*fps/1000));});document.addEventListener("visibilitychange",sync);sync();
  }
  return {resize,draw,renderer};
});
const key=query.get("record");
const boot=key&&location.hostname==="127.0.0.1"?Promise.all([player,import("./record.js")]).then(([rig,mod])=>mod.record(rig,key)):player;
boot.catch(error=>{document.body.dataset.error=String(error);console.error(error);});
