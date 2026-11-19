import {celMaterial} from "./cel.js";
export const T = globalThis.THREE;
export const TAU = Math.PI * 2;
export const clamp = T.MathUtils.clamp;
export const mix = T.MathUtils.lerp;
export function smooth(a, b, value) {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export const pick = (r, items) => items[Math.floor(r() * items.length)];
export function tint(color, factor) {
  return new T.Color(color).multiplyScalar(factor);
}

export const shaderNoise = `
float hash21(vec2 p) {
  vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
float paintNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);
}`;

const materials = new Map();
export function material(kind) {
  if(!materials.has(kind))materials.set(kind,celMaterial({side:T.DoubleSide},kind));
  return materials.get(kind);
}

export class Surface {
  constructor(){this.p=[];this.colors=[];this.indices=[];}
  vertex(p,c){
    this.p.push(...p);const col=c?.isColor?c:new T.Color(c);
    this.colors.push(col.r,col.g,col.b);return this.p.length/3-1;
  }
  tri(a,b,c,color){
    const i=this.vertex(a,color);this.vertex(b,color);this.vertex(c,color);this.indices.push(i,i+1,i+2);
  }
  quad(a,b,c,d,color){
    const i=this.vertex(a,color);this.vertex(b,color);this.vertex(c,color);this.vertex(d,color);
    this.indices.push(i,i+1,i+2,i,i+2,i+3);
  }
  geometry(){
    const g=new T.BufferGeometry();
    g.setAttribute("position",new T.Float32BufferAttribute(this.p,3));
    g.setAttribute("color",new T.Float32BufferAttribute(this.colors,3));g.setIndex(this.indices);
    g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
}

const shape = {
  box:new T.BoxGeometry(1,1,1), ball:new T.SphereGeometry(1,12,8),
  pebble:new T.IcosahedronGeometry(1,0), boulder:new T.IcosahedronGeometry(1,1),
  rod:new T.CylinderGeometry(1,1,1,10), pipe:new T.CylinderGeometry(1,1,1,12),
  slim:new T.CylinderGeometry(1,1,1,8), cone:new T.ConeGeometry(1,1,10),
  spire:new T.ConeGeometry(1,1,6), point:new T.ConeGeometry(1,1,6),
  rim:new T.TorusGeometry(1,.09,5,18), hoop:new T.TorusGeometry(1,.040,4,20),
  disk:new T.CircleGeometry(1,16)
};
const latheShapes = new Map();
export function lathe(key,profile,sides=28) {
  if (!latheShapes.has(key)) latheShapes.set(key,new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),Math.min(sides,16)));
  return latheShapes.get(key);
}
const origin=[0,0,0],unit=[1,1,1],up=new T.Vector3(0,1,0);
const matrix = new T.Matrix4(), position=new T.Vector3(), scale=new T.Vector3(),quaternion=new T.Quaternion(),euler=new T.Euler();
function matrixFrom(pos,sz,rot) {
  position.fromArray(pos);scale.fromArray(sz);
  if(rot?.isQuaternion)quaternion.copy(rot);
  else if(rot)quaternion.setFromEuler(euler.set(rot[0],rot[1],rot[2],"YXZ"));
  else quaternion.identity();
  return matrix.compose(position,quaternion,scale);
}

// Disjoint fixed parts on the same moving frame can share one draw and shadow call.
function combineParts(entries) {
  const xyz=[],rgb=[],indices=[],p=new T.Vector3(),c=new T.Color();
  for(const {geo,matrix,tint} of entries){
    const pos=geo.attributes.position, colors=geo.attributes.color, start=xyz.length/3;
    for(let i=0;i<pos.count;i++){
      p.fromBufferAttribute(pos,i).applyMatrix4(matrix).toArray(xyz,xyz.length);
      if(colors)c.fromBufferAttribute(colors,i).multiply(tint);else c.copy(tint);
      c.toArray(rgb,rgb.length);
    }
    const index=geo.index,wind=matrix.determinant()<0;
    for(let i=0;i<(index?index.count:pos.count);i+=3){
      const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,d=index?index.getX(i+2):i+2;
      indices.push(start+a,start+(wind?d:b),start+(wind?b:d));
    }
  }
  const merged=new T.BufferGeometry();
  merged.setAttribute("position",new T.Float32BufferAttribute(xyz,3));
  merged.setAttribute("color",new T.Float32BufferAttribute(rgb,3));merged.setIndex(indices);
  merged.computeVertexNormals();merged.computeBoundingSphere();return merged;
}
function vertexMaterial(kind){
  const key=kind+"-vertices";
  if(!materials.has(key)){
    const base=material(kind),copy=base.clone();copy.vertexColors=true;copy.onBeforeCompile=base.onBeforeCompile;
    copy.customProgramCacheKey=()=>key;materials.set(key,copy);
  }
  return materials.get(key);
}

export class Kit {
  constructor(){this.parts=new Map();this.frame=new T.Matrix4();}
  at(pos,rot,sz,build){
    const old=this.frame;this.frame=old.clone().multiply(matrixFrom(pos,sz||unit,rot));
    build(this);this.frame=old;
  }
  put(form,pos,sz,color,kind="paint",rot=null){
    const geo=typeof form==="string"?shape[form]:form;
    kind=kind==="glow"?"glow":kind==="brass"||kind==="glass"?"satin":"matte";
    let list=this.parts.get(geo);if(!list)this.parts.set(geo,list=new Map());
    let batch=list.get(kind);if(!batch)list.set(kind,batch={matrices:[],colors:[]});
    batch.matrices.push(this.frame.clone().multiply(matrixFrom(pos,sz,rot)));
    batch.colors.push(color?.isColor?color:new T.Color(color));
  }
  box(x,y,z,w,h,d,c,k="paint",rot=null){this.put("box",[x,y,z],[w,h,d],c,k,rot);}
  ball(x,y,z,w,h,d,c,k="paint",rot=null){this.put("ball",[x,y,z],[w,h,d],c,k,rot);}
  post(x,y,z,r,h,c,k="iron",rot=null){this.put("rod",[x,y,z],[r,h,r],c,k,rot);}
  line(a,b,r,c,k="iron",form="slim",rz=r){
    const dir=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const len=dir.length();if(len<.0001)return;
    const q=new T.Quaternion().setFromUnitVectors(up,dir.multiplyScalar(1/len));
    this.put(form,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[r,len,rz],c,k,q);
  }
  curve(points,r,c,k="iron",segments=16){
    const line=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    this.put(new T.TubeGeometry(line,Math.min(segments,12),r,6,false),origin,unit,c,k);
  }
  surface(s,kind="paint"){this.put(s.geometry(),origin,unit,0xffffff,kind);}
  finish(parent=new T.Group(),shadows=true,landscape=false){
    const fixed=new Map();
    for(const [geo,kinds] of this.parts)for(const [finish,batch] of kinds){
      const kind=landscape?"land":finish;
      if(batch.matrices.length<=3||batch.matrices.length<30&&batch.matrices.length*geo.attributes.position.count<2100){
        if(!fixed.has(kind))fixed.set(kind,[]);
        for(let i=0;i<batch.matrices.length;i++)fixed.get(kind).push({geo,matrix:batch.matrices[i],tint:batch.colors[i]});
        continue;
      }
      const mat=geo.hasAttribute("color")?vertexMaterial(kind):material(kind);
      const mesh=new T.InstancedMesh(geo,mat,batch.matrices.length);
      for(let i=0;i<mesh.count;i++){mesh.setMatrixAt(i,batch.matrices[i]);mesh.setColorAt(i,batch.colors[i]);}
      mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);
    }
    for(const [kind,entries] of fixed){
      const m=new T.Mesh(combineParts(entries),vertexMaterial(kind));m.castShadow=shadows;m.receiveShadow=true;parent.add(m);
    }
    return parent;
  }
}
export function group(parent,x=0,y=0,z=0){
  const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;
}
