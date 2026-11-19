import {T,shaderNoise} from "./atelier.js";
import {cloudBanks} from "./clouds.js";

const skyVertex=`varying vec3 vRay;
void main(){vRay=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`;
const skyFragment=`varying vec3 vRay;
uniform vec3 zenith,horizon;uniform float night,amber;
${shaderNoise}
void main(){
  vec3 d=normalize(vRay);
  vec3 col=mix(horizon,zenith,smoothstep(-.08,.53,d.y));
  float sun=max(0.,dot(d,normalize(vec3(-.78,.62,.66))));
  col+=vec3(.15,.10,.04)*pow(sun,20.)*(.65+amber*.35)*(1.-night);
  vec2 stars=vec2(atan(d.z,d.x),asin(d.y))*145.;
  vec2 pt=abs(fract(stars)-.5);
  float star=(1.-smoothstep(.07,.14,pt.x+pt.y))*step(.976,hash21(floor(stars)));
  col+=vec3(.72,.79,.82)*star*night*smoothstep(.02,.22,d.y);
  gl_FragColor=vec4(col,1.);
  #include <colorspace_fragment>
}`;
const palette={
  day:["#4d83ab","#c7d4de","#fff4d7","#a9c4ce","#fff0d5","#dbeae9","#b9beb0",2.55,1.94,0,0],
  gold:["#628ba6","#f4cb93","#ffe6b4","#b5a49e","#ffd2a2","#f3d7bb","#878165",2.05,1.43,0,1],
  dusk:["#454e71","#ce9888","#dfb7a2","#7f7d91","#ffc299","#d1b1bd","#68646a",1.48,1.33,.20,.75],
  night:["#142942","#38516a","#63738e","#314559","#bbd7ec","#a4bfd0","#565c69",.85,1.14,1,0],
  front:["#292d47","#ad725e","#9e8282","#514c60","#e6aba1","#b5adc2","#635b62",1.24,1.12,.55,.65],
  memory:["#122a4b","#60889b","#8b9eb2","#384f70","#bdddf5","#abc9df","#5b6e78",.92,1.27,1,0]
};
export function atmosphere(scene){
  const u={};
  for(const key of ["zenith","horizon"])u[key]={value:new T.Color()};
  for(const key of ["night","amber"])u[key]={value:0};
  const sky=new T.Mesh(new T.SphereGeometry(100,32,20),new T.ShaderMaterial({vertexShader:skyVertex,fragmentShader:skyFragment,uniforms:u,side:T.BackSide,depthWrite:false}));
  sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);
  const skyLight=new T.HemisphereLight(),sun=new T.DirectionalLight();
  scene.add(skyLight,sun,sun.target);scene.fog=new T.FogExp2(0xc6d4c6,.00051);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:3,far:220});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.052;sun.shadow.bias=-.00032;
  const clouds=cloudBanks(scene);let last="";
  function update(camera,focus,time,mood,inside){
    sky.position.copy(camera.position);clouds(camera,time,mood);
    if(last!==mood){
      const p=palette[mood];["zenith","horizon"].forEach((key,i)=>u[key].value.set(p[i]));
      sun.color.set(p[4]);skyLight.color.set(p[5]);skyLight.groundColor.set(p[6]);sun.intensity=p[7];skyLight.intensity=p[8];
      u.night.value=p[9];u.amber.value=p[10];scene.fog.color.set(p[1]);scene.fog.density=mood==="front"?.0013:mood==="memory"?.00064:.00029;last=mood;
    }
    sun.position.copy(focus).add(new T.Vector3(26,66,76));sun.target.position.copy(focus);
    sky.visible=!inside;sun.visible=!inside;skyLight.visible=!inside;
  }
  return {update};
}
