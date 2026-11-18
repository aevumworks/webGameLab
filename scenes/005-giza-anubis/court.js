import {giza} from "./parameters.js";
import {batch,box,mesh,oval,poly,rod,line,seeded,vec,tau} from "./geometry.js";
import {toCourt} from "./plateau.js";
const T=globalThis.THREE;
const statue=[3.12,-1.05], shrine=[-5.1,-3.2], shrineYaw=.18;
const daisWidth=giza.design.guardianScale*.272, daisDepth=giza.design.guardianScale*.26, daisRise=1.52;
const pavingY=.20;
function wingedSun(parent,m,x,y,z,span){
  const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(span);parent.add(g);
  oval(g,m.bright,0,0,.020,.103,.103,.023);
  oval(g,m.coral,0,0,.041,.071,.071,.013);
  for(const s of [-1,1])for(let i=0;i<12;i++){
    const u=i/12, edge=(i+1)/12;
    const feather=[
      [s*(.077+.34*u),.014+.044*u,.025],[s*(.077+.34*edge),.014+.044*edge,.025],
      [s*(.14+.39*edge),.005-.125*Math.sin(Math.PI*edge)+.065*edge,.029],
      [s*(.14+.39*u),.005-.125*Math.sin(Math.PI*u)+.065*u,.029]];
    poly(g,i%3===0?m.teal:i%3===1?m.gold:m.blue,feather,[0,1,2,0,2,3,0,2,1,0,3,2]);
  }
}
function lotus(parent,m,x,y,z,s){
  const a=new T.Group();parent.add(a);a.position.set(x,y,z);a.scale.setScalar(s);
  for(let k=-2;k<=2;k++){
    const end=[k*.082,.23-.018*Math.abs(k),.012];
    const p=[[0,-.022,.011],[k*.045-.033,.070,.012],end,[k*.045+.033,.070,.012]];
    poly(a,Math.abs(k)===1?m.teal:m.blue,p,[0,1,2,0,2,3,2,1,0,3,2,0]);
    line(a,m.aged,[p[0],p[1],p[2],p[3]],.004,false);
  }
}
function stoneDais(parent,m){
  const group=new T.Group();parent.add(group);
  group.position.set(statue[0],pavingY*(1-daisRise),statue[1]);
  group.scale.set(daisWidth,daisRise,daisDepth);
  for(const [y,w,h,d,mat] of [[.26,4.35,.16,3.55,m.paving],[.38,3.99,.16,3.20,m.basalt],[.52,3.69,.14,2.91,m.gold],
    [.77,3.5,.46,2.74,m.basalt],[1.019,3.76,.095,2.96,m.aged],[1.109,3.94,.10,3.04,m.basalt]]){
    box(group,mat,0,y,0,w,h,d);
  }
  wingedSun(group,m,0,.77,1.38,1.70);
  for(const s of [-1,1])for(const i of [-1,0,1]){
    box(group,m.aged,1.76*s,.75,i*.73,.015,.23,.53);
    box(group,m.basalt,1.77*s,.75,i*.73,.018,.18,.47);
  }
}
function pave(group,m,rng){
  box(group,m.sand,0,.007,0,22,.21,26);
  for(let j=0;j<17;j++){
    const depth=26/17,z=-13+(j+.5)*depth;
    let edge=-11;
    while(edge<10.995){
      let width=Math.min(1.35+1.86*rng(),11-edge);
      if(11-edge-width<.8)width=11-edge;
      const x=edge+width/2;edge+=width;
      const w=width/2-.014,d=depth/2-.014,y=.19+.013*rng();
      const pts=[[-w+.044,-d],[w-.03-rng()*.11,-d],[w,-d+.03+rng()*.10],[w,d-.025-rng()*.11],
        [w-.035,d],[-w+.045+rng()*.075,d],[-w,d-.035],[-w,-d+.038+rng()*.095]];
      const vertices=[...pts.map(([u,v])=>[x+u,.07,z+v]),...pts.map(([u,v])=>[x+u*.995,y,z+v*.995])],idx=[];
      for(let i=0;i<8;i++){const k=(i+1)%8;idx.push(i,i+8,k,k,i+8,k+8);}
      for(let i=1;i<7;i++)idx.push(8,8+i+1,8+i);
      poly(group,rng()<.055?m.limestone:m.paving,vertices,idx);
      if(rng()<.20){
        const run=(.27+.40*rng())*width,s=rng()>.5?1:-1,v=rng()*.7-.35;
        const crack=[[x-s*w,y+.001,z+v],[x-s*w+s*run*.3,y+.002,z+v+.08],
          [x-s*w+s*run*.54,y+.002,z+v-.035],[x-s*w+s*run,y+.002,z+v+.09]];
        for(let i=1;i<crack.length;i++){
          const a=crack[i-1],b=crack[i],q=.006*(1-i*.17);
          poly(group,m.recess,[[a[0],a[1],a[2]-q],[a[0],a[1],a[2]+q],[b[0],b[1],b[2]+q/2],[b[0],b[1],b[2]-q/2]],[0,1,2,0,2,3,2,1,0,3,2,0]);
        }
      }
    }
  }
}
function papyrusColumn(g,m,x,z,h,complete){
  const drum=(profile,mat)=>mesh(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40),mat,x,0,z);
  drum([[.84,.18],[.85,.28],[.78,.34],[.67,.39],[.62,.48]],m.light);
  const segments=complete?5:3;
  for(let i=0;i<segments;i++){
    const y=.47+i*(h-.5)/5,top=y+(h-.5)/5-.011,r=.56-i*.023;
    drum([[r-.02,y],[r,y+.028],[r-.01,top-.04],[r-.026,top]],m.limestone);
    for(let k=0;k<12;k++){
      const a=k*tau/12,rib=.089-i*.006;
      rod(g,m.limestone,[x+Math.sin(a)*(r-.047),y+.024,z+Math.cos(a)*(r-.047)],
        [x+Math.sin(a)*(r-.069),top-.01,z+Math.cos(a)*(r-.069)],rib,rib*.91,10);
    }
  }
  if(complete){
    drum([[.48,h-.05],[.55,h],[.54,h+.14],[.43,h+.18],[.49,h+.27],[.68,h+.46],[.78,h+.70],[.77,h+.81]],m.light);
    for(let j=0;j<16;j++){
      const a=j*tau/16;
      const point=(r,dy,offset)=>[x+Math.sin(a+offset)*r,h+dy,z+Math.cos(a+offset)*r];
      const leaf=[point(.477,.249,0),point(.692,.479,-.093),point(.782,.72,0),point(.692,.479,.093)];
      poly(g,j%2?m.aged:m.blue,leaf,[0,1,2,0,2,3,2,1,0,3,2,0]);
    }
    for(let k=0;k<4;k++)drum([[.548,h+.015+k*.032],[.548,h+.034+k*.032]],k===1?m.blue:m.aged);
    drum([[.775,h+.73],[.786,h+.765]],m.aged);box(g,m.limestone,x,h+.88,z,1.39,.19,1.39);
  }else {
    const y=.47+segments*(h-.5)/5;
    box(g,m.limestone,x-.13,y+.065,z+.02,.64,.13,.54).rotation.y=.26;
  }
}
function createNaos(root,m,animal){
  const g=new T.Group();root.add(g);g.position.set(shrine[0],.20,shrine[1]);g.rotation.y=shrineYaw;
  const structure=new T.Group();g.add(structure);
  box(structure,m.basalt,0,.13,0,3.47,.26,2.29);
  box(structure,m.aged,0,.297,0,3.25,.075,2.17);
  box(structure,m.red,0,1.59,-.82,2.85,2.72,.38);
  for(const s of [-1,1]){
    box(structure,m.basalt,s*1.43,1.57,0,.34,2.60,1.95);
    box(structure,m.aged,s*1.48,1.60,.96,.13,2.80,.10);
    box(structure,m.blue,s*1.35,1.59,.984,.085,2.58,.10);
    for(let j=0;j<14;j++)box(structure,j%3===0?m.teal:m.gold,s*1.35,.36+j*.185,1.044,.071,.048,.016);
  }
  for(const [y,w,d,h,mat] of [[2.90,3.17,2.09,.12,m.gold],[3.02,3.35,2.18,.15,m.blue],[3.14,3.58,2.35,.14,m.aged],[3.225,3.70,2.43,.060,m.bright]]){
    box(structure,mat,0,y,0,w,h,d);
  }
  wingedSun(structure,m,0,3.009,1.106,1.03);
  box(structure,m.basalt,0,.555,.08,1.84,.52,1.16);box(structure,m.bright,0,.839,.08,1.94,.054,1.20);
  batch(structure);
  animal.rotation.y=-.99;animal.scale.setScalar(1.18);
  animal.position.set(.02,.878,.11);g.add(animal);
  const leaves=[];
  for(const s of [-1,1]){
    const hinge=new T.Group();g.add(hinge);hinge.position.set(s*1.234,.34,1.044);
    let u=-s*.613;
    box(hinge,m.wood,u,1.23,0,1.223,2.45,.090);
    for(const y of [.17,1.19,2.26]){
      box(hinge,m.aged,u,y,-.069,1.16,.088,.046);
      for(const dx of [-.47,.47])oval(hinge,m.bright,u+dx,y,-.092,.016,.016,.007);
    }
    for(const dx of [-.46,0,.46])box(hinge,m.aged,u+dx,1.21,-.053,.013,2.20,.013);
    for(const yy of [.10,1.21,2.33])box(hinge,m.aged,u,yy,.056,1.22,.10,.045);
    for(const k of [-1,1])box(hinge,m.gold,u+k*.551,1.24,.058,.045,2.36,.021);
    for(const yy of [.64,1.80]){
      box(hinge,m.aged,u,yy,.062,.96,.93,.018);box(hinge,m.blue,u,yy,.077,.88,.85,.016);
      lotus(hinge,m,u,yy-.11,.091,1.63);
      for(const dx of [-1,1])for(const dy of [-1,1])oval(hinge,m.gold,u+dx*.393,yy+dy*.372,.092,.019,.019,.012);
    }
    oval(hinge,m.bright,-s*1.09,1.14,.103,.048,.053,.043);batch(hinge);leaves.push(hinge);
  }
  const lamp=new T.PointLight(0xffd79c,15,6,2);lamp.position.set(0,2.44,.60);g.add(lamp);
  let target=0,amount=.012;
  function update(dt){
    amount=T.MathUtils.damp(amount,target,4.0,dt);
    const a=.055+1.67*amount;
    leaves[0].rotation.y=-a;leaves[1].rotation.y=a;
    return Math.abs(target-amount)>.001;
  }
  update(0);
  return {leaves,update,toggle(){target=target?0:1;return target===1;}};
}
function flames(root,m){
  const bowls=new T.Group();root.add(bowls);const tongues=[];
  for(const [x,z] of [[-2.83,-2.38],[7.82,2.27],[-7.39,-2.98]]){
    const profile=[[.28,.20],[.3,.25],[.20,.29],[.14,.39],[.105,.65],[.13,.85],[.12,1.03],[.33,1.15],[.39,1.25],[.37,1.31],[.32,1.29],[.23,1.21]];
    mesh(bowls,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32),m.aged,x,0,z);
    for(const y of [.36,.71,1.036]){const ring=mesh(bowls,new T.TorusGeometry(y>.99?.131:.140,.013,7,32),m.gold,x,y,z);ring.rotation.x=Math.PI/2;}
    const o=oval(root,m.lamp,x,1.30,z,.073,.18,.065);tongues.push(o);
  }
  batch(bowls);return t=>tongues.forEach((o,i)=>{const q=Math.sin(t*4.1+i)+.45*Math.sin(t*8.8+i*.7);o.scale.set(.072-q*.009,.17+q*.029,.071);o.rotation.z=.14*Math.sin(t*3.2+i);});
}
export function buildCourt(scene,m,[hero,animal]){
  const root=new T.Group(),c=giza.design;root.position.set(c.exhibitX,0,c.exhibitZ);root.rotation.y=c.exhibitYaw;scene.add(root);
  const stone=new T.Group();root.add(stone);const rng=seeded(332);
  pave(stone,m,rng);
  const columns=[[-8.75,-.60,3.56,true],[9.15,-6.85,3.24,true],[-8.80,-8.45,3.8,false],[9.16,4.65,3.43,false]];
  for(const [x,z,h,complete] of columns)papyrusColumn(stone,m,x,z,h,complete);
  // Broken limestone enclosure: low enough to leave the north face and its silhouette visible.
  for(const s of [-1,1]){
    for(let j=0;j<7;j++){
      const z=-10+j*3.4;
      box(stone,m.limestone,s*10.72,.40,z,.72,.48,3.26);
      if(j!==3 && j!==6)box(stone,m.light,s*10.74,.72,z,.65,.22,3.16);
    }
    for(const z of [-10.5,8.7]){
      box(stone,m.paving,s*10.38,.41,z,1.46,.42,1.43);
      const h=z<0?1.11:1.64;
      box(stone,m.red,s*10.38,.55+h/2,z,.96,h,1.02);
      box(stone,m.paving,s*10.38,.62+h,z,1.13,.15,1.16);
    }
  }
  stoneDais(stone,m);batch(stone);
  hero.name="Standing Anubis";hero.scale.setScalar(c.guardianScale/6.2);
  hero.rotation.y=-.37;hero.position.set(statue[0],pavingY+(1.161-pavingY)*daisRise,statue[1]);root.add(hero);
  const naos=createNaos(root,m,animal),fire=flames(root,m);
  root.updateWorldMatrix(true,true);
  const target=naos.leaves[0].parent.localToWorld(vec(0,1.42,1.04));
  function canStand(x,z){
    const [u,v]=toCourt(x,z);
    if(Math.abs(u-statue[0])<2.175*daisWidth+.22&&Math.abs(v-statue[1])<1.775*daisDepth+.22)return false;
    const sx=u-shrine[0],sz=v-shrine[1],a=Math.cos(shrineYaw),b=Math.sin(shrineYaw);
    if(Math.abs(sx*a-sz*b)<1.96&&Math.abs(sx*b+sz*a)<1.43)return false;
    if(Math.abs(Math.abs(u)-10.72)<.64&&v>-12&&v<12.25)return false;
    if(columns.some(([x,z])=>(u-x)**2+(v-z)**2<.85**2))return false;
    return true;
  }
  return {root,target,canStand,toggle:naos.toggle,
    paving(x,z){const [u,v]=toCourt(x,z);return Math.abs(u)<11.08&&Math.abs(v)<13.06;},
    update(dt,t){fire(t);return naos.update(dt);}
  };
}
