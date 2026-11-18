const T=globalThis.THREE;
const vertex=`varying vec2 filmUV;void main(){filmUV=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`
varying vec2 filmUV;
uniform sampler2D beauty,depthMap;
uniform vec2 pixel;
uniform float nearZ,farZ,focusMetres,aperture,frameSeed;
float distanceAt(vec2 uv){
  float d=texture2D(depthMap,uv).r;
  return nearZ*farZ/max(.0001,farZ-d*(farZ-nearZ));
}
void main(){
  float d=distanceAt(filmUV);
  float coc=min(8.5,aperture*abs(1.-focusMetres/max(d,.03)));
  vec3 sum=texture2D(beauty,filmUV).rgb;float weights=1.;
  if(coc>.35){
    for(int i=0;i<16;i++){
      float j=float(i)+.5,a=j*2.3999632,r=sqrt(j/16.)*coc;
      vec2 u=clamp(filmUV+vec2(cos(a),sin(a))*r*pixel,pixel,1.-pixel);
      float neighbor=distanceAt(u);
      float w=smoothstep(.0,1.,.25+neighbor/max(.05,d)*.80);
      sum+=w*texture2D(beauty,u).rgb;weights+=w;
    }
  }
  vec2 xy=(filmUV-.5)*vec2(1.10,1.0);
  float lens=1.-.115*smoothstep(.15,.74,length(xy));
  gl_FragColor=vec4(sum/weights*lens,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  float grain=fract(sin(dot(mod(gl_FragCoord.xy,256.),vec2(12.9898,78.233))+mod(frameSeed,19.))*43758.5453)-.5;
  gl_FragColor.rgb+=grain*.0035;
}`;
export function createOptics(renderer,camera){
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  target.samples=renderer.capabilities.isWebGL2?2:0;
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  const uniforms={beauty:{value:target.texture},depthMap:{value:target.depthTexture},pixel:{value:new T.Vector2(1,1)},
    nearZ:{value:camera.near},farZ:{value:camera.far},focusMetres:{value:8},aperture:{value:2},frameSeed:{value:0}};
  const scene=new T.Scene(),ortho=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
  const screen=new T.Mesh(new T.PlaneGeometry(2,2),material);screen.frustumCulled=false;scene.add(screen);
  return {resize(w,h){target.setSize(w,h);uniforms.pixel.value.set(1/w,1/h);},
    draw(world,metres,iris,frame){
      uniforms.focusMetres.value=metres;uniforms.aperture.value=iris;uniforms.frameSeed.value=frame;
      renderer.setRenderTarget(target);renderer.render(world,camera);
      renderer.setRenderTarget(null);renderer.render(scene,ortho);
    }};
}
