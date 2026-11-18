(() => {
  const H=Harbor3D,T=THREE;
  function beacon(scene) {
    const pivot=H.group(scene,"Rotating Fresnel beam",...H.beaconPosition.toArray());
    const length=43,verts=[],uv=[];
    for(let i=0;i<48;i++){
      const a=i*H.tau/48,b=(i+1)*H.tau/48;
      const point=(angle,z,r)=>[Math.cos(angle)*r,Math.sin(angle)*r,z];
      const p=[point(a,0,.12),point(b,0,.12),point(b,length,3.7),point(a,length,3.7)];
      for(const k of [0,1,2,0,2,3]){verts.push(...p[k]);uv.push(k<2?0:1);}
    }
    const geo=H.geometry(verts);geo.setAttribute("along",new T.Float32BufferAttribute(uv,1));
    const beamMat=new T.ShaderMaterial({transparent:true,side:T.BackSide,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{strength:{value:1}},vertexShader:`
attribute float along;varying float dist;varying vec3 world;varying vec3 n;
void main(){dist=along;world=(modelMatrix*vec4(position,1.)).xyz;n=mat3(modelMatrix)*normal;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
      fragmentShader:`uniform float strength;varying float dist;varying vec3 world;varying vec3 n;
void main(){float facing=abs(dot(normalize(n),normalize(cameraPosition-world)));
float a=pow(facing,.66)*exp(-dist*3.3)*(1.-smoothstep(.73,1.,dist))*.37*strength;
gl_FragColor=vec4(1.,.64,.24,a);
#include <colorspace_fragment>
}`});
    const beam=new T.Mesh(geo,beamMat);beam.name="Light scattering volume";pivot.add(beam);
    const corona=new T.Mesh(new T.SphereGeometry(1.02,24,16),new T.ShaderMaterial({
      transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`
      varying vec3 V,N;void main(){vec4 v=modelViewMatrix*vec4(position,1.);V=-v.xyz;N=normalMatrix*normal;gl_Position=projectionMatrix*v;}`,
      fragmentShader:`varying vec3 V,N;void main(){float center=pow(max(0.,dot(normalize(V),normalize(N))),4.);gl_FragColor=vec4(1.,.55,.105,center*.54);}`,
    }));pivot.add(corona);
    const spot=new T.SpotLight("#ffd394",115,48,.126,.72,1.52);pivot.add(spot);
    const target=H.group(pivot,"Beacon aim",0,-1.6,37);spot.target=target;
    const glow=new T.PointLight("#ffc172",9.5,9,1.7);glow.position.copy(H.beaconPosition);scene.add(glow);
    return {pivot,beamMat};
  }
  function seabirds(scene) {
    const flock=[],feather=new T.MeshStandardMaterial({color:"#f1dfbd",roughness:.85,side:T.DoubleSide});
    const tips=H.mat("#404c50");tips.side=T.DoubleSide;
    for(let i=0;i<5;i++) {
      const root=H.group(scene,"Gull "+(i+1)),wings=[];
      const body=H.mesh(root,new T.SphereGeometry(.13,10,6),feather);body.scale.set(.72,.72,2.8);
      for(const side of [-1,1]){
        const wing=H.group(root,"Wing");
        H.mesh(wing,H.geometry([0,.02,-.13, side*.47,.13,-.18, side*.77,.08,.04, 0,.02,-.13,side*.77,.08,.04,0,0,.17]),feather);
        H.mesh(wing,H.geometry([side*.47,.13,-.18,side*1.02,.065,.26,side*.77,.08,.04]),tips);
        wings.push(wing);
      }
      // The shadow map is cached for static architecture and terrain.
      root.traverse(part=>{if(part.isMesh)part.castShadow=false;});
      flock.push({root,wings});
    }
    return (time,storm)=>flock.forEach(({root,wings},i)=>{
      const a=time*.107+i*.30+.73;
      root.position.set(-4+Math.cos(a)*(9+i*.63),10+i*.53+Math.sin(time*.56+i)*.34,-9+Math.sin(a)*5.3);
      root.rotation.y=Math.atan2(-Math.sin(a)*(9+i*.63),Math.cos(a)*5.3);
      root.rotation.z=.13*Math.sin(a);
      const flap=.11+Math.sin(time*3.4+i*2.1)*(.13+.07*Math.sin(time*.47+i));
      wings[0].rotation.z=-flap;wings[1].rotation.z=flap;
      root.visible=storm<.76;
    });
  }
  function weatherFX(scene,common) {
    const rng=H.random(376),drops=[],end=[],speed=[];
    for(let i=0;i<720;i++){
      const x=(rng()-.5)*83,y=rng()*38,z=(rng()-.5)*80,v=.78+rng()*.60;
      drops.push(x,y,z,x,y,z);end.push(0,1);speed.push(v,v);
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(drops,3));geo.setAttribute("tip",new T.Float32BufferAttribute(end,1));geo.setAttribute("speed",new T.Float32BufferAttribute(speed,1));
    const rain=new T.LineSegments(geo,new T.ShaderMaterial({uniforms:common,transparent:true,depthWrite:false,vertexShader:`
uniform float time;attribute float tip,speed;varying float fade;
void main(){vec3 p=position;p.y=mod(position.y-time*speed*13.,38.)-1.;
p.x+=(p.y-18.)*.23;p+=vec3(.15,.65,.02)*tip;vec4 v=modelViewMatrix*vec4(p,1.);
fade=1.-smoothstep(15.,68.,-v.z);gl_Position=projectionMatrix*v;}`,fragmentShader:`
uniform float storm;varying float fade;void main(){gl_FragColor=vec4(.61,.74,.77,storm*fade*.40);}`}));
    rain.frustumCulled=false;rain.name="Wind-driven rain";scene.add(rain);
    const origin=[],seed=[],sites=[[-7.7,3.9],[5.9,5.1],[9.0,1.9],[-12.0,-4.7],[-2.2,5.85],[10,-2.7]];
    sites.forEach(([x,z],j)=>{for(let i=0;i<40;i++){
      origin.push(x,.12,z);seed.push(rng(),rng(),rng(),(j*.163)%1);
    }});
    const sprayGeo=new T.BufferGeometry();sprayGeo.setAttribute("position",new T.Float32BufferAttribute(origin,3));sprayGeo.setAttribute("seed",new T.Float32BufferAttribute(seed,4));
    const spray=new T.Points(sprayGeo,new T.ShaderMaterial({uniforms:common,transparent:true,depthWrite:false,
      vertexShader:`uniform float time,storm,pixelHeight;attribute vec4 seed;varying float alpha;
void main(){float age=fract(time*.19+seed.w)*2.5-seed.x*.17;vec3 p=position;
p.x+=(seed.x-.46)*age*2.2;p.z+=(seed.y-.4)*age*1.9;
p.y+=max(0.,(2.9+seed.z*2.2)*(1.+storm*.43)*age-4.9*age*age);
alpha=smoothstep(0.,.11,age)*(1.-smoothstep(.46,1.02,age))*.53;
vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(pixelHeight*(.028+seed.y*.046)/max(1.,-v.z),1.,6.);}`,
      fragmentShader:`varying float alpha;void main(){float a=(1.-smoothstep(.18,.50,length(gl_PointCoord-.5)))*alpha;if(a<.015)discard;gl_FragColor=vec4(.83,.87,.79,a);}`}));
    spray.name="Breaking-wave spray";spray.frustumCulled=false;scene.add(spray);
    return rain;
  }
  const palettes={
    top:["#476997","#142541","#485b6e"], horizon:["#d79e88","#536783","#8c9c9e"],
    water:["#153e53","#102939","#2c464e"],sun:["#ffbd77","#c1cced","#aabbbe"],
    hemi:["#f7ddbd","#9eafd2","#d1d8d5"],ground:["#83817c","#455563","#6c7375"],
    key:["#ffcf94","#becfee","#d0d5ce"],
  };
  for(const key of Object.keys(palettes))palettes[key]=palettes[key].map(c=>new T.Color(c));
  H.createStage=function(canvas) {
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:"high-performance"});
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    const scene=new T.Scene(), camera=new T.PerspectiveCamera(38,1,.18,620);
    scene.fog=new T.FogExp2("#d5ad98",.012);
    const hemi=new T.HemisphereLight("#ffe7cb","#879392",1.72);scene.add(hemi);
    const key=new T.DirectionalLight("#ffd29e",2.28);key.position.set(-19,26,-13);scene.add(key,key.target);
    key.castShadow=true;key.shadow.mapSize.set(1536,1536);
    Object.assign(key.shadow.camera,{left:-21,right:21,top:22,bottom:-18,near:1,far:82});key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias=-.00045;key.shadow.normalBias=.034;
    const fill=new T.DirectionalLight("#bfd2da",.66);fill.position.set(14,12,20);scene.add(fill);
    const models=H.group(scene,"Headland models");H.buildTerrain(models);H.buildBuildings(models);
    const {u,ocean}=H.makeAtmosphere(scene);u.pixelHeight={value:800};
    const light=beacon(scene),birds=seabirds(scene),rain=weatherFX(scene,u);
    const reflected=new T.PerspectiveCamera(),target=new T.Vector3(),mirrorTarget=new T.Vector3();
    const rt=new T.WebGLRenderTarget(720,405,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
    u.mirrorMap.value=rt.texture;
    const surfaceClip=[new T.Plane(new T.Vector3(0,1,0),.16)];
    let lastMoon=-1,lastStorm=-1,lastReflect=-Infinity;
    const sunDusk=new T.Vector3(-.64,.097,-.76).normalize(),sunMoon=new T.Vector3(-.45,.24,-.86).normalize();
    function atmosphere(moon,storm) {
      const paint=(dest,colors)=>dest.copy(colors[0]).lerp(colors[1],moon).lerp(colors[2],storm);
      paint(u.zenith.value,palettes.top);paint(u.horizon.value,palettes.horizon);
      paint(u.waterColor.value,palettes.water);paint(u.sunColor.value,palettes.sun);
      paint(hemi.color,palettes.hemi);paint(hemi.groundColor,palettes.ground);paint(key.color,palettes.key);
      scene.fog.color.copy(u.horizon.value);scene.fog.density=.008+.003*moon+.011*storm;
      hemi.intensity=1.66-.82*moon-.23*storm;key.intensity=2.36-1.64*moon-1.28*storm;
      fill.intensity=.79-.47*moon-.16*storm;
      u.sunDir.value.copy(sunDusk).lerp(sunMoon,moon).normalize();
      u.moon.value=moon;u.storm.value=storm;light.beamMat.uniforms.strength.value=1+moon*.46+storm*.44;
      lastMoon=moon;lastStorm=storm;
    }
    let currentAspect=1;
    function resize(width,height) {
      renderer.setSize(width,height,false);currentAspect=width/height;camera.aspect=currentAspect;camera.updateProjectionMatrix();
      const scale=Math.min(1,820/width,510/height);rt.setSize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
      u.pixelHeight.value=height;lastReflect=-Infinity;
    }
    let previousPose="";
    function draw(view) {
      const {yaw,pitch,radius,time,weather:[moon,storm]}=view;
      const newSky=moon!==lastMoon||storm!==lastStorm;
      if(newSky)atmosphere(moon,storm);
      const d=radius*Math.max(1,Math.pow(1.02/currentAspect,.58));
      target.set(-1.10,7.35,0);
      camera.position.set(target.x+d*Math.cos(pitch)*Math.sin(yaw),target.y+d*Math.sin(pitch),target.z+d*Math.cos(pitch)*Math.cos(yaw));
      camera.lookAt(target);camera.updateMatrixWorld();u.time.value=time;
      light.pivot.rotation.y=-1.65+time*.29;u.lampAngle.value=light.pivot.rotation.y;
      birds(time,storm);rain.visible=storm>.006;
      const pose=[yaw,pitch,radius].join(",");
      if(newSky||pose!==previousPose||time-lastReflect>.055||time<lastReflect){
        reflected.copy(camera);reflected.position.y=-camera.position.y;reflected.up.set(0,-1,0);
        mirrorTarget.copy(target);mirrorTarget.y=-target.y;reflected.lookAt(mirrorTarget);reflected.updateMatrixWorld();
        u.mirrorMatrix.value.multiplyMatrices(reflected.projectionMatrix,reflected.matrixWorldInverse);
        ocean.visible=false;renderer.clippingPlanes=surfaceClip;renderer.setRenderTarget(rt);
        renderer.render(scene,reflected);renderer.setRenderTarget(null);renderer.clippingPlanes=[];ocean.visible=true;
        previousPose=pose;lastReflect=time;
      }
      renderer.render(scene,camera);
    }
    renderer.shadowMap.needsUpdate=true;
    return {renderer,scene,camera,resize,draw};
  };
})();
