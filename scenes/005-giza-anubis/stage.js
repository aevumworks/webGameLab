import {giza} from "./parameters.js";
import {makeSurfaces} from "./surfaces.js";
import {buildKhufu} from "./pyramid.js";
import {buildPlateau} from "./plateau.js";
import {buildCourt} from "./court.js";
import {buildPassages} from "./interior.js";
import {lighting} from "./atmosphere.js";
import {loadSculptures} from "./rodin.js";

const T=globalThis.THREE;

// The film and the walking tour instantiate the same geometry, PBR assets, lighting and shadow maps.
export async function createStage(canvas,coarse){
  const sculptures=loadSculptures();
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance",preserveDrawingBuffer:true});
  renderer.debug.onShaderError=(gl,program,vs,fs)=>{throw Error([gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].filter(Boolean).join("\n"));};
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(57,1,.048,2850);
  const outdoors=new T.Group();scene.add(outdoors);
  const surfaces=makeSurfaces(),outside=buildPlateau(outdoors,surfaces);
  const pyramid=buildKhufu(giza,surfaces,true);outdoors.add(pyramid);
  const fixtures=buildPassages(scene,surfaces),court=buildCourt(outdoors,surfaces,await sculptures);
  const atmosphere=lighting(renderer,scene,fixtures,coarse);
  return {renderer,scene,camera,outdoors,outside,pyramid,court,atmosphere};
}
