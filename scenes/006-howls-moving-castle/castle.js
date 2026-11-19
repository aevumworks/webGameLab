import {T,TAU,Kit,Surface,lathe,random,pick,tint,group,clamp,mix} from "./atelier.js";
import {house,rail} from "./buildings.js";
import {boarding} from "./boarding.js";
import {undercarriage} from "./undercarriage.js";
import {engineDetails} from "./engine-details.js";
import {fitTransmission} from "./drive-train.js";
import {pilotLift} from "./pilot-lift.js";

const iron=0x293848, seam=0x202c38, brass=0xd8ae71, rim=0xa4ada8;
const rust=[0xbc927b,0xc0977f,0xb98e7a,0xbf947c];
const blue=[0x607b8d,0x607b8d,0x657f90];
const red=[0xac6957,0xb1715c,0xac6957];

function boiler(k,p,radii,palette,seed,rings=7,columns=17,openings=[]){
  const r=random(seed),[cx,cy,cz]=p,[rx,ry,rz]=radii;
  const rows=Math.max(4,Math.round(rings*.76)),cols=Math.max(10,Math.round(columns*.78));
  if(openings.length)k.ball(cx,cy,cz,rx*.82,ry*.82,rz*.82,seam,"iron");
  const sheet=new Surface();
  function skin(a,lat){
    return new T.Vector3(cx+rx*Math.sin(a)*Math.cos(lat),cy+ry*Math.sin(lat),cz+rz*Math.cos(a)*Math.cos(lat));
  }
  for(let row=0;row<rows;row++)for(let i=0;i<cols;i++){
    const low=-Math.PI/2+Math.PI*row/rows,high=low+Math.PI/rows;
    const a=TAU*(i+.5)/cols,b=a+TAU/cols;
    const A=skin(a,low),B=skin(b,low),C=skin(b,high),D=skin(a,high),color=pick(r,palette);
    const at=(u,v)=>A.clone().lerp(B,u).lerp(D.clone().lerp(C,u),v);
    const center=at(.5,.5),reach=Math.max(center.distanceTo(A),center.distanceTo(C));
    const ports=openings.filter(o=>center.distanceTo(o.point)<o.radius+reach);
    const n=ports.length?5:1;
    for(let h=0;h<n;h++)for(let j=0;j<n;j++){
      const mid=at((j+.5)/n,(h+.5)/n);
      if(ports.some(o=>mid.distanceToSquared(o.point)<o.radius**2*.89))continue;
      sheet.quad(at(j/n,h/n).toArray(),at((j+1)/n,h/n).toArray(),at((j+1)/n,(h+1)/n).toArray(),at(j/n,(h+1)/n).toArray(),color);
    }
    // A bounded enamel print follows the cap surface and leaves the sight ports clear.
    if(seed===52&&row===rows-2&&(i<3||i===cols-1)){
      const painted=(u,v)=>{
        const p=at(u,v),normal=new T.Vector3((p.x-cx)/(rx*rx),(p.y-cy)/(ry*ry),(p.z-cz)/(rz*rz)).normalize();
        return p.addScaledVector(normal,.016).toArray();
      };
      for(let h=0;h<3;h++)for(let j=0;j<3;j++){
        const column=((i+1)%cols)*3+j;
        if(column<2+h||column>9+h||(column+h)%2)continue;
        if(ports.some(o=>at((j+.5)/3,(h+.5)/3).distanceTo(o.point)<o.radius*1.23))continue;
        sheet.quad(painted(j/3,h/3),painted((j+1)/3,h/3),painted((j+1)/3,(h+1)/3),painted(j/3,(h+1)/3),column>7?0xca9e84:0xdebf7e);
      }
    }
  }
  k.surface(sheet,"iron");
}
function girdle(k,x,y,z,rx,rz,height,palette,seed,wear=.15){
  const r=random(seed),skin=new Surface(),n=16;
  for(let i=0;i<n;i++){
    const a=TAU*i/n+.003,b=TAU*(i+1)/n-.003,low=y-height/2-r()*wear,c=pick(r,palette);
    const v=(t,yy)=>[x+Math.sin(t)*rx,yy,z+Math.cos(t)*rz];
    for(let j=0;j<3;j++){
      const u=mix(a,b,j/3),w=mix(a,b,(j+1)/3);
      skin.quad(v(u,low),v(w,low),v(w,y+height*.5),v(u,y+height*.5),c);
    }
    for(const t of [a+.035,b-.035]){const p=v(t,y+height*.31);k.put("pebble",p,[.055,.054,.055],iron,"iron");}
  }
  k.surface(skin,"iron");
}
const lip=lathe("cast inspection collar",[[1.13,-.28],[1.14,-.13],[1.01,-.06],[.99,.23],[1.07,.27],[1.06,.38],[.79,.38],[.735,.30],[.735,-.25]],32);
function vent(k,x,y,z,r,yaw=0,pitch=-.15,c=rim){
  k.at([x,y,z],[pitch,yaw,0],null,()=>{
    k.put(lip,[0,0,0],[r,r,r],c,"iron",[Math.PI/2,0,0]);
    k.put("disk",[0,0,-r*.235],[r*.75,r*.75,1],0x26373d,"glass");
    for(let i=0;i<4;i++){
      const a=TAU*i/4;k.put("pebble",[Math.sin(a)*r*.95,Math.cos(a)*r*.95,r*.39],[r*.066,r*.066,r*.043],0xb5a37b,"brass");
    }
  });
}
function turret(k,p,radii,palette,seed,holes){
  const [x,y,z]=p,[rx,ry,rz]=radii;
  const ports=holes.map(([a,lat,r])=>{
    const dir=new T.Vector3(Math.sin(a)*Math.cos(lat),Math.sin(lat),Math.cos(a)*Math.cos(lat));
    const point=new T.Vector3(x+dir.x*rx,y+dir.y*ry,z+dir.z*rz);
    const normal=new T.Vector3(dir.x/rx,dir.y/ry,dir.z/rz).normalize();
    return {point,normal,radius:r};
  });
  boiler(k,p,radii,palette,seed,8,22,ports);
  for(const o of ports)vent(k,...o.point.toArray(),o.radius,Math.atan2(o.normal.x,o.normal.z),-Math.asin(o.normal.y),rim);
}
function pipeRun(k,points,r,c=0x816d59){
  k.curve(points,r,c,"iron",22);
  for(let j=0;j<points.length-1;j++){
    const a=new T.Vector3(...points[j]),b=new T.Vector3(...points[j+1]);
    const u=a.clone().lerp(b,.42),v=a.clone().lerp(b,.51);
    k.line(u.toArray(),v.toArray(),r*1.19,rim,"iron","rod");
  }
}
const chimneyTop=lathe("trumpet-flue",[[.65,0],[.74,.11],[.80,.42],[1.04,.70],[1.09,.83],[1.03,.92],[.87,.91],[.79,.73],[.61,.42]],30);
function chimney(k,x,y,z,h,r,tilt,lean,sockets){
  const e=new T.Euler(tilt,0,lean,"YXZ");
  k.at([x,y,z],[tilt,0,lean],null,()=>{
    k.ball(0,.18,0,r*1.40,r*1.16,r*1.4,0x697581,"iron");
    k.put("pipe",[0,h*.49,0],[r*.73,h*.96,r*.73],0x465062,"iron");
    k.put("pipe",[0,h*.73,0],[r*.744,h*.21,r*.744],0xdcd5bc,"paint");
    for(let i=0;i<3;i++){
      const yy=h*(.08+i*.37);
      k.post(0,yy,0,r*(i===0?1.13:.92),i===0?.30:.17,i%2?rim:iron);
      k.post(0,yy+.11,0,r*.86,.055,0xb0916c,"brass");
    }
    k.put(chimneyTop,[0,h-.56*r,0],[r,r,r],0xd1aa80,"iron");
    k.post(0,h+.12*r,0,.79*r,.045,0x1f2c37);
    k.put("hoop",[0,h+.34*r,0],[r,r,r],0x514f46,"iron",[Math.PI/2,0,0]);
  });
  sockets.push(new T.Vector3(0,h+.45*r,0).applyEuler(e).add(new T.Vector3(x,y,z)));
}
function cabin(k,pos,ang,dims,color,roof,lean=0){
  k.at(pos,[0,ang,lean],null,()=>house(k,{w:dims[0],h:dims[1],d:dims[2],wall:color,tiles:roof,windows:dims[0]>2.7?3:2,detail:true,timber:true,door:false}));
}
function lanternTower(k,x,y,z,r,h){
  k.post(x,y+h/2,z,r,h,0xc5bba0,"paint");
  for(let j=0;j<8;j++){
    const ang=j*TAU/8;
    k.at([x+Math.sin(ang)*r,y+h*.57,z+Math.cos(ang)*r],[0,ang,0],null,()=>{
      k.box(0,0,0,r*.47,h*.38,.05,0x374e51,"glass");
      k.box(0,0,.02,.045,h*.39,.05,0xb1aa8d,"wood");
    });
  }
  k.put("cone",[x,y+h+r*.59,z],[r*1.18,r*1.38,r*1.18],0xa45e4c,"iron");
  k.post(x,y+h+r*1.42,z,.045,.39,brass,"brass");
}

function furnaceIntake(k){
  const skin=new Surface(),panels=18,ry=.92;
  function lip(a,rx,h,z){
    const x=rx*Math.cos(a),y=6.50+Math.sin(a)*h+.12*(x/rx)**2;
    return [x,y,z-.48*(x/rx)**2+.035*Math.sin(a*3)];
  }
  for(let j=0;j<panels;j++){
    const a=TAU*j/panels+.012,b=TAU*(j+1)/panels-.012;
    const color=red[(3*j+Math.floor(j/4))%red.length];
    const A=lip(a,3.28,ry,6.70),B=lip(b,3.28,ry,6.70),C=lip(b,2.75,.65,6.78),D=lip(a,2.75,.65,6.78);
    skin.quad(A,B,C,D,color);
    skin.quad(lip(a,3.42,1.11,6.11),lip(b,3.42,1.11,6.11),B,A,tint(color,.73));
    skin.quad(D,C,lip(b,2.44,.54,5.67),lip(a,2.44,.54,5.67),j<panels/2?0x344449:0x715b4d);
    skin.tri([0,6.49,5.31],lip(a,2.44,.54,5.67),lip(b,2.44,.54,5.67),0x303739);
    if(j%2===0){const p=lip((a+b)/2,3.02,.81,6.76);k.put("pebble",p,[.050,.055,.042],0x8e8069,"iron");}
  }
  k.surface(skin,"iron");
  for(let i=-4;i<=4;i++){
    const x=i*.53,curve=Math.sqrt(1-(x/2.75)**2);
    k.box(x,6.45+.30*curve,5.83-.21*(x/2.75)**2,.109,.42*curve,.18,0x575f58,"iron",[.19,0,x*.045]);
  }
}
function lowerHull(k){
  boiler(k,[0,6.72,-.1],[6.75,3.58,5.27],blue,41);
  const intakeCuts=[-2,-1,0,1,2].map(x=>({point:new T.Vector3(x,6.55,6.36-.09*x*x),radius:.91}));
  boiler(k,[-.3,7.42,1.22],[5.76,3.58,5.24],rust,93,7,17,intakeCuts);
  for(const s of [-1,1]){
    pipeRun(k,[[s*2.7,4.7,4.6],[s*4.9,5.18,4.4],[s*6.3,6.12,2.0],[s*6.0,7.35,-1.7],[s*5.28,8.04,-3.26]],.29);
    pipeRun(k,[[s*1.45,4.35,4.65],[s*3.8,4.70,4.38],[s*5.81,5.64,2.12]],.18,0x686e69);
    for(let i=0;i<6;i++) {
      const x=s*(1.0+i*.61),z=4.46+(1-i/7)*.89;
      k.line([x,4.48,z],[x+s*.58,6.01,z+.25],.12,0x58615c);
    }
  }
  furnaceIntake(k);
  for(const [y,z,len] of [[6.18,2.35,1.74],[7.08,2.16,1.31]]){
    const end=[-5.83-len,y+.18,z+.57];
    pipeRun(k,[[-5.34,y+.51,z-.41],[-5.91,y,z],[-6.30,y+.04,z+.21],end],.225,0x73756a);
    vent(k,...end,.29,-1.23,-.08,0x817c69);
  }
  boiler(k,[.20,8.15,5.10],[2.28,1.34,1.62],red,76,5,13);
  for(const s of [-1,1])vent(k,s*.82+.2,8.37,6.49,.30,s*.15,-.15,0x977c60);
  vent(k,-3.12,8.32,4.70,.62,-.33,-.14,brass);
  pipeRun(k,[[3.00,7.75,4.98],[3.42,7.92,5.65],[3.56,8.46,6.29]],.36,0x986c50);
  vent(k,3.57,8.51,6.31,.39,.18,-.35);
  for(const s of [-1,1]){
    boiler(k,[s*5.18,7.66,-1.85],[2.04,2.58,2.02],rust,s+22,5,10);
    vent(k,s*6.93,7.95,-1.72,.63,s*Math.PI/2,-.18);
  }
}
function decks(k){
  const balconies=[[-3.6,10.85,2.83,3.1,2.72,.12,2.55],[2.80,10.35,.20,3.66,3.10,.25,2.32],[-.30,14.16,-1.11,3.67,3.01,-2.4,1.3]];
  for(const [x,y,z,rx,rz,a,b] of balconies){
    const points=[];
    for(let i=0;i<=12;i++){
      const th=mix(a,b,i/12);const p=[x+rx*Math.sin(th),y,z+rz*Math.cos(th)];points.push(p);
      k.box(...p,.67,.12,.54,0x87745b,"wood",[0,th,0]);
      if(i%3===0)k.line([p[0]-.28*Math.sin(th),y-.51,p[2]-.28*Math.cos(th)],p,.065,iron);
    }
    rail(k,points,.50);
  }
  const cabins=[
    [[-3.55,9.16,3.94],-.22,[2.85,1.40,1.42],0xd0c5a8,0xb26950,-.045],
    [[2.58,10.78,3.93],.19,[3.04,1.38,1.36],0xdac9a4,0xa86348,.046],
    [[-5.72,8.04,-.26],-1.31,[2.06,1.44,1.54],0xc5ac86,0xb76e4f,.055],
    [[1.80,7.67,-4.32],2.92,[2.56,1.62,1.54],0xc7be9e,0x9f634b,-.085],
    [[-4.65,12.05,-1.00],-1.43,[2.10,1.52,1.62],0xccc3a6,0x93704c,.06],
    [[1.47,13.94,-2.20],2.75,[3.65,1.48,1.70],0xd5c8aa,0xa16850,-.052],
    [[-2.82,15.95,-1.99],-.30,[1.69,1.47,1.28],0xbcaf80,0x956b49,-.09]
  ];
  cabins.forEach(c=>cabin(k,...c));
  for(const s of [-1,1]){
    for(let i=0;i<5;i++)k.line([s*(2.7+i*.44),9.16,3.70],[s*(2.76+i*.44),8.52,3.20],.08,iron);
  }
  lanternTower(k,-.7,15.45,1.47,.62,1.06);lanternTower(k,4.55,12.70,-1.72,.57,1.48);
}
function mast(k){
  k.line([-.66,14.8,-.90],[.25,20.54,-1.24],.145,rim);
  k.line([-.08,18.60,-1.15],[2.48,18.80,-1.10],.089,brass);
  k.line([.18,19.18,-1.18],[-2.70,19.42,-1.06],.09,iron);
  for(const p of [[2.48,18.80,-1.10],[-2.70,19.42,-1.06]])
    k.curve([p,[p[0]*.80,16.87,-1.13],[p[0]*1.21,15.0,-1.65]],.022,seam);
  k.post(.25,20.16,-1.24,.71,1.03,0xb5a692,"paint");
  for(let i=0;i<8;i++) {
    const a=i*TAU/8;
    k.box(.25+.70*Math.sin(a),20.22,-1.24+.70*Math.cos(a),.29,.37,.05,0x384b4b,"glass",[0,a,0]);
  }
  k.post(.25,20.72,-1.24,.77,.12,rim);k.post(.25,20.96,-1.24,.047,.44,brass,"brass");
  k.line([.15,19.89,-1.2],[1.41,19.96,-1.18],.062,iron);
}
function fins(parent,side){
  const pivot=group(parent,side*5.76,6.15,-1.69);
  const k=new Kit(),s=new Surface();
  const spars=[[0,0,.7],[1.7,.6,.02],[2.5,1.65,-1.30],[2.73,2.85,-2.42],[2.78,4.12,-3.24]];
  for(let i=1;i<spars.length;i++){
    const t=spars[i],p=spars[i-1],tip=[side*t[0],t[1],t[2]],prev=[side*p[0],p[1],p[2]];
    const root=[0,.27*i,-.54*i],rprev=[0,.27*(i-1),-.54*(i-1)];
    const mid=[(prev[0]+tip[0])*.51,(prev[1]+tip[1])*.5-.31,(prev[2]+tip[2])*.50+.13];
    s.quad(rprev,prev,mid,root,i%2?0x946b50:0xaa8160);s.tri(root,mid,tip,i%2?0xa1775d:0x977859);
    k.line(root,tip,.053,0x675245);k.curve([prev,mid,tip],.045,0x6c5141);
  }
  k.surface(s,"cloth");k.finish(pivot);return pivot;
}
export function buildCastle(card){
  const root=new T.Group(),rig=group(root),body=group(rig),early=group(body),late=group(body);
  const k=new Kit();lowerHull(k);
  boiler(k,[-.70,11.30,-1.48],[5.23,4.35,4.92],rust,142,7,21);
  turret(k,[-3.31,12.16,2.98],[3.03,2.92,3.02],[0xa6b5bf,0xa8b7c0],32,[[-.43,.44,.48],[.23,.50,.47],[-1.17,.27,.36]]);
  turret(k,[2.83,13.19,1.55],[3.17,3.03,3.16],[0xe0ded1,0xe4e0d3],52,[[-.28,.50,.55],[.37,.47,.53],[1.31,.30,.38]]);
  const back=new Kit();
  turret(back,[-2.57,15.22,-2.43],[3.58,3.01,3.20],blue,82,[[-.64,.51,.45]]);
  girdle(back,-2.57,15.32,-2.43,3.59,3.21,.62,[0xa7a68a,0xb6b299,0x9f9f89],81);
  back.finish(early);
  decks(k);mast(k);engineDetails(k);
  const sockets=[];
  boiler(k,[3.47,12.86,-3.16],[2.08,1.83,2.39],blue,614,5,12);
  chimney(k,3.30,13.85,-1.99,6.32,.73,-.015,-.12,sockets);
  chimney(k,4.84,12.85,-3.58,6.32,.67,-.25,-.37,sockets);
  chimney(k,2.13,13.99,-4.16,5.35,.56,-.34,-.025,sockets);
  chimney(k,-3.88,14.86,-3.18,4.22,.51,-.04,.29,sockets);
  // Rear service pipes and the auxiliary shaft on the opposite flank.
  for(const s of [-1,1])pipeRun(k,[[s*4.21,11.45,-2.75],[s*5.30,10.32,-3.11],[s*5.07,8.72,-3.48],[s*3.32,7.49,-4.77]],.17);
  const wheel=group(body,-5.48,7.47,2.12);wheel.rotation.y=-1.10;const blades=group(wheel),wk=new Kit();
  wk.put("rim",[0,0,0],[1.07,1.07,1.07],rim,"iron");wk.put("rim",[0,0,0],[.50,.50,.50],brass,"brass");
  for(let i=0;i<9;i++)wk.box(0,0,0,.063,2.13,.09,iron,"iron",[0,0,i*Math.PI/9]);wk.finish(blades);
  k.finish(body);
  const garden=new Kit(),r=random(502);
  cabin(garden,[-1.62,14.54,-1.42],.08,[3.72,1.58,2.14],0xdad6b2,0xaa604d);
  for(let i=0;i<37;i++){
    const a=r()*TAU,rad=2.25+r()*1.58,sz=.23+r()*.55;
    garden.put("boulder",[-.66+Math.cos(a)*rad,13.85+r()*1.17,-1.28+Math.sin(a)*rad*.70],[sz*1.1,sz*1.19,sz],pick(r,[0x567847,0x78954e,0x8b9e57,0x587748]),"leaf");
  }
  const pole=[6.87,16.97,-2.96];garden.line([4.0,10.1,-3.0],pole,.063,brass);
  const flags=[0xcb7569,0xe7d8a3,0x81b2af,0xe4bb68,0xc9796c,0xd4d3af];
  for(let i=0;i<flags.length;i++){
    const f=i/6,x=pole[0]-.7*f,y=pole[1]-4.32*f;
    garden.box(x+.52,y-.23,-2.96,1.08,.45,.046,flags[i],"cloth",[.03,-.14,.06-i*.02]);
  }
  garden.finish(late);late.visible=false;
  const wings=[fins(body,-1),fins(body,1)];
  const scale=card.design.walkingHeightM/21.18;rig.scale.setScalar(scale);
  const transmission=fitTransmission(body);
  const lift=pilotLift(rig,scale);lift.update(0,()=>0,0);
  const gear=undercarriage(rig,body,scale),gangway=boarding(rig);
  let airborne=false,previousTime=0;
  function form(fly){airborne=fly;early.visible=!fly;late.visible=fly;}
  function pose(time,phase,motion,ground,flightBlend=0,shaft=phase*18/14){
    const wave=Math.sin(phase*2),bob=wave*.14*motion+Math.sin(time*1.15)*.018;
    body.position.y=bob;body.rotation.z=Math.sin(phase)*.023*motion;body.rotation.x=wave*.011*motion;
    transmission.update(shaft,phase);blades.rotation.z=-shaft;
    for(let i=0;i<2;i++)wings[i].rotation.z=(i?1:-1)*(-.05+flightBlend*(-.87+Math.sin(time*2.3)*.15));
    gear.update(time,phase,motion,ground,flightBlend);
    gangway.update(ground,root.position.y,scale,shaft,motion,flightBlend,clamp(time-previousTime,0,.1));
    previousTime=time;
  }
  pose(0,.8,0,()=>0);
  return {root,body,rig,sockets,exhaust:transmission.puffPort,scale,form,pose,gangway,lift,gear,get flying(){return airborne;}};
}
