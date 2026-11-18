const T=globalThis.THREE;

// Use the exhibition meshes and their original face winding, under neutral modelling lights.
export function clayLighting(renderer,scene,coarse){
  const materials=new Map();
  function clay(source){
    if(!materials.has(source.side)){
      materials.set(source.side,new T.MeshStandardMaterial({color:0xb0b0b0,roughness:1,side:source.side}));
    }
    return materials.get(source.side);
  }
  scene.traverse(node=>{
    if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(clay):clay(node.material);
    if(node.isLight)node.visible=false;
  });
  scene.background=new T.Color(0xd9d9d9);
  scene.fog=new T.FogExp2(0xd9d9d9,.00060);
  const fill=new T.HemisphereLight(0xffffff,0xb0b0b0,1.05);
  const key=new T.DirectionalLight(0xffffff,2.35);
  key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-33,right:33,bottom:-33,top:33,near:1,far:190});
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.mapSize.setScalar(coarse?1024:2048);
  key.shadow.normalBias=.026;key.shadow.bias=-.00024;
  scene.add(fill,key,key.target);
  const previous=new T.Vector3(Infinity,0,0);
  let reverse=false;
  return {
    update(camera,place,dt,moving){
      const position=camera.position;
      if(previous.distanceToSquared(position)<1&&!moving)return;
      previous.copy(position);key.target.position.copy(position);
      key.position.set(position.x+(reverse?55:-55),position.y+78,position.z+49);
      renderer.shadowMap.needsUpdate=true;
    },
    toggle(){reverse=!reverse;previous.x=Infinity;return reverse;}
  };
}
