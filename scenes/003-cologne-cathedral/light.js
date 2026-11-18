import {buildQuarter} from "./quarter.js";
import {daylight} from "./masonry.js";
const T=globalThis.THREE;
function skyMaterial(hour){
  return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{hour},vertexShader:`
    varying vec3 D;void main(){D=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    uniform float hour;varying vec3 D;
    float hash(vec2 p){return fract(sin(dot(p,vec2(37.19,148.37)))*42858.19);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fb(vec2 p){return n(p)*.49+n(p*2.08+.7)*.27+n(p*4.14+4.1)*.135+n(p*8.4+5.2)*.068+n(p*17.)*.035;}
    void main(){
      vec3 d=normalize(D);float h=max(0.,d.y);
      vec3 sunlight=normalize(mix(vec3(.59,.69,.65),vec3(.47,.20,.88),hour));
      float sun=max(0.,dot(d,sunlight));
      vec3 horizon=mix(vec3(.69,.76,.78),vec3(1.,.57,.33),hour),zenith=mix(vec3(.10,.27,.47),vec3(.065,.13,.28),hour);
      vec3 col=mix(horizon,zenith,pow(min(h,1.),.58));
      vec2 uv=d.xz/(h+.115)*vec2(.71,1.19)+vec2(2.81,-1.14);float density=fb(uv),wisps=fb(uv*vec2(3.4,1.18)+7.);
      float clouds=smoothstep(.41,.70,density+.13*(wisps-.5))*smoothstep(.005,.14,h);
      vec3 lit=mix(vec3(.91,.94,.96),vec3(1.26,.65,.38),hour);
      col=mix(col,mix(lit*.68,lit,smoothstep(.34,.63,fb(uv+sunlight.xz*.14))),clouds*.91);
      col+=mix(vec3(1.,.86,.60),vec3(1.,.54,.21),hour)*(.24*pow(sun,10.)+.82*pow(sun,100.)+5.*smoothstep(.9993,.99984,sun))*(1.-clouds*.6);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
}
export async function surroundings(scene,building,renderer){
  const hour={value:0},sky=new T.Mesh(new T.SphereGeometry(530,32,20),skyMaterial(hour));sky.renderOrder=-25;scene.add(sky);
  await buildQuarter(scene,building.userData.solids);
  // Filter one procedural sky for each lighting condition. Stone, glazing and gilding share the incident light.
  const dome=new T.Scene(),probe=sky.clone();dome.add(probe);const pmrem=new T.PMREMGenerator(renderer);
  const skies=[0,1].map(h=>{hour.value=h;return pmrem.fromScene(dome,.035,.1,610);});hour.value=0;pmrem.dispose();
  scene.traverse(o=>{if(o.material?.isMeshStandardMaterial)o.material.envMapIntensity=o.name==="gold"||o.name==="gilt"?1.05:o.name==="enamel"?.72:.30;});
  const hemi=new T.HemisphereLight(0xe6eff7,0x948079,.71);
  const sun=new T.DirectionalLight(0xffdea9,2.85);sun.target.position.set(0,9,-60);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-128,right:128,top:151,bottom:-97,near:1,far:430});sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias=.05;sun.shadow.bias=-.00025;
  const fill=new T.DirectionalLight(0xb0cfef,.55);fill.position.set(-85,55,-23);
  const shrine=new T.PointLight(0xffde94,50,24,1.6);shrine.position.set(2.4,4.8,-119.1);
  scene.add(hemi,sun,sun.target,fill,shrine);
  const glass=building.children.filter(m=>m.name.startsWith("glass"));
  const beamMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{power:{value:.065}},vertexShader:`
    varying vec2 U;void main(){U=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec2 U;uniform float power;void main(){float strip=pow(max(0.,sin(U.x*3.14159)),2.2);
    float breakup=.33+.67*smoothstep(.04,.20,abs(fract(U.x*3.8)-.5));float v=strip*breakup*sin(3.14159*(.035+.93*U.y));
    gl_FragColor=vec4(mix(vec3(.80,.79,.91),vec3(1.,.80,.50),U.x),power*v);}`});
  for(const z of [-32,-50,-65,-95,-109]){
    const p=[],uv=[];for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
      p.push(7.14-13.0*v,34.5-32.4*v,z+u*(3.6+v*2)-v*7.1);uv.push(u,v);}
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));scene.add(new T.Mesh(g,beamMaterial));
  }
  function mode(evening){
    hour.value=evening?1:0;daylight.value=evening?.24:1;scene.environment=skies[hour.value].texture;
    scene.fog.color.set(evening?0xb3a197:0xc8ced1);
    hemi.intensity=evening?.43:.72;hemi.color.set(evening?0xc7d5ed:0xe7eff7);sun.intensity=evening?1.82:2.86;
    sun.color.set(evening?0xffae72:0xffe0af);sun.position.set(evening?73:91,evening?41:121,evening?103:79);
    fill.intensity=evening?.33:.53;shrine.intensity=evening?95:52;beamMaterial.uniforms.power.value=evening?.026:.072;
    glass.forEach(m=>m.material.color.setScalar(evening?.68:.94));renderer.shadowMap.needsUpdate=true;
  }
  return {mode};
}
