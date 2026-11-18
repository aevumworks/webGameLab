import {createCathedralStage} from "../../stage.js";
import {fps, frameCount, framePose} from "./camera.js";

export const player = createCathedralStage(document.querySelector("canvas")).then(({renderer, scene, camera, environment}) => {
  let width, height, lighting;
  function resize(w, h) {
    if (width === w && height === h) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
  }
  function draw(frame) {
    const pose = framePose(frame);
    if (pose.light !== lighting) {
      lighting = pose.light;
      environment.mode(lighting === "dusk");
    }
    camera.position.fromArray(pose.eye);
    camera.lookAt(...pose.aim);
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  const viewport = () => resize(Math.max(1, Math.round(innerWidth)), Math.max(1, Math.round(innerHeight)));
  viewport();
  draw(0);
  document.body.dataset.ready = "true";
  if (!new URLSearchParams(location.search).has("capture")) {
    const start = performance.now();
    const play = now => {
      if (!document.hidden) draw(Math.floor((now - start) * fps / 1000) % frameCount);
      requestAnimationFrame(play);
    };
    window.addEventListener("resize", viewport);
    requestAnimationFrame(play);
  }
  return {resize, draw, renderer};
});
const captureKey = new URLSearchParams(location.search).get("record");
const playback = captureKey && location.hostname === "127.0.0.1"
  ? Promise.all([player, import("./record.js")]).then(([rig, {record}]) => record(rig, captureKey))
  : player;
playback.catch(error => {
  document.body.dataset.error = error.message;
  console.error(error);
});
