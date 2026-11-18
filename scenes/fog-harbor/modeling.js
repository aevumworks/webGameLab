globalThis.Harbor3D = (() => {
  const T = THREE;
  const tau = Math.PI * 2;
  const boxShape = new T.BoxGeometry(1,1,1);
  const stoneShape = new T.IcosahedronGeometry(1,0);
  const materials = new Map();
  function random(seed) {
    return () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed/4294967296; };
  }
  function mat(color, metal = 0, rough = .88) {
    const key = [color,metal,rough].join("/");
    if (!materials.has(key)) materials.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));
    return materials.get(key);
  }
  function group(parent,name,x=0,y=0,z=0) {
    const obj = new T.Group();
    obj.name = name;
    obj.position.set(x,y,z);
    parent.add(obj);
    return obj;
  }
  function mesh(parent,geo,material,x=0,y=0,z=0) {
    const obj = new T.Mesh(geo,material);
    obj.position.set(x,y,z);
    obj.castShadow = obj.receiveShadow = true;
    parent.add(obj);
    return obj;
  }
  function box(g,m,x,y,z,w,h,d) {
    const obj = mesh(g,boxShape,m,x,y,z);
    obj.scale.set(w,h,d);
    return obj;
  }
  function cyl(g,m,x,y,z,top,bottom,h,sides=24) {
    return mesh(g,new T.CylinderGeometry(top,bottom,h,sides),m,x,y,z);
  }
  function rod(g,m,a,b,r,sides=7,top=r) {
    const from = new T.Vector3(...a), to = new T.Vector3(...b);
    const direction = to.clone().sub(from);
    const middle = from.lerp(to,.5);
    const obj = cyl(g,m,middle.x,middle.y,middle.z,top,r,direction.length(),sides);
    obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
    return obj;
  }
  function rock(g,m,x,y,z,w,h,d,angle=0) {
    const obj = mesh(g,stoneShape,m,x,y,z);
    obj.scale.set(w,h,d); obj.rotation.set(.12,angle,.16*Math.sin(angle));
    return obj;
  }
  function ring(g,m,x,y,z,r,t) {
    const obj = mesh(g,new T.TorusGeometry(r,t,6,48),m,x,y,z);
    obj.rotation.x=Math.PI/2;
    return obj;
  }
  function geometry(positions,colors) {
    const geo = new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    if (colors) geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();
    return geo;
  }
  // Keep a named group per model while batching static parts by material.
  function bake(g) {
    g.updateWorldMatrix(true,true);
    const local = g.matrixWorld.clone().invert();
    const batches = new Map();
    g.traverse(node => {
      if (!node.isMesh) return;
      const m = node.material;
      if (!batches.has(m)) batches.set(m,{ positions:[],normals:[],uv:[],colors:[] });
      const batch = batches.get(m);
      const geo = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
      geo.applyMatrix4(local.clone().multiply(node.matrixWorld));
      function append(dest,attr) { if (attr) for (const value of attr.array) dest.push(value); }
      append(batch.positions,geo.attributes.position);
      append(batch.normals,geo.attributes.normal);
      append(batch.uv,geo.attributes.uv);
      append(batch.colors,geo.attributes.color);
      geo.dispose();
    });
    g.clear();
    for (const [m,batch] of batches) {
      const geo = new T.BufferGeometry();
      for (const [name,values,size] of [["position",batch.positions,3],["normal",batch.normals,3],["uv",batch.uv,2],["color",batch.colors,3]]) {
        if (values.length && values.length/size === batch.positions.length/3) geo.setAttribute(name,new T.Float32BufferAttribute(values,size));
      }
      geo.computeBoundingSphere();
      const obj = mesh(g,geo,m);
      obj.castShadow = !m.transparent;
    }
    return g;
  }
  function limewash() {
    const canvas = document.createElement("canvas"); canvas.width=256;canvas.height=256;
    const c=canvas.getContext("2d"), rng=random(319);
    c.fillStyle="#faf8ef";c.fillRect(0,0,256,256);
    for(let i=0;i<5100;i++) {
      c.fillStyle="rgba(97,86,68,"+(rng()*.12)+")";
      c.fillRect(rng()*256,rng()*256,rng()*2+.4,rng()*2+.5);
    }
    for(let i=0;i<110;i++){
      c.fillStyle="rgba(103,95,80,.067)";
      c.fillRect(rng()*256,rng()*256,rng()*3+1,rng()*14+1);
    }
    const texture=new T.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,1);
    texture.colorSpace=T.SRGBColorSpace;
    return texture;
  }
  return {tau,random,mat,group,mesh,box,cyl,rod,ring,rock,geometry,bake,limewash};
})();
