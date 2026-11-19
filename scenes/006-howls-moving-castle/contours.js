import {tagInkPass} from "./cel.js";
import {T} from "./atelier.js";

// Ink only at breaks in depth. A planar slope has matching opposite gradients,
// so a broad hillside or wall stays a single field of colour.
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`
uniform sampler2D paint,depthMap;
uniform vec2 stepUV,depthAB;
uniform vec3 ink;
uniform float strength;uniform bool onlyLines;
varying vec2 vUv;
float depthAt(vec2 uv){
  float z=texture2D(depthMap,uv).r;
  return depthAB.y/(depthAB.x+2.*z-1.);
}
float subject(float tag){return 1.-smoothstep(.49,.58,tag);}
void main(){
  vec4 color=texture2D(paint,vUv);
  float c=depthAt(vUv),l=depthAt(vUv-vec2(stepUV.x,0.)),r=depthAt(vUv+vec2(stepUV.x,0.));
  float b=depthAt(vUv-vec2(0.,stepUV.y)),t=depthAt(vUv+vec2(0.,stepUV.y));
  float nearZ=min(c,min(min(l,r),min(b,t)));
  float bend=max(abs(l+r-2.*c),abs(b+t-2.*c));
  float mask=subject(color.a);
  vec2 across=vec2(stepUV.x,0.),up=vec2(0.,stepUV.y);
  vec4 outer=vec4(texture2D(paint,vUv-across*2.05).a,texture2D(paint,vUv+across*2.05).a,
    texture2D(paint,vUv-up*2.05).a,texture2D(paint,vUv+up*2.05).a);
  float outside=max(abs(mask-subject(min(min(outer.x,outer.y),min(outer.z,outer.w)))),
    abs(mask-subject(max(max(outer.x,outer.y),max(outer.z,outer.w)))));
  vec4 inner=abs(vec4(texture2D(paint,vUv-across).a,texture2D(paint,vUv+across).a,
    texture2D(paint,vUv-up).a,texture2D(paint,vUv+up).a)-color.a);
  float seam=mask*smoothstep(.052,.12,max(max(inner.x,inner.y),max(inner.z,inner.w)));
  float joint=smoothstep(.09+nearZ*.012,.24+nearZ*.054,bend)*mix(.18,.85,mask);
  float edge=max(outside,max(joint,seam*.76))*(1.-smoothstep(105.,330.,nearZ));
  vec3 paper=onlyLines?(abs(color.a-.65)<.018?ink:vec3(.94,.95,.92)):color.rgb;
  gl_FragColor=vec4(mix(paper,min(paper,ink),edge*strength),1.);
  #include <colorspace_fragment>
}`;
export function contourRenderer(renderer){
  const canReadDepth=renderer.capabilities.isWebGL2||renderer.extensions.has("WEBGL_depth_texture");
  const target=new T.WebGLRenderTarget(1,1,{stencilBuffer:false});
  target.texture.colorSpace=T.SRGBColorSpace;
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  const u={paint:{value:target.texture},depthMap:{value:target.depthTexture},stepUV:{value:new T.Vector2()},
    depthAB:{value:new T.Vector2()},ink:{value:new T.Color(0x1b2127)},strength:{value:.97},onlyLines:{value:false}};
  const sheet=new T.Scene(),eye=new T.Camera();
  sheet.add(new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({
    uniforms:u,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false
  })));
  function draw(scene,camera,destination=null,weight=.98,lines=false){
    const width=destination?.width??renderer.domElement.width,height=destination?.height??renderer.domElement.height;
    if(canReadDepth)target.setSize(width,height);
    renderer.setRenderTarget(canReadDepth?target:destination);
    tagInkPass(canReadDepth);renderer.render(scene,camera);tagInkPass(false);
    const stats={draws:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    if(canReadDepth){
      const m=camera.projectionMatrix.elements,px=destination?.72:renderer.getPixelRatio()*.94;
      u.depthAB.value.set(m[10],m[14]);u.stepUV.value.set(px/width,px/height);u.strength.value=weight;u.onlyLines.value=lines;
      renderer.setRenderTarget(destination);renderer.render(sheet,eye);
      stats.draws+=renderer.info.render.calls;stats.triangles+=renderer.info.render.triangles;
    }
    return stats;
  }
  draw.prepare=(scene,camera,lightScene)=>{
    const previous=renderer.getRenderTarget();
    if(canReadDepth)renderer.setRenderTarget(target);
    const shaders=renderer.compileAsync(scene,camera,lightScene);
    renderer.setRenderTarget(previous);return shaders;
  };
  return draw;
}
