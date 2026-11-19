import {createStage} from "../../stage.js";
import {timeline,fps} from "./visitor-route.js";
import {record} from "../01-the-guardian/record.js";
const T=globalThis.THREE,params=new URLSearchParams(location.search);
export const player=createStage(document.querySelector("canvas"),false).then(stage=>{
  const {renderer,scene,camera,court,pyramid,outside,outdoors,atmosphere}=stage;
  const {frames,cuts}=timeline(stage),aim=new T.Vector3(),last=new T.Vector3(Infinity,0,0);
  const spaces={court:court.root,cabinet:scene.getObjectByName("Jackal cabinet"),jackal:scene.getObjectByName("Recumbent Anubis")};
  let previous="",opening=-1;
  function resize(w,h){renderer.setPixelRatio(1);renderer.setSize(w,h,false);camera.aspect=w/h;}
  function draw(i){
    const s=frames[i],space=spaces[s.space];camera.position.fromArray(s.eye);aim.fromArray(s.aim);
    if(space){space.localToWorld(camera.position);space.localToWorld(aim);}
    camera.lookAt(aim);camera.fov=s.fov;camera.updateProjectionMatrix();
    outdoors.visible=!(["gallery","antechamber","chamber"].includes(s.state)||(s.state==="passage"&&camera.position.z<75));
    if(outdoors.visible&&(previous!==s.id||last.distanceToSquared(camera.position)>1)){
      last.copy(camera.position);pyramid.userData.updateDetail(last);outside.updateDetail(last);
    }
    court.setOpening(s.door);court.update(0,i/fps);
    atmosphere.update(camera,s.state,1/fps,previous!==s.id||opening!==s.door,s.light);
    previous=s.id;opening=s.door;renderer.render(scene,camera);
  }
  function fit(){const c=renderer.domElement;resize(Math.round(c.clientWidth),Math.round(c.clientHeight));}
  fit();draw(0);document.body.dataset.ready="true";
  const rig={renderer,resize,draw,cuts,frameCount:frames.length};
  if(params.has("record")&&location.hostname==="127.0.0.1")record(rig,params.get("record"),{fps,frameCount:frames.length}).catch(fail);
  else if(!params.has("capture")){
    let start=performance.now(),lastFrame=-1;
    function play(t){const i=Math.floor((t-start)*fps/1000)%frames.length;if(i!==lastFrame){draw(i);lastFrame=i;}requestAnimationFrame(play);}
    window.addEventListener("resize",fit);requestAnimationFrame(play);
  }
  return rig;
});
function fail(e){document.body.dataset.error=e.message;console.error(e);}
player.catch(fail);
