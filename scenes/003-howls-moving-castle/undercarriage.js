import {T,TAU,Kit,group,clamp,mix,smooth} from "./atelier.js";

const iron=0x3b5a5d,bronze=0xcb9656,grease=0x344449,up=new T.Vector3(0,1,0),axle=new T.Vector3(1,0,0);
const soleEnds=[[-.56,.033,.72],[0,.031,1.13],[.54,.034,.75],[.08,.034,-.61]];
const ankleHeight=.38;
const shortestAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const contactPoints=[new T.Vector3(0,.001,0)];
for(const [x,,z] of soleEnds){
  const angle=Math.atan2(x,z);
  for(const a of [-.0525,.0525])for(const b of [-.09,.09]){
    contactPoints.push(new T.Vector3(x+a*Math.cos(angle)+b*Math.sin(angle),0,z-a*Math.sin(angle)+b*Math.cos(angle)));
  }
}
function makeLink(thigh){
  const k=new Kit(),r=thigh?.26:.17;
  for(const sign of [-1,1]){
    k.line([sign*r,.08,0],[sign*r*.72,.88,0],thigh?.092:.059,iron,"iron","box");
    k.line([sign*r,.15,-.11],[sign*r*.73,.78,.10],.042,bronze,"brass");
  }
  k.post(0,.35,0,r,.59,thigh?0x547d78:0xa26e48);
  k.post(0,.72,0,r*.63,.47,0xe0c690,"brass");
  for(const y of [.08,.51,.60,.91])k.post(0,y,0,r*1.20,.051,grease);
  return k.finish();
}
function bearing(r){
  const k=new Kit();k.ball(0,0,0,r*.89,r,r,iron,"iron");
  k.line([-r*1.31,0,0],[r*1.31,0,0],r*.61,bronze,"brass","rod");
  for(const s of [-1,1]){
    k.line([s*r*.89,0,0],[s*r*1.12,0,0],r*1.04,0x786f58,"iron","rod");
    k.line([s*r*1.29,0,0],[s*r*1.36,0,0],r*.63,grease,"iron","slim");
  }return k.finish();
}
function claw(){
  const k=new Kit();k.ball(0,.20,0,.31,.19,.39,0x97845d,"iron");
  k.box(0,.049,0,.37,.096,.43,0x5c5b4a,"iron");
  for(const side of [-1,1])k.line([side*.18,.12,.09],[side*.20,ankleHeight,0],.075,iron,"iron","box");
  for(const end of soleEnds){
    const mid=[end[0]*.66,.16,end[2]*.61];
    k.line([0,.20,0],mid,.113,bronze);k.ball(...mid,.096,.089,.098,grease,"iron");
    k.line(mid,end,.085,0x655c48,"iron","point");
    k.box(end[0],.025,end[2],.105,.05,.18,grease,"iron",[0,Math.atan2(end[0],end[2]),0]);
  }
  return k.finish();
}
function pin(mesh,a,b){
  mesh.position.copy(a);const v=new T.Vector3().subVectors(b,a);mesh.scale.y=v.length();
  mesh.quaternion.setFromUnitVectors(up,v.normalize());
}
function worldAt(rest,x,z,yaw,scale,out){
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return out.set(x+scale*(rest.x*c+rest.z*s),0,z+scale*(-rest.x*s+rest.z*c));
}
export function undercarriage(rig,body,scale){
  const legs=[],base=rig.parent,mounts=new Kit(),upperModel=makeLink(true),lowerModel=makeLink(false),kneeModel=bearing(.34),ankleModel=bearing(.216),footModel=claw();
  for(const side of [-1,1])for(const fore of [-1,1]){
    const hip=new T.Vector3(side*(fore>0?4.42:4.13),fore>0?5.04:5.22,fore*(fore>0?3.04:3.18));
    const rest=new T.Vector3(side*(fore>0?5.82:5.38),0,fore*(fore>0?3.75:4.02));
    const upper=upperModel.clone(),lower=lowerModel.clone(),knee=kneeModel.clone(),ankle=ankleModel.clone(),foot=footModel.clone();
    rig.add(upper,lower,knee,ankle,foot);
    const mount=bearing(.42);body.add(mount);mount.position.copy(hip);
    mounts.at(hip.toArray(),null,null,()=>{
      mounts.box(-side*.29,.55,-fore*.19,1.10,.61,1.00,0x677066,"iron",[0,0,-side*.28]);
      for(const s of [-1,1]){
        mounts.line([s*.31,.05,0],[s*.37-side*.36,.86,-fore*.24],.147,iron,"iron","box");
        mounts.post(s*.39-side*.24,.69,fore*.25,.10,.18,bronze,"brass");
      }
    });
    legs.push({id:(side<0?"L":"R")+(fore>0?"F":"R"),side,fore,rest,hip,upper,lower,knee,ankle,foot,mount,
      contact:true,footYaw:0,fromYaw:0,soleRotation:new T.Quaternion(),supportOffset:0,anchor:new T.Vector3(),tip:new T.Vector3(),from:new T.Vector3(),to:new T.Vector3(),phaseOffset:(side*fore>0?.02:.52)+(fore>0?.045:0)});
  }
  mounts.finish(body);
  let last=null,sampleGround=()=>0;
  function update(time,phase,motion,ground,air){
    const newTerrain=sampleGround!==ground;sampleGround=ground;base.updateWorldMatrix(true,false);rig.updateWorldMatrix(true,false);body.updateMatrix();
    const x=base.position.x,z=base.position.z,yaw=base.rotation.y;
    const dt=last?time-last.time:0,rate=dt>0?(phase-last.phase)/dt:0;
    const reset=!last||newTerrain||Math.hypot(x-last.x,z-last.z)>12||last.air>.08&&air<=.08;
    const yawRate=dt>0?Math.atan2(Math.sin(yaw-last.yaw),Math.cos(yaw-last.yaw))/dt:0;
    const vx=dt>0?(x-last.x)/dt:0,vz=dt>0?(z-last.z)/dt:0;
    for(const l of legs){
      const wasContact=l.contact,p=((phase/TAU+l.phaseOffset)%1+1)%1,rest=worldAt(l.rest,x,z,yaw,scale,new T.Vector3());
      if(reset){l.anchor.copy(rest);l.tip.copy(rest);l.contact=true;l.footYaw=yaw+l.side*.21;}
      const walking=motion>.025&&rate>.04;
      const swing=walking&&p>=.60&&air<.08;
      if(air>=.08){
        l.contact=false;l.footYaw=yaw+l.side*.21;l.tip.copy(rest);l.tip.z-=Math.cos(yaw)*scale*1.9*air;l.tip.x-=Math.sin(yaw)*scale*1.9*air;
        l.tip.y=mix(ground(rest.x,rest.z),base.position.y+scale*(-.8+.18*Math.sin(time*2+l.fore)),air);
      }else if(swing){
        if(l.contact||reset){
          l.from.copy(l.anchor);l.fromYaw=l.footYaw;
        }
        // A reversal can happen during swing. Predict from the current velocity until touchdown.
        const horizon=clamp((1-p+.25)*TAU/Math.max(rate,2.4),0,.80);
        worldAt(l.rest,x+vx*horizon,z+vz*horizon,yaw+yawRate*horizon,scale,l.to);
        const t=(p-.60)/.40,blend=smooth(0,1,t);l.tip.lerpVectors(l.from,l.to,blend);
        l.footYaw=l.fromYaw+shortestAngle(yaw+yawRate*horizon+l.side*.21-l.fromYaw)*blend;
        l.tip.y=ground(l.tip.x,l.tip.z)+Math.sin(Math.PI*t)*scale*.87*Math.max(.35,motion);
        l.contact=false;
      }else if(!walking&&!l.contact&&l.tip.y-ground(l.tip.x,l.tip.z)>.02){
        l.tip.y=Math.max(ground(l.tip.x,l.tip.z),l.tip.y-dt*scale*1.15);
      }else{
        if(!l.contact)l.anchor.copy(l.tip);
        l.anchor.y=ground(l.anchor.x,l.anchor.z);l.tip.copy(l.anchor);l.contact=true;
      }
      if(!l.contact||!wasContact||reset){
        const dx=(ground(l.tip.x+.40,l.tip.z)-ground(l.tip.x-.40,l.tip.z))/.8;
        const dz=(ground(l.tip.x,l.tip.z+.40)-ground(l.tip.x,l.tip.z-.40))/.8;
        const normal=new T.Vector3(-dx,1,-dz).normalize();
        l.soleRotation.setFromUnitVectors(up,normal).multiply(new T.Quaternion().setFromAxisAngle(up,l.footYaw));
        if(swing){
          const ankleRoll=.28*Math.sin(TAU*(p-.60)/.40)*motion;
          l.soleRotation.multiply(new T.Quaternion().setFromAxisAngle(axle,ankleRoll));
        }
        l.supportOffset=0;
        const baseHeight=ground(l.tip.x,l.tip.z);
        if(l.tip.y-baseHeight<.32){
          const delta=new T.Vector3();
          for(const v of contactPoints){
            delta.copy(v).multiplyScalar(scale).applyQuaternion(l.soleRotation);
            l.supportOffset=Math.max(l.supportOffset,ground(l.tip.x+delta.x,l.tip.z+delta.z)-baseHeight-delta.y);
          }
        }
      }
      l.foot.position.copy(rig.worldToLocal(l.tip.clone()));
      l.foot.position.y+=l.supportOffset/scale;
      l.foot.quaternion.setFromAxisAngle(up,-yaw).multiply(l.soleRotation);
      const slope=up.clone().applyQuaternion(l.foot.quaternion);
      const A=l.hip.clone().applyMatrix4(body.matrix),C=l.foot.position.clone().addScaledVector(slope,ankleHeight);
      const axis=new T.Vector3().subVectors(C,A),distance=axis.length();axis.normalize();
      const L1=3.04,L2=Math.max(3.29,distance-L1+.026);
      const along=clamp((distance*distance+L1*L1-L2*L2)/(2*Math.max(distance,.01)),-L1,L1);
      const bend=new T.Vector3(l.side*.86,0,-.95);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
      const B=A.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,L1*L1-along*along)));
      pin(l.upper,A,B);pin(l.lower,B,C);l.knee.position.copy(B);l.ankle.position.copy(C);l.ankle.quaternion.copy(l.foot.quaternion);
      const normal=new T.Vector3().subVectors(B,A).cross(new T.Vector3().subVectors(C,B)).normalize();
      l.knee.quaternion.setFromUnitVectors(axle,normal);
    }
    last={time,phase,x,z,yaw,air};
  }
  function diagnostics(){
    rig.updateWorldMatrix(true,true);
    return legs.map(l=>{
      const a=l.upper.getWorldPosition(new T.Vector3()),b=l.knee.getWorldPosition(new T.Vector3()),c=l.foot.getWorldPosition(new T.Vector3());
      const ankle=l.ankle.getWorldPosition(new T.Vector3());
      const ends=soleEnds.map(([x,,z])=>l.foot.localToWorld(new T.Vector3(x,0,z)));
      const support=contactPoints.map(v=>l.foot.localToWorld(v.clone()));
      const gap=Math.max(a.distanceTo(l.mount.getWorldPosition(new T.Vector3())),l.upper.localToWorld(new T.Vector3(0,1,0)).distanceTo(b),
        l.lower.localToWorld(new T.Vector3(0,1,0)).distanceTo(ankle),l.foot.localToWorld(new T.Vector3(0,ankleHeight,0)).distanceTo(ankle));
      return {id:l.id,contact:l.contact,hip:a.toArray(),knee:b.toArray(),ankle:ankle.toArray(),foot:c.toArray(),toes:ends.map(p=>p.toArray()),
        pivotGap:gap,soleGap:c.y-sampleGround(c.x,c.z),minToeGap:Math.min(...ends.map(p=>p.y-sampleGround(p.x,p.z))),
        supportGap:Math.min(...support.map(p=>p.y-sampleGround(p.x,p.z)))};
    });
  }
  function obstructs(localX,localY,localZ){
    if(Math.abs(localX)>8||Math.abs(localZ)>7)return false;
    const p=new T.Vector3(localX,localY,localZ),closest=new T.Vector3();
    for(const l of legs){
      for(const h of [.15,.58]){
        p.y=localY+h;
        if(new T.Line3(l.upper.position,l.knee.position).closestPointToPoint(p,true,closest).distanceTo(p)<.36||
           new T.Line3(l.knee.position,l.ankle.position).closestPointToPoint(p,true,closest).distanceTo(p)<.29||
           l.foot.position.distanceTo(p)<.39)return true;
      }
    }
    return false;
  }
  return {update,diagnostics,obstructs};
}
