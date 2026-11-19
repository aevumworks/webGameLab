import {plate,captureInk} from "./cel.js";
import {T, TAU, clamp, mix, random, smooth} from "./atelier.js";

// Trace a connected group of intersecting lobes along each icosphere vertex.
// The two meshes use the same closed surface, so the ink follows it from below too.
function puffGeometry(){
  const g=new T.IcosahedronGeometry(1,2),p=g.getAttribute("position");
  const lobes=[[0,0,0,.53],[-.60,-.05,.03,.55],[.51,.24,-.11,.55],
    [-.20,.41,.11,.48],[.03,-.18,.48,.47],[-.14,.26,-.40,.47],[.20,-.34,-.23,.46]];
  const ray=new T.Vector3(),outward=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    ray.fromBufferAttribute(p,i).normalize();
    let reach=0;
    for(const [x,y,z,r] of lobes){
      const t=x*ray.x+y*ray.y+z*ray.z;
      const disc=r*r-x*x-y*y-z*z+t*t;
      if(disc>=0)reach=Math.max(reach,t+Math.sqrt(disc));
    }
    p.setXYZ(i,ray.x*reach,ray.y*reach,ray.z*reach);
  }
  g.computeVertexNormals();
  // Weld by position for the hull only. Split face normals stay available for
  // the paint, but the outline stays continuous at hard edges and UV seams.
  const smooth=new Map(),keys=[],face=new T.Vector3();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*10000)).join(",");
    keys.push(key);if(!smooth.has(key))smooth.set(key,new T.Vector3());
    smooth.get(key).add(face.fromBufferAttribute(g.attributes.normal,i));
  }
  for(const n of smooth.values())n.normalize();
  keys.forEach((key,i)=>smooth.get(key).toArray(outward,i*3));
  g.setAttribute("outward",new T.BufferAttribute(outward,3));return g;
}
const fillVertex=`
attribute vec3 outward;
varying vec3 vNormal;
void main(){
  mat3 inst=mat3(instanceMatrix);
  vec3 squared=vec3(dot(inst[0],inst[0]),dot(inst[1],inst[1]),dot(inst[2],inst[2]));
  vNormal=normalize(mat3(modelMatrix)*inst*(mix(normal,outward,.78)/squared));
  gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
}`;
const fillFragment=`
varying vec3 vNormal;
uniform vec3 paper, midtone, shade;uniform int stylePlate;
void main(){
  float value=dot(normalize(vNormal),normalize(vec3(-.48,.85,.40)));
  vec3 c=mix(shade,paper,smoothstep(.06,.105,value));
  c=mix(c,midtone,.40*(1.-smoothstep(-.69,-.65,value)));
  if(stylePlate==1)c=paper;
  if(stylePlate==2)c=mix(vec3(.37,.46,.57),vec3(.91,.92,.90),smoothstep(.06,.105,value));
  gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
}`;
const inkVertex=`
attribute vec3 outward;
uniform vec2 pixel;
uniform float stroke;
void main(){
  mat4 mv=modelViewMatrix*instanceMatrix;
  vec4 center=mv*vec4(0.,0.,0.,1.), pos=mv*vec4(position,1.);
  vec4 clip=projectionMatrix*pos;
  vec3 n=mat3(mv)*outward;
  vec2 dir=normalize(n.xy-center.xy/max(.1,-center.z)*(-n.z)+vec2(.000001));
  // As the last wisp contracts, its line contracts with it.
  float diameter=length(mv[1].xyz)*projectionMatrix[1][1]/max(.1,-pos.z)/pixel.y;
  clip.xy+=dir*pixel*min(stroke,diameter*.48)*clip.w;
  gl_Position=clip;
}`;
const inkFragment=`
uniform vec3 ink;uniform bool captureInk;
void main(){gl_FragColor=vec4(ink,captureInk?.65:1.);
  #include <colorspace_fragment>
}`;
const colors={
  day:[0xe9e7dc,0x899cad,0xa8b8c6,0x20272c],
  gold:[0xffe5b2,0xe3c7a5,0xa79caa,0x423d4a],
  dusk:[0xf7d1b8,0xc8b4b5,0x9494a7,0x393647],
  night:[0xb4cad7,0x95abbc,0x75899e,0x2f3c51],
  front:[0xd4bdb9,0xb4a4ac,0x898a9b,0x453f50],
  memory:[0xbcd4e4,0xa0bbcf,0x758fa9,0x2f4059]
};
export function engineSteam(castle){
  const group=new T.Group(),limit=88,g=puffGeometry(),dice=random(4812),dummy=new T.Object3D();
  const pool=Array.from({length:limit},()=>({age:100,life:1,origin:new T.Vector3(),jet:new T.Vector3()}));
  const fill={stylePlate:plate,paper:{value:new T.Color()},midtone:{value:new T.Color()},shade:{value:new T.Color()}};
  const stroke={captureInk,ink:{value:new T.Color()},pixel:{value:new T.Vector2()},stroke:{value:3}};
  const surface=new T.InstancedMesh(g,new T.ShaderMaterial({uniforms:fill,vertexShader:fillVertex,fragmentShader:fillFragment}),limit);
  const shell=new T.InstancedMesh(g,new T.ShaderMaterial({uniforms:stroke,vertexShader:inkVertex,fragmentShader:inkFragment,side:T.BackSide}),limit);
  surface.instanceMatrix.setUsage(T.DynamicDrawUsage);shell.instanceMatrix=surface.instanceMatrix;
  surface.frustumCulled=shell.frustumCulled=false;shell.renderOrder=1;surface.renderOrder=2;
  group.add(shell,surface);
  const socket=new T.Vector3(),direction=new T.Vector3(),origin=new T.Vector3();
  let cursor=0,lastBeat=null,lastMood="",lastClock=null,draft=0;
  function emit(port,age,load){
    const side=port===castle.sockets.length,p=pool[cursor++%limit];
    if(side){
      castle.exhaust.getWorldPosition(socket);
      direction.set(1.1,.50,-.24).transformDirection(castle.body.matrixWorld);
    }else{
      socket.copy(castle.sockets[port]).applyMatrix4(castle.body.matrixWorld);
      direction.set(port===1?.46:.06,1,port===2?-.34:-.10).transformDirection(castle.body.matrixWorld);
    }
    p.age=age;p.life=side?1.20+dice()*.36:3.9+dice()*1.05;
    p.origin.copy(socket);if(!side)p.origin.y-=.23;
    p.jet.copy(direction).multiplyScalar(side?3.6:1.34+load*.75);
    p.radius=(side?.70:1.29)*(port===0||side?1:.73)*(.88+dice()*.24)*(1+load*.30);
    p.drift=side?.72:1.94+dice()*.47;p.angle=dice()*TAU;p.roll=dice()*.7-.35;p.side=side;
  }
  function draftAt(phase,age,load){
    emit(0,age,load);
    if(Math.cos(phase-.52)>.04)emit(1,age,load);
    if(load>.56&&Math.cos(phase+1.8)>.45)emit(2,age,load);
    if(load>.72&&Math.sin(phase-.34)>.70)emit(3,age,load);
  }
  function reset(engine){
    for(const p of pool)p.age=100;
    castle.body.updateWorldMatrix(true,false);
    lastBeat=Math.floor(engine.shaft/Math.PI);draft=0;
    const rate=engine.rpm*TAU/60,interval=1/(3.7+engine.admission*2.5);
    for(let age=4.75;age>0;age-=interval)draftAt(engine.shaft-age*rate,age,engine.admission);
    const sideAge=(engine.shaft/Math.PI-lastBeat)*30/engine.rpm;
    emit(castle.sockets.length,sideAge,engine.admission);
  }
  function update(clock,engine,mood){
    castle.body.updateWorldMatrix(true,false);
    let dt=lastClock===null?0:clock-lastClock;lastClock=clock;
    if(lastBeat===null||dt>1.1){reset(engine);dt=0;}
    const cycles=engine.shaft/Math.PI,beat=Math.floor(cycles);
    if(lastMood!==mood){
      const [a,b,c,d]=colors[mood];fill.paper.value.set(a);fill.midtone.value.set(b);fill.shade.value.set(c);stroke.ink.value.set(d);lastMood=mood;
    }
    for(const p of pool)p.age+=dt;
    const draftRate=(3.7+engine.admission*2.5)*(.87+.25*Math.cos(engine.shaft*2));
    draft+=dt*draftRate;
    while(draft>=1){
      draft--;const age=draft/draftRate;
      draftAt(engine.shaft-age*engine.rpm*TAU/60,age,engine.admission);
    }
    for(let i=lastBeat+1;i<=beat;i++)emit(castle.sockets.length,(cycles-i)*30/engine.rpm,engine.admission);
    lastBeat=beat;
    let count=0;
    for(const p of pool){
      if(p.age>=p.life)continue;
      const a=p.age,f=a/p.life,swell=smooth(0,.57,f),end=smooth(.70,1,f);
      const r=p.radius*(.51+1.66*swell)*(1-end);
      if(r<.025)continue;
      origin.copy(p.origin).addScaledVector(p.jet,p.side?a:a*(1-.48*f));
      dummy.position.copy(origin);dummy.position.x+=p.drift*a*(.24+f*.92);
      dummy.position.y+=a*(p.side?.57:.75);dummy.position.z-=a*(p.side?.25:1.57)*(.28+f*.83);
      dummy.rotation.set(.18*Math.sin(p.angle),p.angle+p.roll*f,p.roll+f*.19);
      dummy.scale.set(r*(1+.24*swell),r*(1.04-.19*swell),r*.91);
      dummy.updateMatrix();surface.setMatrixAt(count++,dummy.matrix);
    }
    shell.visible=plate.value===0;shell.count=surface.count=count;surface.instanceMatrix.needsUpdate=true;
  }
  function resize(width,height,ratio){
    stroke.pixel.value.set(2/width,2/height);stroke.stroke.value=3.35*ratio;
  }
  return {group,reset,update,resize};
}
