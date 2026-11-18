import {giza} from "./parameters.js";
import {seeded, hewnUnit, batch, box, mesh, poly, tau} from "./geometry.js";
import {distantPyramid} from "./pyramid.js";
const T=globalThis.THREE, c=giza.design, cs=Math.cos(c.exhibitYaw),sn=Math.sin(c.exhibitYaw);
export function toWorld(x,z){return [c.exhibitX+cs*x+sn*z,c.exhibitZ-sn*x+cs*z];}
export function toCourt(x,z){x-=c.exhibitX;z-=c.exhibitZ;return [cs*x-sn*z,sn*x+cs*z];}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const others=[
  {x:-338,z:-350,base:215.3,original:143.5,height:135.8,y:10,rows:102,cap:110},
  {x:-573,z:-738,base:104,original:65.5,height:61.1,y:15,rows:64},
  {x:148,z:47,base:49,original:30.5,height:22.2,y:0,rows:28},
  {x:148,z:-11,base:49,original:30.5,height:19.5,y:0,rows:25},
  {x:149,z:-70,base:46,original:29,height:19.2,y:0,rows:24}
];
export function ground(x,z){
  const d=Math.max(Math.abs(x)-120,Math.abs(z)-119);
  let h=(3.9*Math.sin(.013*x+.008*z)+2.8*Math.sin(.019*z-.011*x)+1.25*Math.sin(.039*x-.021*z)+.42*Math.sin(.084*z+.049*x))*smooth(0,200,d);
  h+=16*smooth(50,670,-z-x*.20)+10*smooth(390,860,Math.abs(x)) + 1.1;
  h*=smooth(0,48,d);
  const [u,v]=toCourt(x,z);h*=smooth(0,38,Math.max(Math.abs(u)-14,Math.abs(v)-17));
  // Keep the north staircase and the surveyed base on one level of bedrock.
  if(z>0)h*=smooth(0,35,Math.max(Math.abs(x-7)-16,z-150));
  for(const b of others){const dist=Math.max(Math.abs(x-b.x),Math.abs(z-b.z))-b.base*.51;h=T.MathUtils.lerp(b.y,h,smooth(0,55,dist));}
  return h-.06;
}
export function routeLine(){
  const [x,z]=toWorld(0,-14);return [[x,z],[59,195],[29,171],[7.29,149]];
}
const path=routeLine();
function distanceToPath(x,z){
  let best=Infinity;
  for(let i=1;i<path.length;i++){
    const [a,b]=path[i-1],[u,v]=path[i],dx=u-a,dz=v-b,t=T.MathUtils.clamp(((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz),0,1);
    best=Math.min(best,Math.hypot(x-a-t*dx,z-b-t*dz));
  }return best;
}
export function buildPlateau(scene,m){
  const rng=seeded(9544),field=new T.PlaneGeometry(3650,3650,240,240);
  field.rotateX(-Math.PI/2);const attr=field.attributes.position;
  for(let i=0;i<attr.count;i++)attr.setY(i,ground(attr.getX(i),attr.getZ(i)));
  field.computeVertexNormals();const land=mesh(scene,field,m.sand);land.castShadow=false;
  for(const b of others){
    const p=distantPyramid(b.base,b.original,b.height,m.limestone,b.rows,b.cap);p.position.set(b.x,b.y,b.z);scene.add(p);
    if(b.cap){
      const capBase=b.base*(1-b.cap/b.original);
      const cap=distantPyramid(capBase,b.original-b.cap,b.height-b.cap,m.light,8,0);
      cap.scale.set(1.006,1,1.006);cap.position.set(b.x,b.y+b.cap+.08,b.z);scene.add(cap);
    }
  }
  const blocks=[],grounds=[],shelves=[],tiles=[],stoneGeo=hewnUnit(775);
  function store(x,y,z,w,h,d,angle,tint,target=blocks){target.push([x,y,z,w,h,d,angle,tint]);}
  const ruins=new T.Group();
  // The cemetery grid preserves streets between long mastabas, with low battered walls and offering niches.
  const solid=[];
  for(const [startX,startZ,nx,nz] of [[195,132,4,7],[-155,106,7,7]]){
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      if(rng()<.17)continue;
      const x=startX+(startX>0?1:-1)*i*19+(rng()-.5)*1.8, z=startZ-j*26, w=10+rng()*4,d=15+rng()*6,h=1.8+rng()*2.9,y=ground(x,z);
      solid.push({x,z,w:w/2,d:d/2});
      for(let row=0;row<Math.ceil(h/.55);row++){
        const scale=1-row*.025,a=w*scale,b=d*scale;
        for(let k=0;k<5;k++)for(const s of [-1,1]){
          store(x-a/2+(k+.5)*a/5,y+.28+row*.53,z+s*(b/2-.43),a/5+.03,.57,.92,0,.83+rng()*.25);
        }
        for(let k=0;k<6;k++)for(const s of [-1,1]){
          store(x+s*(a/2-.40),y+.28+row*.53,z-b/2+(k+.5)*b/6,.95,.57,b/6+.02,0,.86+rng()*.24);
        }
      }
      const corners=(a,b,h)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[x+u*a*.5,h,z+v*b*.5]);
      poly(ruins,m.limestone,[...corners(w*.985,d*.985,y-.10),...corners(w*.79,d*.79,y+h-.13)],
        [0,4,1,1,4,5,1,5,2,2,5,6,2,6,3,3,6,7,3,7,0,0,7,4,4,7,6,4,6,5]);
      if(rng()>.35)box(ruins,m.paving,x,y+h-.20,z,w*.81,.23,d*.83);
    }
  }
  // Long bedding planes and eroded benches beyond the immediate apron.
  for(let k=0;k<100;k++){
    const x=(rng()-.5)*1900,z=(rng()-.5)*1850;
    if(Math.max(Math.abs(x),Math.abs(z))<290)continue;
    const rad=6+22*rng(),base=ground(x,z)-.8,rot=rng()*tau;
    for(let j=0;j<3;j++)store(x+j*.5,base+j*(.64+rad*.024),z,rad*(1-.10*j),1.7+rad*.042,rad*(.5+.21*rng())*(1-.10*j),rot,.80+.20*rng(),shelves);
  }
  for(let i=0;i<6500;i++){
    const x=(rng()-.5)*570,z=-132+rng()*516,[u,v]=toCourt(x,z);
    if(Math.abs(u)<14&&Math.abs(v)<17||Math.abs(x)<115&&Math.abs(z)<115||distanceToPath(x,z)<1.9)continue;
    const k=rng(),size=k>.97?.65+rng()*1.15:.05+.41*rng()**2;
    store(x,ground(x,z)+size*.10,z,size*(.85+rng()),size*(.28+rng()*.26),size*(.7+rng()*.5),rng()*tau,.67+.39*rng(),grounds);
  }
  for(let i=1;i<path.length;i++){
    const [a,b]=path[i-1],[u,v]=path[i],dx=u-a,dz=v-b,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),n=Math.ceil(len/2);
    for(let j=0;j<n;j++)for(let k=0;k<3;k++){
      const t=(j+.5)/n,lateral=(k-1)*1.18;
      const x=a+t*dx+lateral*dz/len,z=b+t*dz-lateral*dx/len;
      store(x,ground(x,z)+.045,z,1.15,.19,len/n-.036,ang,.81+.25*rng(),shelves);
    }
  }
  function instances(rows,material,distance){
    const patches=new Map(),o=new T.Object3D(),tint=new T.Color();
    for(const row of rows){
      const key=distance?Math.floor(row[0]/31)+":"+Math.floor(row[2]/31):"horizon";
      if(!patches.has(key))patches.set(key,[]);patches.get(key).push(row);
    }
    for(const patch of patches.values()){
      const item=new T.InstancedMesh(stoneGeo,material,patch.length);
      patch.forEach(([x,y,z,w,h,d,a,t],i)=>{o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.y=a;o.updateMatrix();item.setMatrixAt(i,o.matrix);item.setColorAt(i,tint.setRGB(t,t,t*.98));});
      item.computeBoundingSphere();item.receiveShadow=true;scene.add(item);
      if(distance){item.visible=false;tiles.push([item,(distance+item.boundingSphere.radius)**2]);}
    }
  }
  instances(blocks,m.limestone,51);instances(grounds,m.paving,39);instances(shelves,m.limestone,0);scene.add(batch(ruins));
  return {
    passable(x,z){return !others.some(b=>Math.max(Math.abs(x-b.x),Math.abs(z-b.z))<b.base/2+.30) &&
      !solid.some(b=>Math.abs(x-b.x)<b.w+.28&&Math.abs(z-b.z)<b.d+.28);},
    updateDetail(position){for(const [tile,squared] of tiles)tile.visible=tile.boundingSphere.center.distanceToSquared(position)<squared;}
  };
}
