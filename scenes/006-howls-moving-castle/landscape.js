import {T,TAU,Kit,Surface,clamp,mix,smooth,random,pick,tint,shaderNoise} from "./atelier.js";
import {meadowClump,crownGeometry,firGeometry} from "./botany.js";

function hash(x,z){
  let n=Math.imul(x,374761393)+Math.imul(z,668265263)|0;
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
}
function noise(x,z){
  const a=Math.floor(x),b=Math.floor(z),u=smooth(0,1,x-a),v=smooth(0,1,z-b);
  return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);
}
const districtLevels={market:13,harbor:4.4,palace:22,meadow:14.5,front:11,memory:14};
const sizes={market:66,harbor:73,palace:91,meadow:85,front:64,memory:77};
const distance=(x,z,p)=>Math.hypot(x-p[0],z-p[1]);
export function geography(design){
  const places=design.places,[px,pz]=places.harbor;
  const lakes=[
    {x:places.meadow[0]+30,z:places.meadow[1]-34,rx:48,rz:30,level:10.1},
    {x:places.memory[0]+9,z:places.memory[1]-42,rx:42,rz:29,level:10.0}
  ];
  function coast(z){return px+23+Math.sin((z-pz)*.013)*8+(1-smooth(55,225,z))*720;}
  function lakeDist(x,z,l){return Math.hypot((x-l.x)/l.rx,(z-l.z)/l.rz);}
  function height(x,z){
    const broad=noise(x*.006+71,z*.006+91);
    let h=7+35*broad+11*(noise(x*.017,z*.017)-.5)+1.10*Math.sin(x*.095+z*.039);
    for(const id of Object.keys(districtLevels)){
      const d=distance(x,z,places[id]);
      if(d<sizes[id]+56)h=mix(districtLevels[id],h,smooth(sizes[id],sizes[id]+56,d));
    }
    for(const lake of lakes){const d=lakeDist(x,z,lake);if(d<1.45)h=mix(lake.level-3.1,h,smooth(.72,1.39,d));}
    // A broad saddle leaves sky behind the engine and keeps the boarding approach clear.
    const home=places.waste,homeX=x-home[0],homeZ=z-home[1],homeD=Math.hypot(homeX*.94,homeZ);
    if(homeD<82)h=mix(22.0+.027*homeZ-.016*homeX,h,smooth(28,82,homeD));
    const shore=coast(z)-x;
    if(shore<16)h=mix(-5.0,h,smooth(-8,16,shore));
    const quay=Math.abs(z-pz),edge=x-px;
    if(quay<79&&edge>8.8){
      const quayBed=mix(4.40,-3.15,smooth(9.6,15.5,edge));
      h=mix(h,Math.min(h,quayBed),1-smooth(47,79,quay));
    }
    return h;
  }
  function wet(x,z){
    if((x>coast(z)-1||x>px+9&&Math.abs(z-pz)<79)&&height(x,z)<1.16)return true;
    return lakes.some(l=>lakeDist(x,z,l)<1.25&&height(x,z)<l.level+.15);
  }
  function district(x,z){
    let best="waste",dmin=Infinity;
    for(const id of Object.keys(districtLevels)){const d=distance(x,z,places[id]);if(d<sizes[id]+35&&d<dmin){best=id;dmin=d;}}
    return best;
  }
  return {places,lakes,coast,height,wet,district,extent:design.worldHalfExtentM};
}

const trailZ=x=>17+Math.sin(x*.015)*15+Math.sin(x*.042)*2.8;
function boardingClearing(x,z){return Math.hypot((x+9)*.93,(z+22)*.66)<19;}
function terrain(geo){
  const g=new T.PlaneGeometry(geo.extent*2,geo.extent*2,316,316);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,colors=new Float32Array(p.count*3),c=new T.Color();
  const moss=new T.Color(0x738942),grass=new T.Color(0xb4b259),dark=new T.Color(0x6c8850);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),h=geo.height(x,z);p.setY(i,h);
    const n=noise(x*.014+7,z*.014+17),f=noise(x*.056,z*.056);
    c.copy(moss).lerp(grass,smooth(.18,.83,n*.75+f*.25)).lerp(dark,smooth(20,44,h)*.46);
    const rocky=noise(x*.024+8,z*.020+6);
    c.lerp(new T.Color(0x929178),smooth(.71,.94,rocky)*.72);
    if(geo.district(x,z)==="front")c.lerp(new T.Color(0x665e54),.84);
    if(geo.wet(x,z))c.set(0x7b9073);
    c.multiplyScalar(.93+.13*f).toArray(colors,i*3);
  }
  g.setAttribute("color",new T.BufferAttribute(colors,3));g.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:1});
  mat.onBeforeCompile=s=>{
    s.vertexShader="varying vec3 vLand;\n"+s.vertexShader;
    s.vertexShader=s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vLand=position;");
    s.fragmentShader="varying vec3 vLand;\n"+shaderNoise+"\n"+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      vec2 p=vLand.xz;
      float stroke=paintNoise(p*vec2(1.6,.67))*.48+paintNoise(p*.32)*.34+paintNoise(p*3.7)*.18;
      diffuseColor.rgb*=.72+.54*stroke;
      float t=abs(p.y-(17.+sin(p.x*.015)*15.+sin(p.x*.042)*2.8));
      float path=(1.-smoothstep(1.2,3.1,t+(stroke-.5)*2.4))*(1.-smoothstep(240.,360.,abs(p.x)));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.334,.177)*(.77+.46*stroke),path*.89);
    `);
  };
  const mesh=new T.Mesh(g,mat);mesh.receiveShadow=true;return mesh;
}
function mountains(){
  const p=[],indices=[],colors=[],sections=640,rows=48;
  const base=new T.Color(),snow=new T.Color(0xe1eceb),shade=new T.Color(0x6e8190);
  const peaks=[[.16,470,.16],[.63,320,.13],[1.1,540,.20],[1.79,380,.16],[2.13,520,.14],[2.62,470,.18],[3.24,650,.19],[3.74,420,.20],[4.16,640,.19],[4.71,440,.18],[5.28,655,.24],[5.64,460,.16],[6.08,400,.17]];
  for(let j=0;j<=rows;j++)for(let i=0;i<=sections;i++){
    const a=i/sections*TAU,t=j/rows,ca=Math.cos(a),sa=Math.sin(a);
    const radius=1020+2300*t,xx=ca*radius,zz=sa*radius;
    let ridge=220;
    for(const [angle,h,w] of peaks){const delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));ridge+=h*Math.exp(-delta*delta/(w*w));}
    ridge+=135*(noise(ca*18,sa*18)-.5)+60*(noise(ca*49,sa*49)-.5);
    const ridgeAt=.67+.13*Math.sin(a*7)+.05*Math.sin(a*19);
    const slope=Math.pow(Math.max(0,1-Math.abs(t-ridgeAt)/ridgeAt),1.30);
    const gully=noise(xx*.005+31,zz*.005+19),vein=noise(xx*.016,zz*.016);
    const ridgelet=Math.abs(Math.sin(a*34+gully*3.6+t*6.2));
    const h=-12+slope*ridge*.74+(gully-.4)*105*smooth(.01,.35,t)+(vein-.5)*36*slope-ridgelet*40*slope;
    p.push(xx,h,zz);
    base.set(0x617f77).lerp(shade,smooth(70,275,h)*.95);
    base.lerp(snow,smooth(257,342,h+(gully-.5)*112+(vein-.5)*100+Math.sin(a*42+t*9)*26));
    base.multiplyScalar(.87+.24*gully).toArray(colors,colors.length);
    if(j<rows && i<sections){const k=j*(sections+1)+i;indices.push(k,k+1,k+sections+1,k+1,k+sections+2,k+sections+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1});
  mat.onBeforeCompile=s=>{
    s.vertexShader="varying vec3 vPeak;\n"+s.vertexShader;
    s.vertexShader=s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vPeak=position;");
    s.fragmentShader="varying vec3 vPeak;\n"+shaderNoise+"\n"+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      vec2 v=vec2(vPeak.x*.037+vPeak.z*.021,vPeak.y*.037+vPeak.z*.013);
      float grain=paintNoise(v)+.32*paintNoise(v*3.);
      float ravine=abs(sin(v.x*.43+v.y*.76+grain*1.8));
      float crack=(1.-smoothstep(.08,.64,ravine+grain*.16))*smoothstep(120.,230.,vPeak.y);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.073,.11,.135),crack*.79);
      diffuseColor.rgb*=(.76+grain*.32);`);
  };
  return new T.Mesh(g,mat);
}
function water(geo){
  const time={value:0},mat=new T.MeshStandardMaterial({color:0x70adab,roughness:.37,metalness:.05});
  mat.onBeforeCompile=s=>{
    s.uniforms.waterTime=time;s.vertexShader="varying vec3 vWater;\n"+s.vertexShader;
    s.vertexShader=s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vWater=(modelMatrix*vec4(position,1.)).xyz;");
    s.fragmentShader="varying vec3 vWater;uniform float waterTime;\n"+shaderNoise+"\n"+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      vec2 p=vWater.xz;float w=paintNoise(p*vec2(.16,1.4)+vec2(waterTime*.23,waterTime*.4));
      float n=paintNoise(p*.075+vec2(waterTime*.045,0.));
      diffuseColor.rgb*=.67+.66*n;
      float strand=paintNoise(p*vec2(.43,3.6)+vec2(waterTime*.27,-waterTime*.62));
      float grazing=pow(1.-clamp(normalize(cameraPosition-vWater).y,0.,1.),4.);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.31,.51,.62)*(.86+.15*n),grazing*.32);
      diffuseColor.rgb+=vec3(.114,.155,.15)*smoothstep(.75,.88,w)*smoothstep(.54,.78,strand);
    `);
  };
  const root=new T.Group(),ocean=new T.Mesh(new T.PlaneGeometry(geo.extent*2,geo.extent*2),mat);
  ocean.rotation.x=-Math.PI/2;ocean.position.y=.89;ocean.receiveShadow=true;root.add(ocean);
  for(const l of geo.lakes){
    const m=new T.Mesh(new T.CircleGeometry(1,90),mat);m.rotation.x=-Math.PI/2;m.scale.set(l.rx*1.27,l.rz*1.27,1);m.position.set(l.x,l.level,l.z);root.add(m);
  }
  return {root,time};
}
const meadowForms=[0,1,2,3].map(meadowClump),crown=crownGeometry(),fir=firGeometry();
function paintedGrass(geo){
  const root=new T.Group(),tile=28,active=new Map();
  const canopyMat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  const wind={value:0};canopyMat.onBeforeCompile=s=>{
    s.uniforms.breeze=wind;s.vertexShader="uniform float breeze;\n"+s.vertexShader;
    s.vertexShader=s.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
      vec3 stem=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
      transformed.x+=position.y*position.y*.22*sin(breeze*1.8+stem.x*.31+stem.z*.23);`);
  };
  function fill(cell,ix,iz){
    const r=random(Math.floor(hash(ix,iz)*4294967295)),dummy=new T.Object3D();
    const counts=[0,0,0,0];
    const centerX=(ix+.5)*tile,centerZ=(iz+.5)*tile,id=geo.district(centerX,centerZ);
    if(["market","harbor","palace","front"].includes(id)&&distance(centerX,centerZ,geo.places[id])+tile*Math.SQRT1_2<sizes[id]-3){
      for(const m of cell.children){m.count=0;m.userData.fullCount=0;m.visible=false;}
      return;
    }
    for(let i=0;i<223;i++){
      const x=(ix+r())*tile,z=(iz+r())*tile,id=geo.district(x,z);
      if(geo.wet(x,z)||boardingClearing(x,z)&&r()>.09||Math.abs(z-trailZ(x))<1.4&&Math.abs(x)<280)continue;
      if(["market","harbor","palace","front"].includes(id)&&distance(x,z,geo.places[id])<sizes[id]-3)continue;
      const patch=noise(x*.073+12,z*.067+23);
      const isFlower=r()<(id==="meadow"?.91:patch*.45);
      const type=isFlower?(patch<.40?1:patch<.60?2:3):0;
      const sc=isFlower?.75+r()*.68:.68+r()*1.2;
      dummy.position.set(x,geo.height(x,z)-.06,z);dummy.rotation.y=r()*TAU;dummy.scale.set(sc,sc,sc);dummy.updateMatrix();
      cell.children[type].setMatrixAt(counts[type]++,dummy.matrix);
    }
    cell.children.forEach((m,i)=>{m.count=counts[i];m.userData.fullCount=counts[i];m.visible=m.count>0;});
    for(const m of cell.children)if(m.count){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
  }
  function update(pos,time){
    wind.value=time;const cx=Math.floor(pos.x/tile),cz=Math.floor(pos.z/tile);
    function density(){
      for(const {ix,iz,cell} of active.values()){
        const d=Math.hypot((ix+.5)*tile-pos.x,(iz+.5)*tile-pos.z),fraction=1-.77*smooth(23,66,d);
        for(const m of cell.children){m.count=Math.ceil(m.userData.fullCount*fraction);m.visible=m.count>0;}
      }
    }
    if(root.userData.cx===cx&&root.userData.cz===cz){density();return;}
    root.userData.cx=cx;root.userData.cz=cz;
    const pool=[];
    for(const [key,v] of active)if(Math.abs(v.ix-cx)>2||Math.abs(v.iz-cz)>2){pool.push(v.cell);active.delete(key);}
    for(let ix=cx-2;ix<=cx+2;ix++)for(let iz=cz-2;iz<=cz+2;iz++){
      const key=ix+","+iz;if(active.has(key))continue;
      let cell=pool.pop();
      if(!cell){cell=new T.Group();for(const g of meadowForms)cell.add(new T.InstancedMesh(g,canopyMat,223));root.add(cell);}
      fill(cell,ix,iz);active.set(key,{ix,iz,cell});
    }
    density();
  }
  return {root,update};
}
export function tree(k,x,y,z,h,r,pine=false){
  const trunk=0x72644d;
  k.post(x,y+h*.27,z,h*.043,h*.55,trunk,"wood");
  if(pine){
    k.put(fir,[x,y,z],[h,h,h],pick(r,[0x537852,0x5a8058,0x5f845b]),"leaf",[0,r()*TAU,0]);
  }else{
    for(let j=0;j<6;j++){
      const a=r()*TAU,rad=j===0?0:h*(.10+r()*.12),xx=x+Math.cos(a)*rad,zz=z+Math.sin(a)*rad;
      k.line([x,y+h*.38,z],[xx,y+h*.68,zz],.09+h*.017,trunk,"wood");
      const sc=h*(.21+r()*.09);
      k.put(crown,[xx,y+h*(.64+r()*.17),zz],[sc,sc*(1+r()*.31),sc],pick(r,[0x719957,0x91a95e,0x82a05b,0x71975c]),"leaf",[0,r()*TAU,.15]);
    }
  }
}
function vegetation(geo){
  const root=new T.Group(),r=random(99371),groves=[];
  for(let ix=-3;ix<=3;ix++)for(let iz=-3;iz<=3;iz++){
    const k=new Kit(),close=new Kit(),far=new Kit();
    for(let i=0;i<53;i++){
      const x=(ix+r()-.5)*305,z=(iz+r()-.5)*305;
      if(geo.wet(x,z)||geo.district(x,z)!=="waste"||Math.hypot(x,z)<46)continue;
      const forest=noise(x*.009,z*.009);
      if(forest>.49&&Math.hypot(x,z)>84){
        const y=geo.height(x,z),h=4+r()*8,pine=r()>.34;
        tree(close,x,y,z,h,r,pine);
        far.post(x,y+h*.25,z,h*.038,h*.50,0x786d55,"wood");
        if(pine)for(let j=0;j<3;j++)far.put("spire",[x,y+h*(.40+j*.19),z],[h*(.25-j*.066),h*(.56-j*.09),h*(.24-j*.065)],j===0?0x5e805d:0x70916c,"leaf");
        else far.put("boulder",[x,y+h*.68,z],[h*.41,h*.38,h*.39],0x839c61,"leaf");
      }
      else if(r()>.42){
        const size=.9+r()*3.6;
        for(let j=0;j<4;j++){
          const xx=x+(r()-.5)*size*3,zz=z+(r()-.5)*size*3;
          k.put("boulder",[xx,geo.height(xx,zz)-.25,zz],[size*(.5+r()),size*(.34+r()*.37),size*(.50+r()*.7)],pick(r,[0x7c8472,0x8b8a74,0x92937a]),"stone",[r()*.25,r()*TAU,r()*.28]);
        }
      }
    }
    k.finish(root,false);
    const hi=close.finish(new T.Group(),false),lo=far.finish(new T.Group(),false);
    if(hi.children.length){root.add(hi,lo);groves.push({x:ix*305,z:iz*305,hi,lo});}
  }
  const rock=new Kit();
  for(let j=0;j<98;j++){
    const a=r()*TAU,d=22+r()*83,x=Math.cos(a)*d,z=Math.sin(a)*d;
    if(boardingClearing(x,z)||Math.abs(z-trailZ(x))<3||Math.hypot(x-21,z-34)<8)continue;
    const sc=.25+r()*1.55;
    rock.put("boulder",[x,geo.height(x,z)-.12,z],[sc*1.3,sc*.56,sc],pick(r,[0x89927a,0xa1a186,0x7c846d]),"stone",[r()*.22,r()*TAU,r()*.24]);
  }rock.finish(root,false);
  return {root,update(p){for(const g of groves){const near=Math.hypot(p.x-g.x,p.z-g.z)<330;g.hi.visible=near;g.lo.visible=!near;}}};
}
export function buildLandscape(geo){
  const root=new T.Group(),pond=water(geo),grass=paintedGrass(geo),trees=vegetation(geo);
  root.add(terrain(geo),mountains(),pond.root,trees.root,grass.root);
  return {root,update(camera,time){pond.time.value=time;trees.update(camera);grass.update(camera,time);}};
}
