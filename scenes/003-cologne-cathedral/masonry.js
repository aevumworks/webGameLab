import {glassMaterials} from "./glass.js";
const T=globalThis.THREE;
export const daylight={value:1};
const stoneLoader=new T.TextureLoader();
function stoneTexture(file,color){
  const t=stoneLoader.load(new URL("./survey/"+file,import.meta.url).href);
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;return t;
}
const scanColor=stoneTexture("ashlar-color.webp",true),scanRelief=stoneTexture("ashlar-normal-rough.webp",false);
export const TAU=2*Math.PI;
export const P=(x,y,z)=>new T.Vector3(x,y,z);
const up=P(0,1,0);
const unitBox=new T.BoxGeometry(1,1,1),round=new T.CylinderGeometry(1,1,1,12),rod=new T.CylinderGeometry(1,1,1,7),oct=new T.CylinderGeometry(1,1,1,8),pyramid=new T.CylinderGeometry(.011,1,1,4),cone=new T.CylinderGeometry(.015,1,1,8),bud=new T.IcosahedronGeometry(1,0);
const stoneNoise=`
varying vec3 cdWorld;
uniform float cdDay;
float cdHash(vec2 p){return fract(sin(dot(mod(p,257.),vec2(41.37,137.83)))*42758.54);}
float cdNoise(vec2 v){vec2 c=floor(v),f=fract(v);f=f*f*(3.-2.*f);return mix(mix(cdHash(c),cdHash(c+vec2(1.,0.)),f.x),mix(cdHash(c+vec2(0.,1.)),cdHash(c+1.),f.x),f.y);}
float cdRelief(vec2 uv){
  vec2 blocks=vec2(uv.x/.91+.5*mod(floor(uv.y/.43),2.),uv.y/.43);
  vec2 edge=min(fract(blocks),1.-fract(blocks))*vec2(.91,.43);
  return .011*smoothstep(.002,.028,min(edge.x,edge.y))+.005*cdNoise(uv*13.)+.004*cdNoise(uv*3.5);
}
vec3 cdTransmitted(vec3 p){
  float inside=smoothstep(3.,15.,-p.z)*(1.-smoothstep(130.,142.,-p.z))*(1.-smoothstep(11.,17.,abs(p.x)));
  vec2 uv=vec2(p.z*.126+p.x*.070+p.y*.068,p.x*.128+p.y*.10);float opening=1.-smoothstep(.22,.44,abs(fract(uv.x)-.5));
  float pool=exp(-pow((p.x+1.9+.15*p.y)/6.1,2.))*opening*inside;
  vec2 pane=vec2(uv.x*10.,uv.y*11.);vec2 edge=min(fract(pane),1.-fract(pane));
  float lead=smoothstep(.022,.13,min(edge.x,edge.y));
  float color=cdHash(floor(pane));
  vec3 stain=mix(vec3(.14,.39,.78),vec3(.82,.21,.12),smoothstep(.26,.48,color));
  stain=mix(stain,vec3(1.0,.70,.27),smoothstep(.53,.72,color));
  return cdDay*pool*lead*stain*(1.-smoothstep(2.4,9.5,p.y));
}
`;
function finishSurface(mat,kind) {
  mat.onBeforeCompile=shader=>{
    shader.uniforms.cdDay=daylight;
    if(kind==="stone"||kind==="exterior"){
      shader.uniforms.cdStoneColor={value:scanColor};shader.uniforms.cdStoneDetail={value:scanRelief};
    }
    shader.vertexShader="varying vec3 cdWorld;\n"+shader.vertexShader.replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
    vec4 cpos=vec4(transformed,1.);
    #ifdef USE_INSTANCING
    cpos=instanceMatrix*cpos;
    #endif
    cdWorld=(modelMatrix*cpos).xyz;`);
    const stone=`vec3 n=abs(normalize(cross(dFdx(cdWorld),dFdy(cdWorld))));vec2 uv=n.y>.72?cdWorld.xz:vec2(n.x>n.z?cdWorld.z:cdWorld.x,cdWorld.y);
    float row=floor(uv.y/.43);vec2 masonry=vec2(uv.x/.91+.5*mod(row,2.),uv.y/.43);
    vec2 cell=floor(masonry),d=min(fract(masonry),1.-fract(masonry));
    float joints=(1.-smoothstep(.006,.034,min(d.x*.91,d.y*.43)))*(1.-smoothstep(40.,95.,length(cdWorld-cameraPosition)));
    float grains=(cdNoise(uv*11.)-.5)*.13+(cdNoise(uv*2.8)-.5)*.11;
    float strata=cdNoise(vec2(uv.x*.54,uv.y*.069));
    diffuseColor.rgb*=.92+.078*cdHash(cell)+grains*.64+.075*strata-joints*.135;
    diffuseColor.rgb*=vec3(1.+.033*strata,1.,.98); `;
    const floor=`vec2 uv=cdWorld.xz;vec2 g=uv/1.04;vec2 edge=min(fract(g),1.-fract(g));float seam=1.-smoothstep(.005,.027,min(edge.x,edge.y));
    float alternate=mod(floor(g.x)+floor(g.y),2.);float t=cdNoise(uv*3.1),grain=cdNoise(uv*.50);
    vec3 flag=mix(vec3(.80,.77,.70),vec3(1.07,1.04,.99),alternate);
    float stripe=abs(abs(uv.x)-2.15);if(stripe<.34)flag=vec3(.40,.42,.43);if(stripe<.065)flag=vec3(.93,.75,.48);
    float diamond=abs(uv.x)*.70+abs(mod(uv.y+1.45,2.90)-1.45);
    if(abs(uv.x)<1.9){float border=1.-smoothstep(.043,.095,abs(diamond-.90));flag=mix(flag,vec3(.43,.44,.44),border*.83);flag=mix(flag,vec3(.72,.61,.46),(1.-smoothstep(.22,.29,diamond))*.75);}
    diffuseColor.rgb*=flag*(.84+.18*t+.085*grain-.23*seam);
    float strip=mod(uv.y+uv.x*.68+160.,8.05)-4.;
    float windowLight=exp(-strip*strip*.49)*smoothstep(-5.,3.,uv.x)*(1.-smoothstep(15.,23.,uv.x))*smoothstep(1.,10.,-uv.y);
    diffuseColor.rgb+=windowLight*(.25+.70*cdNoise(uv*2.2))*mix(vec3(.24,.10,.046),vec3(.065,.15,.25),smoothstep(.32,.66,cdNoise(uv*.69)));`;
    const slate=`vec2 uv=vec2(cdWorld.z+cdWorld.x*.6,cdWorld.y);vec2 t=uv*vec2(2.7,3.6);t.x+=.5*mod(floor(t.y),2.);vec2 d=min(fract(t),1.-fract(t));diffuseColor.rgb*=.84+.19*cdHash(floor(t))+.10*cdNoise(uv*9.)-.14*(1.-smoothstep(.017,.063,min(d.x,d.y)));`;
    const internal=`float cdEast=smoothstep(55.,125.,-cdWorld.z);float cdHigh=smoothstep(8.,36.,cdWorld.y);
    diffuseColor.rgb*=mix(vec3(.66,.65,.66),vec3(1.05,1.012,.95),max(.85*cdEast,.61*cdHigh));`;
    const weather=`float patina=smoothstep(.26,.72,cdNoise(uv*vec2(.69,.099))+.20*(cdNoise(uv*2.2)-.5));
    diffuseColor.rgb*=mix(vec3(.51,.52,.57),vec3(1.04,1.,.94),patina);`;
    const plaster=`vec2 v=cdWorld.xz+cdWorld.y*.24;diffuseColor.rgb*=.94+.065*cdNoise(v*1.3)+.025*cdNoise(v*7.);`;
    const wood=`vec2 v=vec2(cdWorld.x+cdWorld.z*.31,cdWorld.y+cdWorld.z*.57);float gr=cdNoise(v*vec2(2.1,25.));diffuseColor.rgb*=.70+.22*gr+.17*cdNoise(v*vec2(.8,6.));`;
    shader.fragmentShader=stoneNoise+shader.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\n"+({stone:stone+internal,exterior:stone+weather,web:plaster+internal,wood,floor,slate}[kind]));
    if(kind==="stone"||kind==="exterior"){
      shader.fragmentShader="uniform sampler2D cdStoneColor;uniform sampler2D cdStoneDetail;\n"+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        vec2 scanUV=uv/vec2(3.65,3.65);vec3 scanAlbedo=texture2D(cdStoneColor,scanUV).rgb;
        vec3 scanData=texture2D(cdStoneDetail,scanUV).rgb;
        float mineral=dot(scanAlbedo,vec3(.32,.51,.17));
        diffuseColor.rgb*=clamp(.45+1.45*sqrt(mineral),.52,1.24);
        roughnessFactor=clamp(.46+.48*scanData.b,.52,.96);`);
      shader.fragmentShader=shader.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      vec3 faceNormal=abs(normalize(cross(dFdx(cdWorld),dFdy(cdWorld))));
      vec2 stoneUV=faceNormal.y>.72?cdWorld.xz:vec2(faceNormal.x>faceNormal.z?cdWorld.z:cdWorld.x,cdWorld.y);
      float displacement=cdRelief(stoneUV)*(1.-smoothstep(13.,55.,length(cdWorld-cameraPosition)));
      vec3 px=dFdx(-vViewPosition),py=dFdy(-vViewPosition),rx=cross(py,normal),ry=cross(normal,px);
      float det=dot(px,rx);
      normal=normalize(abs(det)*normal-sign(det)*(rx*dFdx(displacement)+ry*dFdy(displacement))+normal*1.e-9);
      vec3 za=dFdx(-vViewPosition),zb=dFdy(-vViewPosition);vec2 ta=dFdx(scanUV),tb=dFdy(scanUV);
      vec3 tang=cross(zb,normal)*ta.x+cross(normal,za)*tb.x;
      vec3 bitang=cross(zb,normal)*ta.y+cross(normal,za)*tb.y;
      float inv=inversesqrt(max(1.e-12,max(dot(tang,tang),dot(bitang,bitang))));
      normal=normalize(normal+(tang*(scanData.r*2.-1.)+bitang*(scanData.g*2.-1.))*inv*.60);`);
    }
    if(["floor","stone","wood"].includes(kind)){
      const strength=kind==="floor"?.41:kind==="stone"?.10:.080;
      shader.fragmentShader=shader.fragmentShader.replace("#include <opaque_fragment>",
        "outgoingLight+=cdTransmitted(cdWorld)*"+strength.toFixed(2)+"*sqrt(max(diffuseColor.rgb,vec3(.0)));\n#include <opaque_fragment>");
    }
  };mat.customProgramCacheKey=()=>"cathedral-"+kind;return mat;
}
function std(color,roughness=.86,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness,side:T.DoubleSide});}
function palette(){const glass=glassMaterials();return {
  stone:finishSurface(std("#b5ab9b"),"stone"),web:finishSurface(std("#dfd5c4"),"web"),mould:finishSurface(std("#ad9d86"),"stone"),
  dark:finishSurface(std("#535552"),"exterior"),face:finishSurface(std("#77756c"),"exterior"),pale:finishSurface(std("#a39e8e"),"exterior"),
  shadow:std("#514b46"),slate:finishSurface(std("#596675",.75,.10),"slate"),lead:std("#625e57",.67,.18),ash:finishSurface(std("#725640",.64),"wood"),oak:finishSurface(std("#8c694b",.58),"wood"),oakLight:finishSurface(std("#987752",.56),"wood"),iron:std("#423f3d",.56,.36),gold:std("#d9ad5e",.48,.43),enamel:std("#4b7783",.42,.25),
  marble:finishSurface(std("#ada397",.59,.03),"floor"),step:finishSurface(std("#b9aea0"),"stone"),tile:std("#474b49"),
  gilt:std("#b38d50",.39,.72),ruby:std("#913f47",.28,.35),
  flame:new T.MeshBasicMaterial({color:0xffd688,toneMapped:false}),glass0:glass[0],glass1:glass[1],glass2:glass[2],glass3:glass[3],glass4:glass[4]
};}
export class Workshop{
  constructor(){this.group=new T.Group();this.mats=palette();this.inst=new Map();this.skins=new Map();this.blocks=[];this.posts=[];this.doors=[];}
  instance(geom,kind,p,scale,q=new T.Quaternion()){
    const key=geom.uuid+kind;let batch=this.inst.get(key);if(!batch){batch={geom,kind,matrices:[]};this.inst.set(key,batch);}
    const m=new T.Matrix4().compose(p,q,scale);batch.matrices.push(m);
  }
  box(x,y,z,w,h,d,kind="stone",yaw=0){this.instance(unitBox,kind,P(x,y,z),P(w,h,d),new T.Quaternion().setFromAxisAngle(up,yaw));}
  cyl(x,y,z,r,h,kind="stone",shape="round"){this.instance(shape==="oct"?oct:round,kind,P(x,y,z),P(r,h,r));}
  point(x,y,z,r,h,kind="pale",square=false){this.instance(square?pyramid:cone,kind,P(x,y+h/2,z),P(r,h,r));}
  boss(p,r,kind="gold"){this.instance(bud,kind,p,P(r,r*.84,r));}
  beam(a,b,r,kind="mould",flat=false){const v=b.clone().sub(a),len=v.length();if(len<.0001)return;
    this.instance(flat?unitBox:rod,kind,a.clone().lerp(b,.5),P(flat?r*2:r,len,flat?r*2:r),new T.Quaternion().setFromUnitVectors(up,v.multiplyScalar(1/len)));}
  line(points,r,kind="mould"){for(let i=1;i<points.length;i++)this.beam(points[i-1],points[i],r,kind);}
  tri(a,b,c,kind="stone",uvs=null){
    let s=this.skins.get(kind);if(!s){s={v:[],uv:[]};this.skins.set(kind,s);}
    for(const p of [a,b,c])s.v.push(p.x,p.y,p.z);
    s.uv.push(...(uvs||[0,0,1,0,1,1]));
  }
  quad(a,b,c,d,kind="stone"){this.tri(a,b,c,kind);this.tri(a,c,d,kind);}
  finish(){
    for(const {geom,kind,matrices} of this.inst.values()){const mesh=new T.InstancedMesh(geom,this.mats[kind],matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();this.add(mesh,kind);}
    for(const [kind,s] of this.skins){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(s.v,3));g.setAttribute("uv",new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();g.computeBoundingSphere();this.add(new T.Mesh(g,this.mats[kind]),kind);}
    this.group.userData.solids={blocks:this.blocks,posts:this.posts};return this.group;
  }
  add(mesh,kind){mesh.name=kind;mesh.castShadow=!kind.startsWith("glass")&&!["flame","gold","marble"].includes(kind);mesh.receiveShadow=!kind.startsWith("glass");this.group.add(mesh);}
  block(x,z,w,d,angle=0){this.blocks.push({x,z,hw:w/2,hd:d/2,angle});}
}
export function archY(x,half,rise){const u=Math.min(1,Math.abs(x)/half),o=(rise*rise-half*half)/(2*half),rad=half+o;return Math.sqrt(Math.max(0,rad*rad-(half*u+o)**2));}
export function archPoints(map,half,spring,peak,n=16,offset=0){
  const pts=[];for(let i=0;i<=n;i++){const a=Math.PI*i/n,x=-half*Math.cos(a);pts.push(map(x,spring+archY(x,half,peak-spring),offset));}return pts;
}
export function frameMap(x,z,angle){const cs=Math.cos(angle),sn=Math.sin(angle);return (u,y,d=0)=>P(x+cs*u+sn*d,y,z-sn*u+cs*d);}
export function lancet(w,map,half,sill,spring,peak,style=0,trim="mould",lights=2,depth=0){
  const outline=[map(-half,sill,depth),...archPoints(map,half,spring,peak,14,depth),map(half,sill,depth)];
  const repeats=style===3?1:lights,center=map(0,(sill+spring)/2,depth),cc=[repeats*.5,((sill+spring)/2-sill)/(peak-sill)];
  const bounds=[[-half,sill],...Array.from({length:15},(_,i)=>{const x=-half*Math.cos(Math.PI*i/14);return [x,spring+archY(x,half,peak-spring)];}),[half,sill]];
  const uv=i=>[(bounds[i][0]/half+1)*repeats/2,(bounds[i][1]-sill)/(peak-sill)];
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;w.tri(center,outline[j],outline[i],"glass"+style,[...cc,...uv(j),...uv(i)]);}
  const r=Math.min(.16,half*.07),d=depth+.11;
  const outer=[map(-half,sill,d),...archPoints(map,half,spring,peak,14,d),map(half,sill,d)];
  w.line(outer,r,trim);w.beam(map(-half,sill,d),map(half,sill,d),r,trim);
  const sub=half/lights;
  for(let i=0;i<lights;i++){const c=-half+(i+.5)*sub*2;const submap=(u,y,o)=>map(c+u,y,d+o);
    const crown=spring+(peak-spring)*(.37+.09*(1-Math.abs(c)/half));
    w.line(archPoints(submap,sub,spring-.24,crown,8),r*.65,trim);
    if(i>0)w.beam(map(c-sub,sill,d),map(c-sub,spring-.23,d),r*.74,trim);
  }
  const ry=spring+(peak-spring)*.68,rr=Math.min(half*.29,(peak-spring)*.172);
  const lobe=[];for(let i=0;i<=18;i++){const a=i*TAU/18,rad=rr*(.83+.17*Math.cos(a*4));lobe.push(map(Math.cos(a)*rad,ry+Math.sin(a)*rad,d));}w.line(lobe,r*.58,trim);
}
export function arcade(w,map,half,spring,peak,top,kind="stone",thick=.45) {
  const edge=archPoints(map,half,spring,peak,16,0);
  for(let i=1;i<edge.length;i++){
    const a=edge[i-1],b=edge[i],x1=-half*Math.cos(Math.PI*(i-1)/16),x2=-half*Math.cos(Math.PI*i/16);
    const c=map(x2,top,0),d=map(x1,top,0),aa=map(x1,a.y,-thick),bb=map(x2,b.y,-thick);
    w.quad(a,b,c,d,kind);w.quad(bb,aa,map(x1,top,-thick),map(x2,top,-thick),kind);w.quad(a,aa,bb,b,"mould");
  }
  for(const [o,r] of [[.09,.18],[-thick-.08,.14]])w.line(archPoints(map,half,spring,peak,16,o),r,"mould");
}
