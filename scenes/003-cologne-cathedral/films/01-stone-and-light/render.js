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
    const duration = 1000 * frameCount / fps;
    let elapsed = 0, previousTime = null, previousFrame = 0, animation, paused = false;
    function paint(force = false) {
      const frame = Math.floor(elapsed * fps / 1000);
      if (force || frame !== previousFrame) draw(frame);
      previousFrame = frame;
    }
    const play = now => {
      if (previousTime !== null) elapsed = (elapsed + now - previousTime) % duration;
      previousTime = now;
      paint();
      animation = requestAnimationFrame(play);
    };
    function sync() {
      cancelAnimationFrame(animation);
      previousTime = null;
      if (!paused && !document.hidden) animation = requestAnimationFrame(play);
    }
    function toggle() {
      paused = !paused;
      sync();
    }
    renderer.domElement.addEventListener("click", toggle);
    window.addEventListener("keydown", event => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) toggle();
      }
      if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        event.preventDefault();
        elapsed = Math.min(duration - 1000 / fps, Math.max(0, elapsed + (event.code === "ArrowLeft" ? -5000 : 5000)));
        paint();
      }
    });
    window.addEventListener("resize", () => { viewport(); paint(true); });
    document.addEventListener("visibilitychange", sync);
    sync();
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
