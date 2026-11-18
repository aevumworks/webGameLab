import {fps, frameCount} from "./camera.js";

export async function record({resize, draw, renderer}, captureKey) {
  const endpoint = "/" + encodeURIComponent(captureKey);
  async function request(path, options) {
    const response = await fetch(endpoint + path, options);
    if (!response.ok) throw Error("Capture " + response.status + ": " + await response.text());
    return response;
  }
  const {width, height} = await (await request("/settings")).json();
  resize(width, height);
  const gl = renderer.getContext();
  if (gl.drawingBufferWidth !== width || gl.drawingBufferHeight !== height) {
    throw Error("The requested capture size exceeds the available WebGL framebuffer.");
  }
  await request("/start", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({fps, frameCount})
  });
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < frameCount; i++) {
    draw(i);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    if (gl.isContextLost()) throw Error("WebGL context lost at frame " + i);
    await request("/frame/" + i, {method: "POST", body: pixels});
  }
  await request("/finish", {method: "POST"});
  document.body.dataset.recorded = String(frameCount);
}
