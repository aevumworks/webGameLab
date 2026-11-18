const T=globalThis.THREE;
export function surroundings(scene,building,renderer){
  const uniforms={hour:{value:0}};
  const sky=new T.Mesh(new T.SphereGeometry(400,32,18),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,vertexShader:`
  varying vec3 D;void main(){D=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
  varying vec3 D;uniform float hour;float hash(vec2 q){return fract(sin(dot(q,vec2(93.1,53.7)))*42381.43);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  void main(){vec3 d=normalize(D);float h=max(0.,d.y);vec2 uv=d.xz/(h+.16)*vec2(.93,1.51);
  float f=.55*noise(uv)+.27*noise(2.13*uv)+.13*noise(4.1*uv)+.05*noise(8.6*uv);
  vec3 day=mix(vec3(.86,.82,.74),vec3(.32,.52,.69),smoothstep(.0,.85,h));day=mix(day,vec3(.99,.94,.83),smoothstep(.53,.76,f)*.79);
  vec3 eve=mix(vec3(.70,.57,.51),vec3(.15,.23,.40),smoothstep(0.,.72,h));eve=mix(eve,vec3(.56,.51,.56),smoothstep(.47,.76,f)*.62);
  gl_FragColor=vec4(mix(day,eve,hour),1.);}`}));
  sky.renderOrder=-20;scene.add(sky);
  const plaza=new T.Mesh(new T.PlaneGeometry(390,380),new T.MeshStandardMaterial({color:0xaaa6a1,roughness:.86}));
  const cv=document.createElement("canvas");cv.width=cv.height=256;const g=cv.getContext("2d");let seed=274;
  const rand=()=>((seed=(seed*16807)%2147483647)/2147483647);
  g.fillStyle="#888680";g.fillRect(0,0,256,256);
  for(let j=0;j<8;j++)for(let i=-1;i<5;i++){const val=143+Math.floor(rand()*27),x=(i+(j%2)*.5)*64,y=j*32;
    g.fillStyle="rgb("+val+","+(val-1)+","+(val-3)+")";g.fillRect(x+.7,y+.6,63,31);
    for(let n=0;n<70;n++){g.fillStyle=n%2?"#ffffff0b":"#28232310";g.fillRect(x+rand()*64,y+rand()*32,1.0+rand()*1.3,1);}}
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(70,68);tex.anisotropy=8;plaza.material.map=tex;plaza.rotation.x=-Math.PI/2;plaza.position.set(0,-.16,-16);plaza.receiveShadow=true;scene.add(plaza);
  const surroundings=new T.Group();scene.add(surroundings);
  const cityMaterials=["#a1978d","#ada49a","#b1a99a","#938f89"].map(c=>new T.MeshStandardMaterial({color:c,roughness:.95}));
  const roof=new T.MeshStandardMaterial({color:"#74797a",roughness:.90}),bgbox=new T.BoxGeometry(1,1,1);
  const windowMatrices=[],corniceMatrices=[],frame=new T.Object3D(),canopy=new T.CylinderGeometry(.58,1,1,4);
  for(let j=0;j<58;j++){const a=j/58*Math.PI*2,r=155+rand()*11,h=8+rand()*9,w=13+rand()*9,d=9+rand()*8;
    const x=Math.cos(a)*r,z=-28+Math.sin(a)*r,b=new T.Mesh(bgbox,cityMaterials[j%4]);b.position.set(x,h/2-.17,z);b.scale.set(w,h,d);b.rotation.y=-a;surroundings.add(b);
    const parapet=new T.Mesh(canopy,roof);parapet.position.set(x,h+1.82,z);parapet.scale.set(w*.72,3.95,d*.78);parapet.rotation.y=-a+Math.PI/4;surroundings.add(parapet);
    const tangent=new T.Vector3(Math.cos(a),0,Math.sin(a)),face=new T.Vector3(Math.sin(a),0,-Math.cos(a));
    for(const sign of [-1,1])for(let yy=2.2;yy<h-.6;yy+=3.05){
      frame.position.set(x,yy-1.30,z).addScaledVector(face,sign*(d+.08)/2);frame.rotation.set(0,-a,0);frame.scale.set(w+.08,.16,.21);frame.updateMatrix();corniceMatrices.push(frame.matrix.clone());
      for(let xx=-w/2+1.55;xx<w/2-.6;xx+=2.65){frame.position.set(x,yy,z).addScaledVector(tangent,xx).addScaledVector(face,sign*(d+.10)/2);
        frame.scale.set(1.18,1.67,.10);frame.updateMatrix();windowMatrices.push(frame.matrix.clone());}}}
  for(const [list,color] of [[windowMatrices,0x5b6365],[corniceMatrices,0xb4a697]]){const mesh=new T.InstancedMesh(bgbox,new T.MeshStandardMaterial({color,roughness:.82}),list.length);list.forEach((v,i)=>mesh.setMatrixAt(i,v));mesh.computeBoundingSphere();surroundings.add(mesh);}
  const ambient=new T.HemisphereLight(0xffedda,0x9c97a2,1.23),sun=new T.DirectionalLight(0xffdfae,2.74);
  sun.position.set(85,115,-12);sun.target.position.set(0,4,-67);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-104,right:104,top:140,bottom:-80,near:1,far:330});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.067;sun.shadow.bias=-.00027;
  const fill=new T.DirectionalLight(0xabc9f2,.67);fill.position.set(-55,42,31);scene.add(ambient,sun,sun.target,fill);
  const lamp=new T.PointLight(0xffbd6e,72,34,1.4);lamp.position.set(0,5.4,-116.8);scene.add(lamp);
  const glass=building.children.filter(m=>m.name.startsWith("glass"));
  const rays=new T.Group();scene.add(rays);
  const beamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{power:{value:.095}},
    vertexShader:`varying vec2 U;void main(){U=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 U;uniform float power;void main(){float beam=pow(max(sin(3.14159*U.x),0.),1.7)*sin(3.14159*(.04+.91*U.y));gl_FragColor=vec4(vec3(.98,.77,.47),power*beam);}`});
  for(const z of [-32,-50,-65,-95,-109]){const pos=[],uv=[];for(const o of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){const [u,v]=o;pos.push(7.10-12.8*v,34.5-32.0*v,z+u*(2.9+v*2)-v*5.5);uv.push(u,v);}
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));rays.add(new T.Mesh(g,beamMat));}
  function mode(evening){uniforms.hour.value=evening?1:0;ambient.intensity=evening?.69:1.23;ambient.color.set(evening?0xd2d6ed:0xffedda);sun.intensity=evening?1.33:2.74;sun.color.set(evening?0xffb879:0xffdfae);
    sun.position.set(evening?112:85,evening?56:115,evening?61:-12);fill.intensity=evening?.50:.67;lamp.intensity=evening?175:72;glass.forEach(m=>m.material.color.setScalar(evening?.80:1));beamMat.uniforms.power.value=evening?.027:.095;
    renderer.shadowMap.needsUpdate=true;}
  return {mode};
}
