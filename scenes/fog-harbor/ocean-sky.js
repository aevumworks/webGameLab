(() => {
  const H=Harbor3D,T=THREE;
  const noise = `
float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z); }
float noise2(vec2 p) {vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float cloud(vec2 p){return .54*noise2(p)+.28*noise2(p*2.07+14.3)+.13*noise2(p*4.17-7.7)+.05*noise2(p*8.51);}
`;
  H.makeAtmosphere=function(scene) {
    const u={
      time:{value:0},moon:{value:0},storm:{value:0},sunDir:{value:new T.Vector3(-.64,.10,-.76).normalize()},
      zenith:{value:new T.Color()},horizon:{value:new T.Color()},waterColor:{value:new T.Color()},
      sunColor:{value:new T.Color()},lamp:{value:H.beaconPosition},lampAngle:{value:0},
      shores:{value:H.shores.map(([x,z,rx,rz])=>new T.Vector4(x,z,rx,rz))},
      mirrorMap:{value:null},mirrorMatrix:{value:new T.Matrix4()},
    };
    const sky=new T.Mesh(new T.SphereGeometry(490,40,22),new T.ShaderMaterial({
      uniforms:u,side:T.BackSide,depthWrite:false,
      vertexShader:`varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
      fragmentShader:noise+`
uniform float time,moon,storm;uniform vec3 sunDir,zenith,horizon,sunColor;varying vec3 world;
void main(){
  vec3 dir=normalize(world-cameraPosition);float y=max(dir.y,0.);
  vec3 col=mix(horizon,zenith,1.-exp(-y*8.3));
  float alignment=max(dot(dir,sunDir),0.);
  col+=sunColor*(pow(alignment,11.)*.09+pow(alignment,70.)*.18)*(1.-.85*storm);
  vec2 coord=dir.xz/(max(y,.009)+.23);
  float bank=cloud(coord*1.45+vec2(time*.010,time*.0018));
  float cirrus=cloud(coord*vec2(.89,2.6)-vec2(time*.003,1.1));
  float weatherCloud=smoothstep(.48-.10*storm,.76-.075*storm,bank*.75+cirrus*.25);
  float cloudMask=weatherCloud*smoothstep(-.018,.12,dir.y);
  vec3 cloudInk=mix(horizon*.57+zenith*.24,vec3(.24,.28,.32),storm*.34);
  float lining=smoothstep(.40,.61,bank)*(1.-smoothstep(.57,.74,bank))*pow(alignment,2.);
  col=mix(col,cloudInk,cloudMask*(.68+.26*storm))+sunColor*lining*.11*(1.-storm);
  float disc=1.-smoothstep(.024,.027,length(dir-sunDir));
  col+=sunColor*(disc*2.8+pow(alignment,550.)*.48)*(1.-cloudMask*.70)*(1.-storm*.97);
  vec2 stars=vec2(atan(dir.z,dir.x)*.15915494,asin(dir.y)*.31831)*vec2(760.,330.);
  float h=hash(floor(stars));float star=(1.-smoothstep(.018,.10,length(fract(stars)-vec2(fract(h*57.),fract(h*83.)))));
  col+=vec3(.76,.85,1.)*star*step(.964,h)*moon*smoothstep(.04,.26,y)*(1.-cloudMask);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    }));
    sky.name="Procedural atmosphere";sky.renderOrder=-10;scene.add(sky);

    const n=152,pos=[],indices=[];
    function span(i){const v=i/n*2-1;return Math.sign(v)*(Math.abs(v)*22+Math.pow(Math.abs(v),3.45)*375);}
    for(let z=0;z<=n;z++)for(let x=0;x<=n;x++)pos.push(span(x),0,span(z));
    for(let z=0;z<n;z++)for(let x=0;x<n;x++){
      const a=z*(n+1)+x;indices.push(a,a+n+1,a+1,a+1,a+n+1,a+n+2);
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));geo.setIndex(indices);
    const seas=`
uniform float time,storm;
void wave(vec2 p,vec2 dir,float k,float amp,float speed,inout float h,inout vec2 slope){
  float a=dot(dir,p)*k+time*speed;h+=amp*sin(a);slope+=dir*(amp*k*cos(a));
}
void surface(vec2 p,out float h,out vec2 slope){
  h=0.;slope=vec2(0.);float scale=1.+storm*.78;
  wave(p,vec2(.90,.436),.86,.18*scale,1.10,h,slope);
  wave(p,vec2(-.38,.925),1.39,.091*scale,1.42,h,slope);
  wave(p,vec2(.59,-.808),2.21,.043*scale,1.85,h,slope);
  wave(p,vec2(.96,-.28),.31,.16*scale,.66,h,slope);
}`;
    const oceanMat=new T.ShaderMaterial({uniforms:u,
      vertexShader:seas+`
varying vec3 world;void main(){
  float h;vec2 slope;surface(position.xz,h,slope);
  world=vec3(position.x,h,position.z);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
}`,
      fragmentShader:seas+noise+`
uniform float moon,lampAngle;uniform vec3 waterColor,horizon,zenith,sunColor,sunDir,lamp;
uniform sampler2D mirrorMap;uniform mat4 mirrorMatrix;uniform vec4 shores[6];varying vec3 world;
float coastDistance(vec2 p){
  float distanceToLand=1000.;
  for(int i=0;i<6;i++){
    vec2 q=(p-shores[i].xy)/shores[i].zw;float a=atan(q.y,q.x);
    float outline=i==0?1.+.088*sin(3.*a+.4)+.065*cos(5.*a-.6)+.034*sin(9.*a+1.1):1.+.09*sin(a*3.+float(i));
    distanceToLand=min(distanceToLand,(length(q)-outline)*min(shores[i].z,shores[i].w));
  }return distanceToLand;
}
void main(){
 vec2 p=world.xz;float h;vec2 slope;surface(p,h,slope);
 float farFade=1.-smoothstep(27.,113.,length(world-cameraPosition));
 vec2 ripple=vec2(sin(dot(p,vec2(4.4,1.3))+time*2.4),cos(dot(p,vec2(-2.,5.2))+time*2.7));
 float grain=noise2(p*1.57+time*.17);
 slope*=.42+.58*farFade;
 slope+=(.058+.029*storm)*ripple*farFade + (grain-.5)*.083;
 slope+=vec2(sin(p.x*8.4+p.y*3.7+time*3.1),sin(p.y*7.8-p.x*2.6-time*2.6))*.021*farFade;
 vec3 normal=normalize(vec3(-slope.x,1.,-slope.y)),eye=normalize(cameraPosition-world);
 float fresnel=.075+.65*pow(1.-max(dot(eye,normal),0.),4.0);
 vec4 proj=mirrorMatrix*vec4(world,1.);vec2 uv=proj.xy/proj.w*.5+.5;
 uv+=slope*vec2(.031,.043)*farFade;
 vec3 reflection=texture2D(mirrorMap,clamp(uv,.002,.998)).rgb;
 float shore=coastDistance(p);
 vec3 shallow=mix(vec3(.019,.133,.127),waterColor,moon*.69+storm*.18);
 vec3 body=mix(waterColor,shallow,exp(-max(0.,shore)*.33)*.92);
 body*=.91+.17*(normal.y+.48*normal.z)+.045*(grain-.5);
 vec3 col=mix(body,reflection,fresnel);
 vec3 halfVec=normalize(eye+sunDir);
 float sparkle=pow(max(dot(normal,halfVec),0.),mix(240.,132.,storm))*(.14+.86*grain);
 col+=sunColor*sparkle*(.88-.66*storm);
 vec3 fromLamp=world-lamp;vec2 heading=vec2(sin(lampAngle),cos(lampAngle));
 float cone=pow(max(dot(normalize(fromLamp.xz),heading),0.),18.);
 float lightGlint=pow(max(dot(normal,normalize(eye-normalize(fromLamp))),0.),43.);
 col+=vec3(1.,.53,.15)*cone*lightGlint*1.5/(1.+.002*dot(fromLamp,fromLamp));
 float wash=shore+.23*sin(time*1.65+p.x*.6)+.29*(noise2(p*1.14+time*.045)-.5);
 float fringe=exp(-abs(wash)*2.5)+.56*exp(-abs(wash-1.05-.22*sin(time+p.y)) * 3.8);
 float lace=smoothstep(.38,.67,grain*.49+noise2(p*4.7-time*.27)*.51);
 float caps=smoothstep(.25,.45,h)*smoothstep(.56,.77,grain)*(.09+.26*storm);
 float foam=clamp(fringe*(.15+.85*lace)+caps,0.,.81);
 vec3 froth=mix(vec3(.72,.78,.65),vec3(.26,.41,.47),moon+storm*.36);
 col=mix(col,froth,foam*farFade);
 float haze=smoothstep(60.,240.,length(world-cameraPosition));
 col=mix(col,horizon,haze*.92);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
    const ocean=new T.Mesh(geo,oceanMat);ocean.name="Displaced tidal surface";ocean.frustumCulled=false;scene.add(ocean);
    return {u,ocean};
  };
})();
