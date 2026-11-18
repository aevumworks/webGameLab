const T=globalThis.THREE;
function leavesTexture(random){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=192;const g=canvas.getContext("2d");
  for(let i=0;i<108;i++){
    const a=random()*Math.PI*2,dist=Math.sqrt(random()),x=96+Math.cos(a)*dist*79,y=96+Math.sin(a)*dist*80;
    const r=3+random()*9;g.save();g.translate(x,y);g.rotate(random()*Math.PI);
    const tint=35+Math.floor(random()*33);g.fillStyle="hsl("+(72+random()*18)+",28%,"+tint+"%)";
    g.beginPath();g.moveTo(0,-r);g.quadraticCurveTo(r*.82,-r*.19,r*.47,r*.24);
    g.quadraticCurveTo(r*.15,r*.80,0,r);g.quadraticCurveTo(-r,r*.10,0,-r);g.fill();
    g.beginPath();g.moveTo(0,-r*.78);g.lineTo(0,r*.78);g.strokeStyle="rgba(67,68,42,.47)";g.lineWidth=.65;g.stroke();g.restore();
  }
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
}
export function furnishSquare(scene,ground,solids){
  let seed=31891;const rand=()=>((seed=seed*16807%2147483647)/2147483647);
  const primitive={box:new T.BoxGeometry(1,1,1),post:new T.CylinderGeometry(1,1,1,12),tip:new T.ConeGeometry(1,1,10),leaf:new T.PlaneGeometry(1,1)};
  const leaf=leavesTexture(rand),metal=new T.MeshStandardMaterial({color:0x454c4b,metalness:.62,roughness:.4}),stone=new T.MeshStandardMaterial({color:0x9e9b92,roughness:.86}),
    wood=new T.MeshStandardMaterial({color:0x806347,roughness:.71}),bark=new T.MeshStandardMaterial({color:0x655b47,roughness:.92}),
    canopy=new T.MeshStandardMaterial({color:0xf2f2ca,map:leaf,alphaTest:.38,roughness:1,side:T.DoubleSide}),
    cloth=new T.MeshStandardMaterial({color:0xc4a684,roughness:.95,side:T.DoubleSide}),bulb=new T.MeshStandardMaterial({color:0xe2dcca,emissive:0x8d7860,emissiveIntensity:.26,roughness:.33});
  const mats={metal,stone,wood,bark,canopy,cloth,bulb},bank=new Map(),obj=new T.Object3D(),up=new T.Vector3(0,1,0);
  function add(shape,mat,x,y,z,sx,sy,sz,yaw=0,quat=null){
    obj.position.set(x,y,z);if(quat)obj.quaternion.copy(quat);else obj.rotation.set(0,yaw,0);obj.scale.set(sx,sy,sz);obj.updateMatrix();
    const key=shape+"|"+mat;if(!bank.has(key))bank.set(key,[]);bank.get(key).push(obj.matrix.clone());
  }
  function limb(a,b,r,kind){const d=b.clone().sub(a),l=d.length(),q=new T.Quaternion().setFromUnitVectors(up,d.divideScalar(l));add("post",kind,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,l,r,0,q);}
  function bench(x,z,a){
    const y=ground(x,z),c=Math.cos(a),s=Math.sin(a),offset=(u,v)=>[x+c*u+s*v,z-s*u+c*v];
    for(const n of [-.86,.86]){const [xx,zz]=offset(n,0);add("box","stone",xx,y+.24,zz,.23,.48,.52,a);}
    for(let j=0;j<5;j++){const [xx,zz]=offset(0,(j-2)*.12);add("box","wood",xx,y+.53,zz,2.34,.09,.096,a);}
    for(let j=0;j<3;j++){const [xx,zz]=offset(0,.30+j*.02);add("box","wood",xx,y+.78+j*.14,zz,2.34,.10,.068,a);}
    for(const n of [-.92,.92]){const [xx,zz]=offset(n,.29);add("box","metal",xx,y+.71,zz,.065,.71,.068,a);}
    solids.blocks.push({x,z,hw:1.17,hd:.32,angle:a});
  }
  function tree(x,z,h,r){
    const y=ground(x,z),pt=(a,b,c)=>new T.Vector3(x+a,y+b,z+c);
    const base=pt(0,0,0),fork=pt(.15,h*.43,-.17);limb(base,fork,.205,"bark");solids.posts.push({x,z,r:.24});
    add("box","metal",x,y+.025,z,1.34,.046,1.34);for(let j=0;j<10;j++){add("box","stone",x-.56+j*.125,y+.052,z,.039,.018,1.21);}
    for(let i=0;i<11;i++){const a=i*2.39,reach=r*(.41+.40*rand()),end=pt(Math.cos(a)*reach,h*(.62+.26*rand()),Math.sin(a)*reach);
      limb(fork,end,.078,"bark");const tip=end.clone().add(new T.Vector3(Math.cos(a)*.62,1.38,Math.sin(a)*.58));limb(end,tip,.034,"bark");}
    for(let i=0;i<280;i++){const a=rand()*Math.PI*2,v=rand()*2-1,scale=Math.cbrt(rand()),rr=Math.sqrt(1-v*v)*r*scale;
      const px=Math.cos(a)*rr,pz=Math.sin(a)*rr,py=h*.76+v*r*.88*scale,size=.91+rand()*.96;
      const q=new T.Quaternion().setFromEuler(new T.Euler(rand()*1.1-.55,rand()*Math.PI*2,rand()*1.1-.55));
      add("leaf","canopy",x+px,y+py,z+pz,size,size*(.87+rand()*.29),1,0,q);}
  }
  for(const [x,z] of [[33,35],[33,41],[37,44],[-29,50],[-34,48],[-37,43],[67,-9],[74,-4],[42,-142],[45,-148],[-61,-33],[-63,-40]])bench(x,z,x<0?-.05:Math.PI*.52);
  for(const [x,z] of [[30,43],[41,48],[48,58],[-31,50],[-39,51],[-43,55],[72,-9],[77,-1],[85,6],[42,-162],[47,-176],[51,-189],[-60,32],[-66,34],[-84,46],[92,27],[99,32],[106,38]])tree(x,z,7.4+rand()*2.0,2.55+rand()*1.02);
  for(const [x,z] of [[-33,24],[-30,-4],[33,19],[42,31],[39,-118],[-58,17],[-80,-10],[71,14],[66,-75],[48,-155]]){
    const y=ground(x,z);add("post","metal",x,y+2.85,z,.079,5.7,.079);add("post","metal",x,y+.20,z,.13,.4,.13);
    limb(new T.Vector3(x,y+5.58,z),new T.Vector3(x+.85,y+5.86,z),.051,"metal");
    add("box","metal",x+1.02,y+5.85,z,.70,.11,.30);add("box","bulb",x+1.04,y+5.78,z,.58,.036,.23);solids.posts.push({x,z,r:.12});}
  for(const z of [12,18,24,30,36])for(const x of [-24.8,24.6]){
    const y=ground(x,z);add("post","metal",x,y+.32,z,.114,.64,.114);add("post","stone",x,y+.60,z,.12,.055,.12);solids.posts.push({x,z,r:.12});}
  for(const [x,z] of [[37,39],[41,35],[44,31]]){
    const y=ground(x,z);add("post","metal",x,y+1.28,z,.038,2.54,.038);add("post","metal",x,y+.53,z,.06,1.04,.06);add("post","stone",x,y+.86,z,.53,.08,.53);
    add("tip","cloth",x,y+2.49,z,1.38,.43,1.38);
    for(const sg of [-1,1]){add("box","wood",x+sg*.78,y+.46,z,.40,.07,.40);for(const j of [-.15,.15])add("box","metal",x+sg*.78+j,y+.23,z,.038,.46,.31);}
    solids.posts.push({x,z,r:.54});
  }
  for(const [key,instances] of bank){const [shape,mat]=key.split("|"),mesh=new T.InstancedMesh(primitive[shape],mats[mat],instances.length);
    instances.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();mesh.castShadow=mat!=="bulb";mesh.receiveShadow=true;scene.add(mesh);}
}
