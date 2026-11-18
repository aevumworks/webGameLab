import {buildCologne} from "../scenes/003-cologne-cathedral/cathedral.js";
import {howl} from "../scenes/006-howls-moving-castle/parameters.js";
import {buildCastle} from "../scenes/006-howls-moving-castle/castle.js";
import {readBuildingCard} from "./read-card.js";
import {giza} from "../scenes/005-giza-anubis/parameters.js";
import {buildKhufu} from "../scenes/005-giza-anubis/pyramid.js";
import {makeSurfaces} from "../scenes/005-giza-anubis/surfaces.js";
const T = globalThis.THREE;
const TAU = Math.PI * 2;
export const buildings = { howl:"哈尔的移动城堡", giza:giza.name, cologne:"科隆大教堂", walden:"瓦尔登小屋", zhaozhou:"赵州桥", qiniandian:"天坛祈年殿", yingxian:"应县木塔", pantheon:"罗马万神殿", "arc-paris":"巴黎凯旋门" };

export async function readBuilding(id) {
  if(id===howl.id)return howl;
  if(id===giza.id)return giza;
  if (!Object.hasOwn(buildings, id)) throw new Error("未知建筑 " + id);
  return readBuildingCard(id);
}

const materials = new Map();
function mat(color) {
  if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness:.85, side:T.DoubleSide }));
  return materials.get(color);
}
function part(parent, geom, color, x=0, y=0, z=0) {
  const mesh = new T.Mesh(geom, mat(color));
  mesh.position.set(x,y,z); parent.add(mesh); return mesh;
}
function box(g,x,y,z,w,h,d,c) { return part(g,new T.BoxGeometry(w,h,d),c,x,y,z); }
function cyl(g,x,y,z,top,base,height,c,n=32) { return part(g,new T.CylinderGeometry(top,base,height,n),c,x,y,z); }
function postRing(g,num,r,h,base,diam,c,phase=0) {
  for(let i=0;i<num;i++) {const a=i*TAU/num+phase; cyl(g,Math.sin(a)*r,base+h/2,Math.cos(a)*r,diam/2,diam/2,h,c,10);}
}
function profile(g, points, depth, z, color) {
  const shape = new T.Shape(points.map(([x,y])=>new T.Vector2(x,y)));
  return part(g,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24}),color,0,0,z);
}
function roof(g,r,h,y,segments,c) {
  const p=[[0,0],[1,0],[1.018,.04],[.9,.085],[.64,.29],[.36,.61],[.14,1],[0,1]]
    .map(([x,v])=>new T.Vector2(x*r,v*h));
  return part(g,new T.LatheGeometry(p,segments),c,0,y,0);
}

// Combines fixed parts into a single draw. The hinged door is batched in its own local frame.
export function bakeParts(group) {
  group.updateWorldMatrix(true,true);
  const inverse=group.matrixWorld.clone().invert(), positions=[], normals=[], colors=[];
  const transform=new T.Matrix4(), normalMatrix=new T.Matrix3(), v=new T.Vector3();
  group.traverse(m=>{
    if(!m.isMesh) return;
    transform.multiplyMatrices(inverse,m.matrixWorld); normalMatrix.getNormalMatrix(transform);
    const a=m.geometry.attributes, idx=m.geometry.index, count=idx?idx.count:a.position.count;
    for(let j=0;j<count;j++) {
      const i=idx?idx.getX(j):j;
      v.fromBufferAttribute(a.position,i).applyMatrix4(transform); positions.push(v.x,v.y,v.z);
      v.fromBufferAttribute(a.normal,i).applyNormalMatrix(normalMatrix); normals.push(v.x,v.y,v.z);
      const c=m.material.color; colors.push(c.r,c.g,c.b);
    }
    m.geometry.dispose();
  });
  group.clear();
  const geom=new T.BufferGeometry();
  for(const [key,data] of Object.entries({position:positions,normal:normals,color:colors})) geom.setAttribute(key,new T.Float32BufferAttribute(data,3));
  geom.computeBoundingSphere();
  const mesh=new T.Mesh(geom,new T.MeshStandardMaterial({vertexColors:true,roughness:.86,side:T.DoubleSide}));
  mesh.castShadow=mesh.receiveShadow=true; group.add(mesh); return mesh;
}

function cabin(g,p,s) {
  const w=p.width,d=p.length,h=p.postHeight,b=s.plinth,t=s.wallThickness, hw=w/2, hd=d/2;
  const timber=["#74503c","#9a6c49","#ad7e53","#896244","#b38a5e","#755941","#a17853"];
  const stone="#777970",edge="#594838",cream="#d6b585",brick="#985e47";
  box(g,0,b/2,0,w+.15,b,d+.15,stone);
  for(let i=0;i<15;i++) box(g,-hw+(i+.5)*w/15,b+.026,0,w/15-.008,.052,d,timber[i%7]);
  const strips=15, sh=h/strips;
  function board(gaps,extent,z,y,side,seed) {
    let start=-extent/2;
    for(const [left,right] of [...gaps,[extent/2,extent/2]]) {
      if(left>start+.005) {
        const middle=(start+left)/2,len=left-start,c=timber[(seed+Math.round(start*17+600))%7];
        if(side) box(g,z,y,middle,t,sh-.004,len,c); else box(g,middle,y,z,len,sh-.004,t,c);
      }
      start=right;
    }
  }
  for(let i=0;i<strips;i++) {
    const local=(i+.5)*sh, y=b+local, window=local>s.sill && local<s.sill+s.windowHeight;
    for(const sign of [-1,1]) board(window?[[-s.windowWidth/2,s.windowWidth/2]]:[],d,sign*hw,y,true,i*3);
    board(local<s.doorHeight?[[-s.doorWidth/2,s.doorWidth/2]]:[],w,hd,y,false,i);
    board([],w,-hd,y,false,i*2);
  }
  for(const side of [-1,1]) {
    const x=side*(hw+.016), mid=b+s.sill+s.windowHeight/2;
    for(const sign of [-1,1]) {
      box(g,x,mid,sign*s.windowWidth/2,t+.06,s.windowHeight+.1,.08,cream);
      box(g,x,mid+sign*s.windowHeight/2,0,t+.08,.09,s.windowWidth+.15,cream);
    }
    box(g,x,mid,0,.06,s.windowHeight,.038,edge);
    box(g,x,mid,0,.06,.041,s.windowWidth,edge);
  }
  const pitch=T.MathUtils.degToRad(s.roofPitchDeg), ridge=b+h+Math.tan(pitch)*hw, eave=b+h;
  for(const z of [-hd,hd]) profile(g,[[-hw,eave],[hw,eave],[0,ridge]],t,z-t/2,timber[3]);
  const tiles=["#584e48","#5d5655","#73635c","#6c5d55","#887768","#5c5550","#756458"];
  const slope=(hw+s.overhang)/Math.cos(pitch), run=hw+s.overhang;
  for(const side of [-1,1]) {
    const panel=box(g,side*run/2,ridge-Math.tan(pitch)*run/2,0,slope,.12,d+2*s.overhang,tiles[0]);panel.rotation.z=-side*pitch;
    for(let row=0;row<8;row++) for(let k=0;k<14;k++) {
      const across=(row+.5)*run/8,len=(d+2*s.overhang)/14, off=(k+.5)*len-(d+2*s.overhang)/2;
      const tile=box(g,side*across,ridge-Math.tan(pitch)*across+.075+row*.002,off,slope/8+.018,.035,len-.008,tiles[(k*3+row*4+(k*row)%5)%7]);tile.rotation.z=-side*pitch;
    }
  }
  for(const x of [-hw,hw]) for(const z of [-hd,hd]) box(g,x,b+h/2,z,.12,h,.13,edge);
  for(const side of [-1,1]) box(g,side*(s.doorWidth/2+.035),b+s.doorHeight/2,hd+.03,.1,s.doorHeight,.2,cream);
  box(g,0,b+s.doorHeight,hd+.04,s.doorWidth+.2,.12,.2,cream);
  box(g,0,b+.02,hd+.2,1.22,.13,.56,stone);
  const furnaceZ=-hd+.38;
  box(g,0,b+.08,furnaceZ,.96,.16,.77,stone);
  for(const x of [-.37,.37]) box(g,x,b+.53,furnaceZ,.23,.9,.58,brick);
  box(g,0,b+1.03,furnaceZ,1.04,.19,.65,brick);
  box(g,0,b+.59,furnaceZ-.24,.64,.85,.14,"#3d3435");
  box(g,0,(ridge+b+1.25)/2+.24,furnaceZ,.5,ridge-b-.8,.48,brick);
  for(let i=0;i<5;i++) box(g,0,ridge-.36+i*.15,furnaceZ,.55,.035,.53,"#b78567");
  box(g,-hw+.46,b+.76,-.52,.68,.11,1.23,timber[2]);
  for(const x of [-hw+.18,-hw+.72]) for(const z of [-1.02,-.02]) box(g,x,b+.37,z,.08,.74,.08,edge);
  cyl(g,-.49,b+.41,-.39,.28,.25,.11,timber[3],10);
  for(const z of [-.53,-.26]) box(g,-.49,b+.22,z,.085,.43,.08,edge);
  const hinge=new T.Group(); hinge.position.set(-s.doorWidth/2,b,hd+.055);
  for(let i=0;i<6;i++) box(hinge,(i+.5)*s.doorWidth/6,s.doorHeight/2,0,s.doorWidth/6-.006,s.doorHeight-.035,.061,timber[(i+3)%7]);
  for(const y of [.27,s.doorHeight-.26]) box(hinge,s.doorWidth/2,y,.046,s.doorWidth-.06,.105,.05,edge);
  part(hinge,new T.SphereGeometry(.045,8,6),"#bd9c4d",s.doorWidth-.12,.96,.08);
  bakeParts(hinge); g.userData.door=hinge;
}
function bridge(g,p,s) {
  const half=p.span/2,R=half*half/(2*p.rise)+p.rise/2;
  const soffit=x=>Math.sqrt(Math.max(0,R*R-x*x))-(R-p.rise);
  const deck=x=>p.rise+s.deckLift-3.6*(Math.abs(x)/(p.length/2))**1.65;
  const width=x=>p.widthCenter+(p.widthAtSpring-p.widthCenter)*Math.min(1,Math.abs(x)/half);
  const shape=new T.Shape();shape.moveTo(-p.length/2,-.48);shape.lineTo(-half,-.48);
  for(let i=0;i<=84;i++){const x=-half+i*p.span/84;shape.lineTo(x,soffit(x));}
  shape.lineTo(half,-.48);shape.lineTo(p.length/2,-.48);
  for(let i=80;i>=0;i--){const x=-p.length/2+i*p.length/80;shape.lineTo(x,deck(x));}shape.closePath();
  for(const sign of [-1,1]) for(const [x,span] of [[15.35,p.innerSpandrel],[20.65,p.outerSpandrel]]) {
    const c=x*sign,top=deck(c)-.52,base=top-s.smallArchHeight;
    const hole=new T.Path();hole.moveTo(c-span/2,base);hole.absellipse(c,base,span/2,s.smallArchHeight,Math.PI,0,true);hole.lineTo(c+span/2,base-.19);hole.lineTo(c-span/2,base-.19);hole.closePath();shape.holes.push(hole);
  }
  const geo=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:18}),a=geo.attributes.position;
  for(let i=0;i<a.count;i++) a.setZ(i,(a.getZ(i)-.5)*width(a.getX(i))); geo.computeVertexNormals();part(g,geo,"#c5ae8e");
  for(let j=0;j<p.ribs;j++){const z=((j+.5)/p.ribs-.5)*p.widthCenter;
    const pts=Array.from({length:21},(_,i)=>{const x=-half+i*p.span/20;return new T.Vector3(x,soffit(x)-.035,z*width(x)/p.widthCenter);});
    part(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),28,.042,5,false),"#978067");
  }
  for(const sign of [-1,1]) {
    const count=Math.ceil(p.length/s.parapetSpacing);
    const railingRun=p.length-.22;
    for(let i=0;i<=count;i++){const x=railingRun*(i/count-.5),y=deck(x),z=sign*(width(x)/2-.19);
      box(g,x,y+s.railHeight/2,z,.22,s.railHeight,.24,"#c0a88c");
      if(i<count){const xx=x+railingRun/count, yy=deck(xx),beam=box(g,(x+xx)/2,(y+yy)/2+s.railHeight*.74,z,Math.hypot(xx-x,yy-y),.23,.19,"#d8c4a0");beam.rotation.z=Math.atan2(yy-y,xx-x);}
    }
  }
}
function temple(g,p,s) {
  for(let i=0;i<p.terraces;i++){const h=s.terraceHeight/p.terraces;cyl(g,0,h*(i+.5),0,s.terraceRadii[i],s.terraceRadii[i]+.25,h,"#d4cbb0",56);
    postRing(g,72,s.terraceRadii[i]-.45,.83,(i+1)*h,.21,"#ebe2c6");
    const rail=part(g,new T.TorusGeometry(s.terraceRadii[i]-.45,.095,6,96),"#e1d9bf",0,(i+1)*h+.55,0);rail.rotation.x=Math.PI/2;}
  const b=s.terraceHeight,H=p.totalHeight-b;
  postRing(g,p.centralPosts,s.centralColumnRadius,p.centralPostHeight,b,p.centralPostDiameter,"#a34431",Math.PI/4);
  postRing(g,p.innerPosts,s.innerColumnRadius,H*.52,b,.74,"#a34431");
  postRing(g,p.outerPosts,p.outerColumnDiameter/2,H*.31,b,.64,"#a34431");
  cyl(g,0,b+H*.12,0,11.3,11.3,H*.24,"#ae5238",48);
  for(let j=0;j<24;j++){const a=j*TAU/24,panel=box(g,11.27*Math.sin(a),b+H*.125,11.27*Math.cos(a),1.65,H*.164,.14,"#833b30");panel.rotation.y=a;
    const grille=box(g,11.38*Math.sin(a),b+H*.16,11.38*Math.cos(a),1.36,H*.064,.08,"#c7a268");grille.rotation.y=a;}
  for(let i=0;i<p.eaves;i++){const y=b+H*s.eaveFractions[i],next=i===2?b+H*.965:b+H*s.eaveFractions[i+1];const r=s.roofRadii[i];
    cyl(g,0,y-.47,0,r*.91,r*.91,.65,"#327777",64);cyl(g,0,y-.07,0,r*1.012,r*1.012,.18,"#bd9a52",64);
    roof(g,r,next-y,y,84,"#295773");if(i<2)cyl(g,0,(y+next)/2,0,s.roofRadii[i+1]*.72,s.roofRadii[i+1]*.72,next-y,"#a34f36",56);}
  cyl(g,0,p.totalHeight-.62,0,.08,1.12,1.24,"#d8b455");
}
function pagoda(g,p,s) {
  const r=p.diameter/2; cyl(g,0,p.base/2,0,r*1.10,r*1.16,p.base,"#b49d85",p.sides);
  let prev=p.base;
  for(let i=0;i<p.eaves;i++){const y=p.base+p.timber*s.roofLevels[i],rad=r*s.roofScales[i];
    const wall=rad*.72, H=y-prev;cyl(g,0,prev+H*.43,0,wall,wall,H*.86,"#b78055",8);
    postRing(g,8,rad*.83,H*.86,prev,.65,"#733c2c",0);
    cyl(g,0,prev+.14,0,rad*.86+s.balconyDepth*.35,rad*.9,.28,"#754c37",8);
    for(let j=0;j<16;j++){const a=(j+.5)*TAU/16;cyl(g,Math.sin(a)*wall,prev+H*.49,Math.cos(a)*wall,.38,.38,H*.42,"#563d34",6);}
    roof(g,rad,H*.42,y-H*.24,8,"#574f48");prev=y;}
  const y=p.base+p.timber;cyl(g,0,y+p.brickCrown/2,0,1.6,3.9,p.brickCrown,"#82654c",8);
  cyl(g,0,y+p.brickCrown+p.spire/2,0,.12,1,p.spire,"#836943",12);
  for(let i=0;i<6;i++)cyl(g,0,y+p.brickCrown+(i+.7)*p.spire/7,0,.98-i*.10,1.15-i*.11,.25,"#b59353",16);
}
function pantheon(g,p,s) {
  const R=p.interiorDiameter/2,r=R+s.drumWall, cut=Math.asin(s.doorWidth/(2*R)),stone="#c29c83";
  const wall=new T.Shape();wall.absarc(0,0,r,Math.PI/2+cut,Math.PI*2.5-cut,false);
  wall.absarc(0,0,R,Math.PI*2.5-cut,Math.PI/2+cut,true);wall.closePath();
  const drum=part(g,new T.ExtrudeGeometry(wall,{depth:R,bevelEnabled:false,curveSegments:68}),stone);
  drum.rotation.x=-Math.PI/2; drum.rotation.z=Math.PI;
  cyl(g,0,-.2,0,r,r,.4,"#d6c6a8",96);
  const start=Math.asin(p.oculus/(2*R)),curve=[];
  for(let i=0;i<=36;i++){const a=start+(Math.PI/2-start)*i/36;curve.push(new T.Vector2(R*Math.sin(a),R*Math.cos(a)));}
  for(let i=36;i>=0;i--){const a=start+(Math.PI/2-start)*i/36;curve.push(new T.Vector2((R+1.6)*Math.sin(a),(R+1.1)*Math.cos(a)));}
  part(g,new T.LatheGeometry(curve,96),"#ab927d",0,R,0);
  for(let ring=0;ring<p.cofferRings;ring++){const phi=.34+(ring+.5)*.222;
    for(let i=0;i<p.coffersPerRing;i++){const a=i*TAU/p.coffersPerRing,rr=(R-.055)*Math.sin(phi);
      const panel=box(g,rr*Math.sin(a),R+(R-.065)*Math.cos(phi),rr*Math.cos(a),rr*.146,.09,2.25,"#9e826a");
      panel.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.sin(phi)*Math.sin(a),Math.cos(phi),Math.sin(phi)*Math.cos(a)));}}
  const z=r+s.porticoDepth*.35,w=s.porticoWidth,H=s.columnHeight;
  box(g,0,.24,z,w+.8,.48,s.porticoDepth+2,"#cbb798");
  for(let row=0;row<3;row++)for(let i=0;i<s.columnsAcross;i++){
    if(row>0 && i%2===1)continue;const x=(i/(s.columnsAcross-1)-.5)*(w-2),zz=z+s.porticoDepth*(.44-row*.42);
    cyl(g,x,H/2+.45,zz,s.columnRadius*.88,s.columnRadius,H,"#aa9b85",18);cyl(g,x,H+.42,zz,1,1,.52,"#d1bd9f",16);}
  box(g,0,H+1.37,z,w+1,1.45,s.porticoDepth+1,"#c4aa8c");
  profile(g,[[-w/2,H+2.05],[w/2,H+2.05],[0,H+6.2]],s.porticoDepth,z-s.porticoDepth/2,"#b9987d");
}
function arc(g,p,s) {
  const corniceProjection=1.1,w=p.width-corniceProjection,d=p.depth-corniceProjection,H=p.height, half=s.mainSpan/2, side=s.sideSpan/2;
  const pierW=w/2-half,pierD=d/2-side;
  for(const x of [-1,1])for(const z of [-1,1]){
    box(g,x*(half+pierW/2),H*.42,z*(side+pierD/2),pierW,H*.84,pierD,"#d2bb9c");
    box(g,x*(half+pierW/2),1.05,z*(side+pierD/2),pierW+.6,2.1,pierD+.44,"#b49b81");
    box(g,x*(half+pierW/2),11,z*(d/2+.12),pierW*.62,13,.43,"#baa084");
  }
  function spandrel(radius,crown,depth,z) {
    const pts=[[-radius,H*.84],[radius,H*.84]];
    for(let i=0;i<=32;i++){const a=i*Math.PI/32;pts.push([Math.cos(a)*radius,crown-radius+Math.sin(a)*radius]);}
    return profile(g,pts,depth,z,"#d3bea2");
  }
  spandrel(half,s.mainCrown,d,-d/2);
  for(const sign of [-1,1]){const arch=spandrel(side,s.sideCrown,pierW,0);arch.rotation.y=Math.PI/2;arch.position.x=sign<0?-w/2:half;}
  box(g,0,(H+s.corniceY)/2,0,w,H-s.corniceY,d,"#c7af91");
  for(const [y,ext,h] of [[s.corniceY,1.1,1.1],[H-s.atticHeight,.65,.54],[H-.5,.7,1]])box(g,0,y,0,w+ext,h,d+ext,"#e1cdb1");
}
const builders={walden:cabin,zhaozhou:bridge,qiniandian:temple,yingxian:pagoda,pantheon,"arc-paris":arc};
export function buildBuilding(card) {
  if(card.id==="howl")return buildCastle(card).root;
  if(card.id===giza.id)return buildKhufu(card,makeSurfaces());
  if(card.id==="cologne")return buildCologne(card);
  const group=new T.Group(); group.name=card.name;
  builders[card.id](group,card.documented,card.design); bakeParts(group);
  if(group.userData.door)group.add(group.userData.door);
  return group;
}
