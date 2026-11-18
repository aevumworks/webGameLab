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
const finishes = {
  iron:[.66,.29], brass:[.45,.39], wood:[.95,0], paint:[.84,.035],
  cloth:[.98,0], stone:[.96,0], leaf:[.94,0], glass:[.28,.22], glow:[.7,0]
};
export function material(kind) {
  if (materials.has(kind)) return materials.get(kind);
  const [roughness,metalness] = finishes[kind];
  const m = new T.MeshStandardMaterial({roughness,metalness,side:T.DoubleSide});
  if (kind === "glow") {
    m.onBeforeCompile = s => {
      s.fragmentShader=s.fragmentShader.replace("#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*.76;");
    };
  } else if (kind !== "leaf") {
    m.onBeforeCompile = s => {
      s.vertexShader = "varying vec3 vPaint;varying vec3 vUnit;varying vec2 vTimber;\n"+s.vertexShader;
      s.vertexShader = s.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
        vUnit=position;
        #ifdef USE_INSTANCING
          vPaint=(instanceMatrix*vec4(position,1.)).xyz;
          vec3 dim=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
          vec3 p=position*dim;
          vTimber=dim.x>=dim.y&&dim.x>=dim.z?vec2(p.x,p.y+p.z*.78):dim.y>=dim.z?vec2(p.y,p.x+p.z*.78):vec2(p.z,p.y+p.x*.78);
          vTimber+=instanceMatrix[3].xz*vec2(.16,.43);
        #else
          vPaint=position;vTimber=position.xy;
        #endif`);
      s.fragmentShader = "varying vec3 vPaint;varying vec3 vUnit;varying vec2 vTimber;\n"+shaderNoise+"\n"+s.fragmentShader;
      const weather = kind === "brass"
        ? `float tarnish=smoothstep(.45,.84,paintNoise(p*.91)+.18*paintNoise(p*4.2));
           float polish=paintNoise(vec2(p.x*13.4,p.y*.92));
           diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.105,.143,.100),tarnish*.52);
           diffuseColor.rgb*=.90+.18*polish;`
        : kind === "iron"
        ? `float rust=smoothstep(.53,.85,paintNoise(p*.78)+.22*paintNoise(p*4.));
           diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.33,.68,.55),rust*.65);
           float run=paintNoise(vec2(p.x*14.,p.y*.73));
           float nick=paintNoise(p*28.+paintNoise(p*6.)*2.);
           diffuseColor.rgb*=.81+.26*run+.15*nick;
           diffuseColor.rgb+=vec3(.045,.035,.020)*smoothstep(.82,.94,nick)*(.32+.65*rust);`
        : kind === "wood" ? `float knot=paintNoise(vTimber*vec2(.68,2.90));
           float fibre=paintNoise(vec2(vTimber.x*.87,vTimber.y*67.+3.4*knot));
           float annual=paintNoise(vec2(vTimber.x*.34,vTimber.y*12.+1.9*knot));
           float grainVisibility=1.-smoothstep(.012,.09,fwidth(vTimber.y));
           fibre=mix(.50,fibre,grainVisibility);
           diffuseColor.rgb*=.73+.29*fibre+.18*annual;
           diffuseColor.rgb+=vec3(.018,.012,.006)*smoothstep(.71,.90,fibre);`
        : kind==="glass" ? `float sky=clamp(vUnit.y+.5,0.,1.);
           diffuseColor.rgb*=.69+.57*sky;
           diffuseColor.rgb+=vec3(.038,.069,.073)*smoothstep(.39,.62,fract(vUnit.x*.72+vUnit.y*.39));`
        : kind==="stone" ? `float grit=paintNoise(p*18.);
           diffuseColor.rgb*=.78+.32*grit+.18*paintNoise(p*.8);`
        : `diffuseColor.rgb*=.88+.22*paintNoise(p*.68+.6*paintNoise(p*3.));`;
      s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
        vec2 p=vec2(vPaint.x+.47*vPaint.z,vPaint.y+.35*vPaint.z);
        float fleck=paintNoise(p*1.4)*.56+paintNoise(p*6.)*.30+paintNoise(p*24.)*.14;
        diffuseColor.rgb*=.77+.43*fleck;
        ${weather}`);
      if(kind==="brass"||kind==="iron"){
        s.fragmentShader=s.fragmentShader.replace("#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor+"+
          (kind==="brass"?"tarnish*.30-(1.-tarnish)*.11":"rust*.23-(1.-rust)*nick*.10")+",.20,.96);");
      }
    };
  }
  m.customProgramCacheKey = () => "howl-"+kind;
  materials.set(kind,m);
  return m;
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
  box:new T.BoxGeometry(1,1,1), ball:new T.SphereGeometry(1,20,13),
  pebble:new T.IcosahedronGeometry(1,0), boulder:new T.IcosahedronGeometry(1,1),
  rod:new T.CylinderGeometry(1,1,1,14), pipe:new T.CylinderGeometry(1,1,1,28),
  slim:new T.CylinderGeometry(1,1,1,8), cone:new T.ConeGeometry(1,1,18),
  spire:new T.ConeGeometry(1,1,6), point:new T.ConeGeometry(1,1,6),
  rim:new T.TorusGeometry(1,.09,7,32), hoop:new T.TorusGeometry(1,.032,5,40),
  disk:new T.CircleGeometry(1,32)
};
const latheShapes = new Map();
export function lathe(key,profile,sides=28) {
  if (!latheShapes.has(key)) latheShapes.set(key,new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),sides));
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

export class Kit {
  constructor(){this.parts=new Map();this.frame=new T.Matrix4();}
  at(pos,rot,sz,build){
    const old=this.frame;this.frame=old.clone().multiply(matrixFrom(pos,sz||unit,rot));
    build(this);this.frame=old;
  }
  put(form,pos,sz,color,kind="paint",rot=null){
    const geo=typeof form==="string"?shape[form]:form;
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
    this.put(new T.TubeGeometry(line,segments,r,8,false),origin,unit,c,k);
  }
  surface(s,kind="paint"){this.put(s.geometry(),origin,unit,0xffffff,kind);}
  finish(parent=new T.Group(),shadows=true){
    for(const [geo,kinds] of this.parts)for(const [kind,batch] of kinds){
      let mat=material(kind);
      if(geo.hasAttribute("color")){
        const key=kind+"-vertices";
        if(!materials.has(key)){
          const copy=mat.clone();copy.vertexColors=true;copy.onBeforeCompile=mat.onBeforeCompile;
          copy.customProgramCacheKey=()=>key;materials.set(key,copy);
        }
        mat=materials.get(key);
      }
      const mesh=new T.InstancedMesh(geo,mat,batch.matrices.length);
      for(let i=0;i<mesh.count;i++){mesh.setMatrixAt(i,batch.matrices[i]);mesh.setColorAt(i,batch.colors[i]);}
      mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);
    }
    return parent;
  }
}
export function group(parent,x=0,y=0,z=0){
  const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;
}
