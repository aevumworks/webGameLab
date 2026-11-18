import {T,TAU,random,shaderNoise,mix} from "./atelier.js";
import {cloudBanks} from "./clouds.js";

const skyVertex=`varying vec3 vRay;
void main(){vRay=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`;
const skyFragment=`varying vec3 vRay;
uniform vec3 zenith,horizon,cloudLight,cloudShade;uniform float clock,night,amber;
${shaderNoise}
float fbm(vec2 p){
  float f=paintNoise(p)*.527;p=mat2(1.72,1.17,-1.17,1.72)*p+3.2;
  f+=paintNoise(p)*.264;p=mat2(1.80,-.93,.93,1.8)*p+4.;
  f+=paintNoise(p)*.139;return f+paintNoise(p*2.13)*.070;
}
float cloudField(vec2 p){return fbm(p+vec2(.7*paintNoise(p*.51),.4*paintNoise(p*.48+2.)));}
void main(){
  vec3 d=normalize(vRay);float y=max(d.y,0.);
  vec3 col=mix(horizon,zenith,smoothstep(-.08,.53,pow(y,.75)));
  vec2 uv=d.xz/(y+.17)*1.84+vec2(.027*clock/12.,-.017*clock/12.);
  float f=cloudField(uv),density=smoothstep(.48,.665,f);
  float relief=clamp((f-cloudField(uv+vec2(.13,.095)))*4.6+.61,.06,1.);
  vec3 clouds=mix(cloudShade,cloudLight,relief);
  clouds=mix(clouds,horizon,(1.-smoothstep(0.,.26,y))*.50);
  col=mix(col,clouds,density*smoothstep(-.035,.20,d.y)*(.18+night*.33));
  float sun=clamp(dot(d,normalize(vec3(-.78,.62,.66))),0.,1.);
  col+=vec3(.28,.19,.08)*pow(sun,18.)*(.60+amber*.38)*(1.-night);
  vec2 sphere=vec2(atan(d.z,d.x),asin(d.y))*420.;
  vec2 cell=floor(sphere),point=fract(sphere)-.5;
  float star=(1.-smoothstep(.025,.115,length(point)))*step(.977,hash21(cell));
  col+=vec3(.8,.83,.75)*star*night*smoothstep(.02,.22,d.y)*(1.-density*.7);
  gl_FragColor=vec4(col,1.);
  #include <colorspace_fragment>
}`;
const palette={
  day:["#217eb6","#aed2dc","#fff4d7","#a9c4ce","#ffe9c8","#d5e8fa","#939aa2",2.46,1.65,0,0],
  gold:["#628ba6","#f4cb93","#ffe6b4","#b5a49e","#ffd2a2","#f3d7bb","#878165",2.05,1.43,0,1],
  dusk:["#454e71","#ce9888","#dfb7a2","#7f7d91","#ffc299","#d1b1bd","#68646a",1.48,1.33,.20,.75],
  night:["#142942","#38516a","#63738e","#314559","#bbd7ec","#a4bfd0","#565c69",.85,1.14,1,0],
  front:["#292d47","#ad725e","#9e8282","#514c60","#e6aba1","#b5adc2","#635b62",1.24,1.12,.55,.65],
  memory:["#122a4b","#60889b","#8b9eb2","#384f70","#bdddf5","#abc9df","#5b6e78",.92,1.27,1,0]
};
export function atmosphere(scene){
  const u={};
  for(const key of ["zenith","horizon","cloudLight","cloudShade"])u[key]={value:new T.Color()};
  for(const key of ["clock","night","amber"])u[key]={value:0};
  const sky=new T.Mesh(new T.SphereGeometry(100,32,20),new T.ShaderMaterial({vertexShader:skyVertex,fragmentShader:skyFragment,uniforms:u,side:T.BackSide,depthWrite:false}));
  sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);
  const skyLight=new T.HemisphereLight(),sun=new T.DirectionalLight();
  scene.add(skyLight,sun,sun.target);scene.fog=new T.FogExp2(0xc6d4c6,.00051);
  sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
  Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:3,far:220});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.052;sun.shadow.bias=-.00032;
  const clouds=cloudBanks(scene);let last="";
  function update(camera,focus,time,mood,inside){
    sky.position.copy(camera.position);u.clock.value=time;clouds(camera,time,mood);
    if(last!==mood){
      const p=palette[mood];["zenith","horizon","cloudLight","cloudShade"].forEach((key,i)=>u[key].value.set(p[i]));
      sun.color.set(p[4]);skyLight.color.set(p[5]);skyLight.groundColor.set(p[6]);sun.intensity=p[7];skyLight.intensity=p[8];
      u.night.value=p[9];u.amber.value=p[10];scene.fog.color.set(p[1]);scene.fog.density=mood==="front"?.0013:mood==="memory"?.00064:.00029;last=mood;
    }
    sun.position.copy(focus).add(new T.Vector3(-70,55,59));sun.target.position.copy(focus);
    sky.visible=!inside;sun.visible=!inside;skyLight.visible=!inside;
  }
  return {update};
}
export function engineSmoke(castle){
  const count=64,r=random(1974),pos=new Float32Array(count*3),size=new Float32Array(count),fades=new Float32Array(count),seeds=new Float32Array(count);
  const ages=[],life=[],outlets=[],birth=[];
  for(let i=0;i<count;i++){seeds[i]=r()*20;life[i]=4.5+r()*3.1;ages[i]=life[i]*(i/count);outlets[i]=i%castle.sockets.length;birth[i]=new T.Vector3();}
  const g=new T.BufferGeometry();
  for(const [key,array,dim] of [["position",pos,3],["s",size,1],["alpha",fades,1],["seed",seeds,1]])g.setAttribute(key,new T.BufferAttribute(array,dim));
  const u={height:{value:700},tintSmoke:{value:new T.Color()}};
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:u,
    vertexShader:`attribute float s,alpha,seed;uniform float height;varying float a,j;
    void main(){a=alpha;j=seed;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
    gl_PointSize=clamp(s*height/max(1.,-p.z),1.,500.);}`,
    fragmentShader:`varying float a,j;uniform vec3 tintSmoke;${shaderNoise}
    void main(){vec2 q=gl_PointCoord-.5;float n=paintNoise(q*5.+j)*.63+paintNoise(q*13.+j)*.29+paintNoise(q*29.+j)*.08;
      float edge=length(q)*2.+(n-.51)*.61;
      float op=(1.-smoothstep(.45,1.,edge))*a;if(op<.012)discard;
      gl_FragColor=vec4(tintSmoke*(.66+.53*n+(q.y+.5)*.18),op);
      #include <colorspace_fragment>
    }`});
  const points=new T.Points(g,mat);points.frustumCulled=false;points.renderOrder=3;
  function outlet(i){return castle.body.localToWorld(castle.sockets[outlets[i]].clone());}
  function reset(){castle.root.updateMatrixWorld(true);for(let i=0;i<count;i++)birth[i].copy(outlet(i));}
  function update(dt,time,screen,throttle){
    u.height.value=screen;u.tintSmoke.value.set(castle.flying?0x9aa79f:0x72736c);castle.root.updateMatrixWorld(true);
    for(let i=0;i<count;i++){
      ages[i]+=dt*(1+throttle*.18);
      if(ages[i]>life[i]){ages[i]%=life[i];birth[i].copy(outlet(i));}
      const a=ages[i],f=a/life[i],j=seeds[i];
      pos[i*3]=birth[i].x+a*(1.27+.13*j)+Math.sin(a*1.26+j)*f*1.36;
      pos[i*3+1]=birth[i].y+a*(1.84+.26*Math.sin(j))+.30*Math.sin(a+j);
      pos[i*3+2]=birth[i].z-a*.38+Math.cos(a+j)*f*1.7;
      size[i]=(1.50+f*7.7)*(1+.12*Math.sin(j));fades[i]=Math.sin(Math.min(1,f*7)*Math.PI*.5)*(1-f)*.53;
    }
    for(const key of ["position","s","alpha"])g.attributes[key].needsUpdate=true;
  }
  return {points,reset,update};
}
