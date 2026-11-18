const T = globalThis.THREE;
export const tau = Math.PI * 2;
export const vec = (x, y, z) => new T.Vector3(x, y, z);

export function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function mesh(parent, geometry, material, x=0, y=0, z=0) {
  const item = new T.Mesh(geometry, material);
  item.position.set(x,y,z);
  item.castShadow = item.receiveShadow = true;
  parent.add(item);
  return item;
}
const cube = new T.BoxGeometry(1,1,1);
const sphere = new T.SphereGeometry(1,24,16);
export function box(parent, material, x,y,z, w,h,d) {
  const item=mesh(parent,cube,material,x,y,z);
  item.scale.set(w,h,d);
  return item;
}
export function oval(parent, material, x,y,z, w,h,d) {
  const item=mesh(parent,sphere,material,x,y,z);
  item.scale.set(w,h,d);
  return item;
}
export function rod(parent, material, a,b, r1,r2=r1, sides=14) {
  const d=vec(...b).sub(vec(...a)), mid=vec(...a).addScaledVector(d,.5);
  const item=mesh(parent,new T.CylinderGeometry(r2,r1,d.length(),sides),material,mid.x,mid.y,mid.z);
  item.quaternion.setFromUnitVectors(vec(0,1,0),d.normalize());
  return item;
}
export function line(parent, material, points, radius, smooth=true) {
  if(smooth && points.length>2) {
    const curve=new T.CatmullRomCurve3(points.map(p=>vec(...p)));
    return mesh(parent,new T.TubeGeometry(curve,Math.max(12,points.length*4),radius,8),material);
  }
  for(let i=1;i<points.length;i++) rod(parent,material,points[i-1],points[i],radius,radius,8);
}
export function poly(parent,material,points,indices,flat=points.length<=40) {
  const g=new T.BufferGeometry();
  g.setAttribute("position",new T.Float32BufferAttribute(points.flat(),3));
  g.setIndex(indices);
  const surface=flat?g.toNonIndexed():g;
  surface.computeVertexNormals();
  return mesh(parent,surface,material);
}

// A set of elliptical cross sections. Catmull interpolation keeps the carved limbs and muzzle continuous.
export function loft(parent,material,sections,axis="y",segments=24) {
  const centers=new T.CatmullRomCurve3(sections.map(s=>vec(s[0],s[1],s[2])),false,"catmullrom",.38);
  const radii=new T.CatmullRomCurve3(sections.map(s=>vec(s[3],s[4],0)),false,"catmullrom",.38);
  const points=[], indices=[];
  const n=(sections.length-1)*3;
  for(let j=0;j<=n;j++){
    const c=centers.getPoint(j/n), r=radii.getPoint(j/n);
    for(let i=0;i<segments;i++){
      const a=i*tau/segments, x=Math.cos(a)*Math.max(.001,r.x), v=Math.sin(a)*Math.max(.001,r.y);
      points.push(axis==="y"?[c.x+x,c.y,c.z+v]:[c.x+x,c.y+v,c.z]);
      if(j<n){
        const p=j*segments+i,q=j*segments+(i+1)%segments;
        if(axis==="y")indices.push(p,p+segments,q,q,p+segments,q+segments);
        else indices.push(p,q,p+segments,q,q+segments,p+segments);
      }
    }
  }
  for(let i=1;i<segments-1;i++){
    const end=n*segments;
    if(axis==="y")indices.push(0,i,i+1,end,end+i+1,end+i);
    else indices.push(0,i+1,i,end,end+i,end+i+1);
  }
  return poly(parent,material,points,indices);
}

export function hewnUnit(seed) {
  const random=seeded(seed), points=[], indices=[];
  const perimeter=[[-.36,-.5],[.37,-.5],[.5,-.36],[.5,.38],[.35,.5],[-.39,.5],[-.5,.39],[-.5,-.36]];
  for(const [y,s] of [[-.5,.93],[-.41,1],[.37,1],[.5,.88]]){
    for(const [x,z] of perimeter)points.push([x*s+(random()-.5)*.045,y+(random()-.5)*.042,z*s+(random()-.5)*.05]);
  }
  for(let j=0;j<3;j++)for(let i=0;i<8;i++){const p=j*8+i,q=j*8+(i+1)%8;indices.push(p,p+8,q,q,p+8,q+8);}
  for(let i=1;i<7;i++)indices.push(0,i,i+1,24,24+i+1,24+i);
  const indexed=new T.BufferGeometry();
  indexed.setAttribute("position",new T.Float32BufferAttribute(points.flat(),3));indexed.setIndex(indices);
  const flat=indexed.toNonIndexed();flat.computeVertexNormals();
  return flat;
}

export function batch(group) {
  group.updateMatrixWorld(true);
  const inverse=new T.Matrix4().copy(group.matrixWorld).invert(), m=new T.Matrix4(), normal=new T.Matrix3(), v=vec(0,0,0);
  const sets=new Map();
  group.traverse(node=>{
    if(!node.isMesh)return;
    const material=node.material;
    if(!sets.has(material))sets.set(material,{p:[],n:[],idx:[]});
    const buffers=sets.get(material),geo=node.geometry,offset=buffers.p.length/3;
    const pos=geo.getAttribute("position"), norms=geo.getAttribute("normal");
    m.multiplyMatrices(inverse,node.matrixWorld);normal.getNormalMatrix(m);
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i).applyMatrix4(m);buffers.p.push(v.x,v.y,v.z);
      v.fromBufferAttribute(norms,i).applyNormalMatrix(normal);buffers.n.push(v.x,v.y,v.z);
    }
    const index=geo.index;
    for(let i=0;i<(index?index.count:pos.count);i++)buffers.idx.push(offset+(index?index.getX(i):i));
  });
  group.clear();
  for(const [material,b] of sets){
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(b.p,3));
    g.setAttribute("normal",new T.Float32BufferAttribute(b.n,3));g.setIndex(b.idx);g.computeBoundingSphere();mesh(group,g,material);
  }
  return group;
}
