import {readBuilding} from "../../architecture/models.js";
import {buildCologne} from "./cathedral.js";
import {surroundings} from "./light.js";

export async function createCathedralStage(canvas) {
  const T = globalThis.THREE;
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true
  });
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    throw Error([gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].filter(Boolean).join(" "));
  };
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.035;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const card = await readBuilding("cologne");
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0xc4c6c4, .0020);
  const camera = new T.PerspectiveCamera(67, 1, .10, 1000);
  const building = buildCologne(card);
  scene.add(building);
  const environment = await surroundings(scene, building, renderer);
  return {renderer, scene, camera, card, building, environment};
}
