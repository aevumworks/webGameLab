import {T, TAU, Kit, Surface, group, clamp, mix} from "./atelier.js";

const crankTeeth = 14, idlerTeeth = 8, outputTeeth = 18;
const reduction = crankTeeth / outputTeeth;
const ink = 0x233240, enamel = 0x496b80, brass = 0xddb16a, ivory = 0xe4d7b5;
const iron = 0x758696, red = 0xbc7860;

// A steam governor keeps the crank turning in neutral. The clutch connects the
// reduction shaft to the legs, so a parked castle can keep its boiler alight.
export function steamPlant() {
  const engine = {pressure:.96, heat:0, admission:.16, shaft:1.06, rpm:16, clutch:0, rate:0, speed:0};
  engine.advance = (dt, throttle, steering, fast, flying, boost) => {
    const demand = Math.max(Math.abs(throttle), Math.abs(steering) * .72, flying ? .32 : 0);
    engine.heat = Math.max(0, engine.heat - dt * .13);
    const firing = Math.max(engine.heat, boost);
    const pressureTarget = .96 + .23 * firing - .12 * demand;
    engine.pressure = mix(engine.pressure, pressureTarget, 1 - Math.exp(-dt * 1.4));
    engine.admission = mix(engine.admission, .16 + demand * .84, 1 - Math.exp(-dt * 4));
    const pace = flying ? (fast ? 40 : 24) : (fast ? 17.5 : 10.2);
    const outputTarget = Math.max(flying ? 2.8 : 1.30, Math.abs(throttle) * (pace + firing * 3.7) * .68, Math.abs(steering) * 5.6);
    engine.rate = mix(engine.rate, outputTarget * Math.sqrt(engine.pressure / .86), 1 - Math.exp(-dt * 2.9));
    const crankRate = engine.rate / reduction;
    engine.shaft += crankRate * dt;
    engine.rpm = crankRate * 60 / TAU;
    const gear = throttle < 0 ? -.64 : throttle > 0 ? 1 : 0;
    engine.clutch = mix(engine.clutch, gear, 1 - Math.exp(-dt * (gear ? 5.8 : 8)));
    engine.speed = engine.rate * engine.clutch / .68;
  };
  engine.rate = 1.30;
  return engine;
}

function wheel(teeth, face, spokeColor) {
  const s = new Surface(), pitch = teeth * .10, inner = pitch * .72, half = .13;
  const pt = (r,a,z) => [r*Math.cos(a),r*Math.sin(a),z];
  const profile = [[-.50,-.105],[-.32,-.105],[-.17,.10],[.17,.10],[.32,-.105],[.50,-.105]];
  for (let i=0;i<teeth;i++) {
    for (let j=0;j<profile.length-1;j++) {
      const [u,du]=profile[j], [v,dv]=profile[j+1], a=TAU*(i+u)/teeth, b=TAU*(i+v)/teeth;
      const ra=pitch+du, rb=pitch+dv;
      s.quad(pt(ra,a,half),pt(rb,b,half),pt(inner,b,half),pt(inner,a,half),face);
      s.quad(pt(inner,a,-half),pt(inner,b,-half),pt(rb,b,-half),pt(ra,a,-half),spokeColor);
      s.quad(pt(ra,a,-half),pt(rb,b,-half),pt(rb,b,half),pt(ra,a,half),spokeColor);
      s.quad(pt(inner,b,-half),pt(inner,a,-half),pt(inner,a,half),pt(inner,b,half),ink);
    }
  }
  const k = new Kit(), spokes = teeth===idlerTeeth ? 4 : 5;
  k.surface(s,"paint");
  for(let i=0;i<spokes;i++){
    const a=i*TAU/spokes, r=inner*.54;
    k.box(Math.cos(a)*r,Math.sin(a)*r,0,inner*.98,pitch*.17,.18,spokeColor,"paint",[0,0,a]);
  }
  k.post(0,0,0,pitch*.26,.41,spokeColor,"paint",[Math.PI/2,0,0]);
  k.post(0,0,.23,pitch*.16,.12,ivory,"brass",[Math.PI/2,0,0]);
  return k.finish();
}

function meshAngle(sourceAngle, a, b, sourceCount, drivenCount) {
  const direction=Math.atan2(b[1]-a[1],b[0]-a[0]);
  return direction+Math.PI+(direction-sourceAngle)*sourceCount/drivenCount-Math.PI/drivenCount;
}

export function fitTransmission(body) {
  const frame=group(body,5.04,7.27,3.92);
  frame.rotation.y=.96;
  const output=[-1.62,-.30], intermediate=[.48, -.30+Math.sqrt(2.6**2-2.10**2)];
  const crank=[intermediate[0]+Math.sqrt(2.2**2-.46**2),intermediate[1]-.46];
  const k=new Kit(), axleZ=.76;
  // The three bearings share a gusseted bed attached to the boiler.
  for(const [x,y] of [output,intermediate,crank]){
    k.line([x,y,-1.18],[x,y,.60],.35,ink,"iron","rod");
    k.post(x,y,.44,.43,.21,enamel,"paint",[Math.PI/2,0,0]);
  }
  for(const [a,b] of [[output,intermediate],[intermediate,crank],[output,crank]]){
    k.line([...a,.23],[...b,.23],.22,ink,"iron","box");
  }
  const cylinderY=crank[1]+3.29, guideZ=1.10;
  k.line([crank[0],cylinderY,-.81],[crank[0],cylinderY,guideZ],.32,ink,"iron","rod");
  k.post(crank[0],cylinderY,guideZ,.47,1.16,enamel,"paint");
  for(const sign of [-1,1]) {
    k.post(crank[0],cylinderY+sign*.52,guideZ,.54,.18,brass,"brass");
    k.line([crank[0]+sign*.36,crank[1]+1.08,guideZ],[crank[0]+sign*.36,cylinderY-.50,guideZ],.066,iron,"iron");
  }
  // A live-steam elbow from the upper drum and a short outward exhaust horn.
  const feed=[[crank[0]-.90,cylinderY+.91,-1.74],[crank[0]-.90,cylinderY+.91,.52],[crank[0]-.90,cylinderY+.24,guideZ],[crank[0]-.33,cylinderY+.24,guideZ]];
  for(let i=1;i<feed.length;i++)k.line(feed[i-1],feed[i],.17,brass,"brass","rod");
  k.line([crank[0]+.30,cylinderY-.26,guideZ],[crank[0]+.70,cylinderY-.26,guideZ],.15,iron);
  const vent=[crank[0]+1.02,cylinderY-.04,guideZ+.12];
  k.line([crank[0]+.68,cylinderY-.26,guideZ],vent,.19,brass,"brass","rod");
  // The output bearing descends into the right fore hip. Its cross-shaft drives
  // the matching left eccentric through the belly.
  const hipLocal=frame.worldToLocal(body.localToWorld(new T.Vector3(4.42,5.04,3.04)));
  const hip=[hipLocal.x,hipLocal.y,.23];
  k.line([...output,.18],hip,.26,enamel,"iron","box");
  k.line([hip[0],hip[1],axleZ+.32],hipLocal.toArray(),.28,iron,"iron","rod");
  k.finish(frame);
  const wheels=[[crank,crankTeeth,brass,0xb48a62],[intermediate,idlerTeeth,ivory,iron],[output,outputTeeth,0xd0a377,enamel]].map(([c,n,face,rim])=>{
    const w=wheel(n,face,rim);frame.add(w);w.position.set(...c,axleZ);return w;
  });

  const moving=new Kit();
  moving.box(0,.29,0,.25,.83,.15,red,"paint");
  moving.post(0,.59,.105,.126,.17,ivory,"brass",[Math.PI/2,0,0]);
  const throwArm=moving.finish();wheels[0].add(throwArm);throwArm.position.z=guideZ-axleZ;
  const slider=group(frame,crank[0],0,guideZ),cage=new Kit();
  cage.box(0,0,0,.65,.28,.27,enamel,"paint");cage.post(0,.47,0,.112,.98,ivory,"brass");cage.finish(slider);
  const thrustRod=new Kit();thrustRod.box(0,.5,0,.155,1,.105,ivory,"brass");
  const link=thrustRod.finish();frame.add(link);
  const rockerKit=new Kit();rockerKit.box(0,.27,0,.21,.73,.14,red,"paint");
  rockerKit.post(0,.54,.08,.13,.15,ivory,"brass",[Math.PI/2,0,0]);
  const hipArm=rockerKit.finish();frame.add(hipArm);hipArm.position.set(hip[0],hip[1],axleZ+.19);
  const rodKit=new Kit();rodKit.box(0,.5,0,.13,1,.12,brass,"brass");
  const reach=rodKit.finish();frame.add(reach);
  const clutch=group(frame,output[0],output[1],axleZ+.24),pin=new Kit();
  pin.post(0,0,0,.42,.18,ink,"iron",[Math.PI/2,0,0]);
  pin.box(0,.25,.052,.23,.72,.13,red,"paint");
  pin.post(0,.54,.15,.15,.16,ivory,"brass",[Math.PI/2,0,0]);pin.finish(clutch);
  function rodBetween(rod,x1,y1,x2,y2,z){
    rod.position.set(x1,y1,z);rod.rotation.z=Math.atan2(x1-x2,y2-y1);rod.scale.y=Math.hypot(x2-x1,y2-y1);
  }
  const puffPort=new T.Object3D();puffPort.position.fromArray(vent);frame.add(puffPort);
  function update(angle,gait){
    const midAngle=meshAngle(angle,crank,intermediate,crankTeeth,idlerTeeth);
    const outAngle=meshAngle(midAngle,intermediate,output,idlerTeeth,outputTeeth);
    wheels[0].rotation.z=angle;wheels[1].rotation.z=midAngle;wheels[2].rotation.z=outAngle;
    const dx=-.59*Math.sin(angle),pinY=crank[1]+.59*Math.cos(angle);
    slider.position.y=pinY+Math.sqrt(1.67**2-dx**2);
    rodBetween(link,crank[0]+dx,pinY,crank[0],slider.position.y,guideZ+.075);
    clutch.rotation.z=hipArm.rotation.z=gait;
    const reachX=-.54*Math.sin(gait),reachY=.54*Math.cos(gait);
    rodBetween(reach,output[0]+reachX,output[1]+reachY,hip[0]+reachX,hip[1]+reachY,axleZ+.26);
  }
  return {update,puffPort};
}
