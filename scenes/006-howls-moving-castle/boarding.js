import {T,Kit,group,mix,clamp} from "./atelier.js";
import {roof,windowFrame} from "./buildings.js";

const footX=-6.45,footZ=-14.75,topX=-.40,topZ=-6.72;
const length=Math.hypot(topX-footX,topZ-footZ),angle=Math.atan2(topX-footX,topZ-footZ);
const middle=2.70,top=5.53,lowerEnd=4.83,upperStart=6.03,halfWidth=.60;
const iron=0x455152,brass=0xb19259;
const lowerCount=29,upperCount=30;

function flight(k,from,to,base,rise,count){
  const dz=(to-from)/count;
  for(let i=0;i<count;i++){
    const t=(i+.5)/count,z=mix(from,to,t),y=base+t*rise;
    k.box(0,y-.054,z,halfWidth*2,.108,dz*1.10,i%3?0x967350:0x866548,"wood");
    k.box(0,y+.002,z-dz*.43,halfWidth*2.02,.025,.034,0xa58e68,"brass");
    for(const sign of [-1,1])k.post(sign*.48,y+.015,z,.022,.018,iron);
    if(i%5===0)for(const sign of [-1,1]){
      k.post(sign*halfWidth,y+.22,z,.028,.49,iron);
      k.post(sign*halfWidth,y+.045,z,.050,.068,brass,"brass");
    }
  }
  for(const sign of [-1,1]){
    k.line([sign*.47,base-.13,from],[sign*.47,base+rise-.13,to],.084,iron,"iron","box");
    k.line([sign*halfWidth,base+.46,from],[sign*halfWidth,base+rise+.46,to],.037,brass,"brass");
    k.line([sign*halfWidth,base+.23,from],[sign*halfWidth,base+rise+.23,to],.018,iron);
  }
}
function deck(k,from,to,y,width=1.30){
  const n=Math.ceil((to-from)/.21);
  for(let j=0;j<n;j++)k.box(0,y-.056,mix(from,to,(j+.5)/n),width,.112,(to-from)/n-.013,0x947356,"wood");
  for(const side of [-1,1]){
    k.line([side*width/2,y+.46,from],[side*width/2,y+.46,to],.038,brass,"brass");
    for(const z of [from,to])k.post(side*width/2,y+.19,z,.039,.58,iron);
  }
}
export function boarding(rig){
  const root=group(rig,footX,0,footZ);root.rotation.y=angle;
  const pivot=group(root,0,top,length),stairs=group(pivot,0,-top,-length);
  const lower=group(stairs,0,middle,lowerEnd),low=new Kit();
  flight(low,-lowerEnd,0,-middle,middle,lowerCount);low.finish(lower);
  const fixed=new Kit();deck(fixed,lowerEnd,upperStart,middle,1.62);
  flight(fixed,upperStart,length,middle,top-middle,upperCount);deck(fixed,length,length+.56,top);
  for(const s of [-1,1]){
    fixed.line([s*.60,middle-.10,lowerEnd+.35],[s*.68,top-.42,length+.40],.092,iron,"iron","box");
    fixed.line([s*.6,middle-.15,upperStart],[s*.67,middle+1.24,upperStart+2.70],.062,0x74634b);
  }
  fixed.finish(stairs);
  // The vestibule stays on the hull while the stairs swing onto the aft rack.
  const cabin=new Kit();
  cabin.post(0,top-.16,length,.27,.27,brass,"brass");
  cabin.at([0,top,length+.58],[0,Math.PI,0],null,()=>{
    cabin.box(0,-.07,-.72,2.18,.16,1.72,0x76634c,"wood");
    cabin.at([0,0,-.70],null,null,()=>roof(cabin,2.18,1.50,1.51,.52,0x97664f));
    for(const side of [-1,1]){
      cabin.box(side*.71,.72,-.075,.70,1.44,.18,0xbeb899);
      cabin.box(side*1.03,.74,-.73,.12,1.48,1.54,0xb1ab8b);
      cabin.box(side*.42,.70,.025,.087,1.40,.10,0x665b48,"wood");
    }
    cabin.box(0,1.34,0,2.18,.30,.18,0xc8b99a);
    windowFrame(cabin,-.74,.84,.052,.31,.39);
    cabin.box(0,.59,0,.72,1.18,.12,0x4b554b,"wood");
    cabin.box(0,.56,.073,.58,1.09,.074,0x587a74,"wood");
    cabin.put("rim",[0,.78,.135],[.163,.163,.20],brass,"brass");
    cabin.put("disk",[0,.78,.126],[.143,.143,1],0x334d54,"glass");
    cabin.ball(.22,.43,.15,.044,.044,.037,brass,"brass");
  });
  cabin.finish(root);
  const wheel=group(stairs,1.15,middle+1.08,upperStart+.90),spindle=new Kit();
  const frame=new Kit();
  frame.box(1.16,middle+.34,upperStart+1.17,.83,.67,.46,0x725f50,"iron");
  frame.ball(1.15,middle+1.08,upperStart+1.26,.43,.43,.28,0x5a635b,"iron");
  frame.line([1.15,middle+1.08,upperStart+1.23],[1.15,middle+1.08,upperStart+.77],.155,brass,"brass");
  frame.line([1.17,middle+.03,upperStart+1.15],[1.80,middle+.14,upperStart+3.35],.13,iron);
  frame.line([1.13,middle+.34,upperStart+1.21],[1.74,middle+2.22,upperStart+3.42],.10,iron);
  frame.box(1.87,middle+1.94,upperStart+1.06,.31,1.77,.24,0x5d685d,"iron");
  for(const s of [-1,1])frame.post(1.87+s*.115,middle+2.05,upperStart+.80,.032,1.30,brass,"brass");
  frame.line([1.10,middle+2.09,upperStart+1.20],[1.10,middle+2.09,upperStart+.73],.043,iron);
  frame.ball(1.10,middle+1.98,upperStart+.74,.089,.125,.085,0xf0ca86,"glow");
  for(const s of [-1,1])frame.line([1.10+s*.082,middle+2.095,upperStart+.72],[1.10+s*.065,middle+1.88,upperStart+.72],.012,iron);
  frame.post(1.10,middle+2.105,upperStart+.74,.12,.046,iron);frame.post(1.10,middle+1.86,upperStart+.74,.086,.028,brass,"brass");
  frame.finish(stairs);
  const lantern=new T.PointLight(0xffddb1,13,5.6,1.8);lantern.position.set(.94,middle+1.88,upperStart+.52);stairs.add(lantern);
  spindle.put("rim",[0,0,0],[.57,.57,.74],0x8b6551,"iron");
  spindle.put("hoop",[0,0,-.053],[.52,.52,.65],brass,"brass");
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;spindle.line([0,0,0],[.52*Math.sin(a),.52*Math.cos(a),0],.040,0x7f8a75);
  }
  spindle.ball(0,0,-.02,.144,.144,.081,brass,"brass");spindle.ball(.27,0,-.095,.096,.096,.065,brass,"brass");spindle.finish(wheel);
  const arm=group(stairs),slider=group(stairs),ak=new Kit(),sk=new Kit();
  ak.post(0,.5,0,.034,1,0xb09973,"brass");ak.finish(arm);
  sk.box(0,0,0,.20,.13,.15,0x676c62,"iron");sk.finish(slider);
  let base=0,fold=0;const up=new T.Vector3(0,1,0),p=new T.Vector3(),q=new T.Vector3();
  function update(terrain,bodyHeight,scale,time,phase,speed,air,dt){
    rig.updateWorldMatrix(true,false);p.set(footX,0,footZ).applyMatrix4(rig.matrixWorld);
    base=(terrain(p.x,p.z)-bodyHeight)/scale+.032;
    const tucked=air>.06||speed>.16?1:0;fold=mix(fold,tucked,1-Math.exp(-dt*4.8));
    if(Math.abs(tucked-fold)<.006)fold=tucked;
    const footHeight=mix(base,.20,Math.min(1,air+fold));
    lower.scale.y=(middle-footHeight)/middle;lower.rotation.x=fold*2.45;
    pivot.rotation.y=fold*.88;
    const cycle=time*.48+phase*.73;wheel.rotation.z=cycle;
    p.copy(wheel.position);p.z-=.11;p.x+=Math.cos(cycle)*.27;p.y+=Math.sin(cycle)*.27;
    q.set(wheel.position.x+.72,p.y+Math.sqrt(Math.max(0,1.29**2-(p.x-wheel.position.x-.72)**2)),p.z);
    slider.position.copy(q);arm.position.copy(p);q.sub(p);arm.scale.y=q.length();arm.quaternion.setFromUnitVectors(up,q.normalize());
  }
  const at=new T.Vector3(),basis=new T.Quaternion();
  function station(u,x=0,y=0){
    root.updateWorldMatrix(true,false);at.set(x,y,u).applyMatrix4(root.matrixWorld);
    root.getWorldQuaternion(basis);const look=new T.Vector3(0,0,1).applyQuaternion(basis);
    return {x:at.x,z:at.z,y:at.y,yaw:Math.atan2(look.x,-look.z)};
  }
  function floorAt(x,z){
    at.set(x,rig.parent.position.y,z);root.worldToLocal(at);
    const u=at.z,limit=u>=lowerEnd&&u<=upperStart?.81:halfWidth;
    if(Math.abs(at.x)>limit-.065||u<-.10||u>length+.59||fold>0)return null;
    let y;
    if(u<lowerEnd)y=mix(base,middle,(clamp(Math.floor(Math.max(0,u)*lowerCount/lowerEnd),0,lowerCount-1)+.5)/lowerCount);
    else if(u<=upperStart)y=middle;
    else if(u<length)y=mix(middle,top,(clamp(Math.floor((u-upperStart)*upperCount/(length-upperStart)),0,upperCount-1)+.5)/upperCount);
    else y=top;
    return root.localToWorld(at.set(0,y,u)).y;
  }
  return {update,floorAt,approach:()=>station(-5.3),landing:()=>station(lowerEnd+.40,0,middle),
    sill:()=>station(length+.24,0,top),heading:()=>station(0).yaw};
}
