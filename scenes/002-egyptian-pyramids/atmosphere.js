const T=globalThis.THREE;
const vertex=`varying vec3 skyDir;void main(){skyDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const frag=`
varying vec3 skyDir;uniform vec3 sunDir;uniform float evening;
float hash2(vec2 p){p=fract(p*vec2(.1031,.11369));p+=dot(p,p.yx+19.19);return fract(p.x*p.y);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
float cloud(vec2 p){float s=0.;mat2 r=mat2(.82,.57,-.57,.82);float a=.5;for(int i=0;i<5;i++){s+=a*noise2(p);p=r*p*2.06+12.7;a*=.5;}return s;}
void main(){
  vec3 w=normalize(skyDir);float h=max(w.y,0.);
  float v=1.-exp(-h*2.8);
  vec3 horizon=mix(vec3(.89,.55,.31),vec3(.48,.227,.151),evening);
  vec3 upper=mix(vec3(.040,.152,.264),vec3(.013,.028,.094),evening);
  vec3 col=mix(horizon,upper,pow(v,.43));
  vec2 plane=w.xz/max(.105,h+.09);
  float coverage=cloud(plane*vec2(1.35,3.8)+vec2(7.,13.));
  float comb=cloud(plane*vec2(3.5,12.)+coverage*3.);
  float mist=smoothstep(.53,.78,coverage*.76+comb*.24)*smoothstep(.005,.18,h);
  col=mix(col,mix(vec3(.91,.73,.57),vec3(.48,.30,.27),evening),mist*.45);
  float angle=max(0.,dot(w,normalize(sunDir)));
  col+=mix(vec3(1.45,.76,.33),vec3(.84,.27,.09),evening)*pow(angle,16.)*.39;
  col+=mix(vec3(1.2,.77,.40),vec3(1.1,.45,.205),evening)*pow(angle,210.)*.72;
  col+=vec3(7.2,4.6,2.3)*smoothstep(.99973,.99989,angle)*(1.-.62*evening);
  col=mix(col,horizon,1.-smoothstep(-.055,.008,w.y));
  col=mix(mix(vec3(.18,.11,.070),vec3(.075,.057,.057),evening),col,smoothstep(-.21,-.008,w.y));
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function lighting(renderer,scene,fixtures,coarse){
  const day=new T.Vector3(-.86,.37,.49).normalize(),dusk=new T.Vector3(-.85,.09,-.52).normalize();
  const shader=new T.ShaderMaterial({uniforms:{sunDir:{value:day.clone()},evening:{value:0}},vertexShader:vertex,fragmentShader:frag,side:T.BackSide,depthWrite:false,fog:false});
  const geo=new T.SphereGeometry(1,40,20), sky=new T.Mesh(geo,shader);sky.scale.setScalar(2050);sky.renderOrder=-1000;sky.frustumCulled=false;scene.add(sky);
  const envScene=new T.Scene();envScene.background=new T.Color(0xb99b76);
  const envDome=new T.Mesh(geo,shader);envDome.scale.setScalar(15);envScene.add(envDome);
  const pmrem=new T.PMREMGenerator(renderer);
  const envDay=pmrem.fromScene(envScene,.035,.1,50);shader.uniforms.sunDir.value.copy(dusk);shader.uniforms.evening.value=1;
  const envDusk=pmrem.fromScene(envScene,.045,.1,50);pmrem.dispose();
  const hemi=new T.HemisphereLight(0xffecce,0xb08b65,1.35),sun=new T.DirectionalLight(0xffdcaa,3.0);
  scene.add(hemi,sun,sun.target);sun.castShadow=true;
  const shadow=sun.shadow,R=coarse?27:38;Object.assign(shadow.camera,{left:-R,right:R,top:R,bottom:-R,near:2,far:285});
  shadow.camera.updateProjectionMatrix();
  shadow.mapSize.setScalar(coarse?1024:2048);shadow.bias=-.00027;shadow.normalBias=.034;shadow.radius=2;
  const local=[0,1,2].map(()=>{const l=new T.PointLight(0xffb972,0,13,2);scene.add(l);return l;});
  const haze=new T.Color(0xbba487),cool=new T.Color(0x947d86);scene.fog=new T.FogExp2(haze,.00105);
  const focus=new T.Vector3(Infinity,0,0);let twilight=false,mix=-1,enclosed=false,shade=-1,lightCell="";
  function update(cam,state,dt,propChanged=false,evening){
    const indoor=state==="passage"||state==="gallery"||state==="antechamber"||state==="chamber";
    const next=evening??T.MathUtils.damp(Math.max(0,mix),twilight?1:0,2.1,dt);
    const shelter=state==="portal"||state==="passage"?1-T.MathUtils.smoothstep(cam.position.z,95,110):Number(indoor);
    const changed=Math.abs(next-mix)>.0007||indoor!==enclosed||Math.abs(shelter-shade)>.002;
    if(changed){
      mix=next;shader.uniforms.evening.value=mix;shader.uniforms.sunDir.value.lerpVectors(day,dusk,mix).normalize();
      scene.environment=indoor?null:(mix>.5?envDusk.texture:envDay.texture);
      shade=shelter;
      hemi.color.setHex(0xbfd2e5).lerp(new T.Color(0xc1bbaf),shade);
      hemi.groundColor.setHex(0x91745b).lerp(new T.Color(0x765344),shade);
      hemi.intensity=T.MathUtils.lerp(.74-.18*mix,.40,shade);
      sun.intensity=T.MathUtils.lerp(3.12-1.49*mix,.08,shade);
      sun.color.setHex(0xffd4a2).lerp(new T.Color(0xffa46e),mix);
      scene.fog.color.copy(haze).lerp(cool,mix);scene.fog.density=T.MathUtils.lerp(.00061+.00035*mix,.0016,shade);
      renderer.toneMappingExposure=T.MathUtils.lerp(.94+.03*mix,1.15,shade);enclosed=indoor;
    }
    const pos=cam.position;sky.position.copy(pos);
    if(changed||propChanged||focus.distanceToSquared(pos)>70){
      focus.copy(pos);sun.target.position.set(pos.x,pos.y-1.1,pos.z);
      sun.position.copy(sun.target.position).addScaledVector(shader.uniforms.sunDir.value,155);
      renderer.shadowMap.needsUpdate=true;
    }
    const cell=indoor?state+":"+Math.round(pos.z/2)+":"+Math.round(pos.x/2):"outside";
    if(cell!==lightCell){
      lightCell=cell;
      if(indoor){
        const near=fixtures.map(p=>({p,d:(p[0]-pos.x)**2+(p[1]-pos.y)**2+(p[2]-pos.z)**2})).sort((a,b)=>a.d-b.d);
        local.forEach((l,i)=>{l.position.fromArray(near[i].p);l.intensity=state==="chamber"?12:6.3;});
      }else local.forEach(l=>l.intensity=0);
    }
  }
  return {update,toggle(){twilight=!twilight;return twilight;}};
}
