import {fps,frameCount} from "./camera.js";
export async function record({renderer,resize,draw},key,timeline={fps,frameCount}){
  const {fps:rate,frameCount:total}=timeline;
  const path="/"+encodeURIComponent(key);
  async function post(route,body){
    const result=await fetch(path+"/"+route,{method:"POST",body});
    if(!result.ok)throw Error("Capture "+route+": "+await result.text());
  }
  const settings=await fetch(path+"/settings");if(!settings.ok)throw Error("Recording session unavailable");
  const {width,height}=await settings.json();resize(width,height);
  const gl=renderer.getContext(),frame=new Uint8Array(width*height*4);
  if(gl.drawingBufferWidth!==width||gl.drawingBufferHeight!==height)throw Error("Framebuffer size mismatch");
  await post("start",JSON.stringify({fps:rate,frameCount:total}));
  for(let i=0;i<total;i++){
    draw(i);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,frame);
    if(gl.isContextLost())throw Error("WebGL context lost");
    await post("frame/"+i,frame);
  }
  await post("finish");document.body.dataset.recorded=String(total);
}
