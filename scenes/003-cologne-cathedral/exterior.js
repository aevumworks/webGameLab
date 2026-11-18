import {P,TAU,archPoints,arcade,frameMap,lancet} from "./masonry.js";
import {panel,windowWall} from "./interior.js";
const T=globalThis.THREE;
function finial(w,x,z,y,r,h,kind="pale",ornate=false){
  w.box(x,y+h*.19,z,r*1.05,h*.38,r*1.05,kind,Math.PI/4);w.point(x,y+h*.35,z,r,h*.62,kind,true);
  if(ornate){for(let j=1;j<=3;j++){const f=j/4;for(const sg of [-1,1])w.boss(P(x+sg*r*(1-f)*.70,y+h*(.35+f*.54),z),r*(.22-.032*j),kind);}}
  w.boss(P(x,y+h*.93,z),r*.22,kind);
}
function gable(w,map,width,y,peak,kind="pale",depth=.42){
  const a=map(-width/2,y,0),b=map(width/2,y,0),c=map(0,peak,0),d=map(-width/2,y,-depth),e=map(width/2,y,-depth),f=map(0,peak,-depth);
  w.tri(a,b,c,kind);w.tri(d,f,e,kind);w.quad(a,c,f,d,kind);w.quad(b,e,f,c,kind);
  w.beam(a,c,.17,"mould");w.beam(c,b,.17,"mould");
  const h=peak-y;
  if(width>4.5&&h>4.3){
    quatrefoil(w,map,0,y+h*.36,Math.min(width*.18,h*.21),.10);
    for(const side of [-1,1])for(let i=1;i<=5;i++){
      const f=i/6.3,pt=map(side*width*.5*(1-f),y+h*f,.075);
      w.beam(pt,map(side*(width*.5*(1-f)+.28),pt.y+.36,.16),.135,"pale");}
    const pt=map(0,peak,0);finial(w,pt.x,pt.z,pt.y,.32,1.37,"pale",true);
  }
}
function quatrefoil(w,map,u,y,r,d){
  const pts=[];for(let i=0;i<=24;i++){const a=i*TAU/24;pts.push(map(u+r*Math.cos(a),y+r*Math.sin(a),d));}
  const center=map(u,y,d);
  for(let i=1;i<pts.length;i++)w.tri(center,pts[i],pts[i-1],"shadow");
  w.line(pts,r*.095,"pale");
  const flower=[];for(let i=0;i<=28;i++){const a=i*TAU/28,rr=r*(.67+.17*Math.cos(4*a));flower.push(map(u+rr*Math.cos(a),y+rr*Math.sin(a),d+.10));}
  w.line(flower,r*.075,"pale");
}
function openGable(w,map,width,base,top){
  for(const sign of [-1,1]){
    const a=map(sign*width/2,base,.04),b=map(0,top,.04);
    w.quad(a,b,map(0,top-.82,.04),map(sign*width*.43,base,.04),"pale");
    w.beam(a,b,.135,"pale");
    for(let i=1;i<=6;i++){const f=i/7.1,p=a.clone().lerp(b,f);w.beam(p,map(sign*(width*.5*(1-f)+.21),p.y+.29,.07),.105,"pale");}
  }
  quatrefoil(w,map,0,top-(top-base)*.33,(top-base)*.108,.16);
}
function niche(w,map,u,base,h,width,d){
  const half=width/2,mp=(x,y,z=0)=>map(u+x,y,d+z),low=base+h*.06,spring=base+h*.70,peak=base+h*.94;
  const points=[mp(-half,low),...archPoints(mp,half,spring,peak,8),mp(half,low)],center=mp(0,spring-.06);
  for(let i=0;i<points.length;i++)w.tri(center,points[i],points[(i+1)%points.length],"shadow");
  w.line(points,width*.076,"pale");const p=mp(0,base+h*.40,.16);
  w.cyl(p.x,p.y,p.z,width*.19,h*.30,"pale");w.boss(mp(0,base+h*.59,.20),width*.225,"pale");
  for(const sg of [-1,1]){const pp=mp(sg*half,peak-.11,.13);finial(w,pp.x,pp.z,pp.y,width*.18,h*.26,"pale");}
}
function frontDoor(w,map,half,span,large){
  const shoulder=large?6.8:5.35,peak=large?13.5:10.9,top=large?22.6:21.0;
  const a=span/2;
  panel(w,map,-a,-half,0,top,0,-1.25,"face");panel(w,map,half,a,0,top,0,-1.25,"face");
  arcade(w,map,half,shoulder,peak,top,"face",1.25);
  for(let i=0;i<5;i++){const delta=i*.245,ww=half+delta,dd=.09+delta*.95;
    const pts=[map(-ww,.22,dd),...archPoints(map,ww,shoulder+delta*.15,peak+delta*1.65,18,dd),map(ww,.22,dd)];
    w.line(pts,i%2?.092:.16,i%2?"dark":"mould");}
  const tymBase=shoulder+.8;
  const edge=archPoints(map,half-.19,shoulder,peak-.4,16,-.85);
  for(let j=1;j<edge.length;j++)if(Math.max(edge[j-1].y,edge[j].y)>tymBase)w.tri(map(0,tymBase,-.85),edge[j],edge[j-1],"dark");
  for(const sign of [-1,1]){
    const pt=map(sign*(half+.54),2,.54);w.box(pt.x,2.0,pt.z,.62,4,.78,"pale");
    for(let i=0;i<3;i++){const p=map(sign*(half+.20+i*.30),2.7+.35*i,.65+i*.14);
      w.cyl(p.x,p.y,p.z,.18,1.02,"mould");w.boss(P(p.x,p.y+.69,p.z),.20,"pale");w.point(p.x,p.y+1.08,p.z,.42,.95,"pale",true);}
    const dx=half*.47,door=map(sign*(half-.37),shoulder*.53,-dx*.98-1.12);
    const angle=sign*1.38;w.box(door.x,shoulder*.52,door.z,half,shoulder*1.04,.19,"iron",angle);
    w.block(door.x,door.z,half,.20,angle);
    for(let j=0;j<5;j++){const p=map(sign*(half+.68),peak*.52+j*1.35,.63);w.boss(p,.17,"pale");}
  }
  gable(w,(u,y,d=0)=>map(u,y,.38+d),2*half+2.48,peak+.6,top+1.65,"pale");
  const tri=archPoints(map,half*.56,peak+1.3,top-.62,12,.62);w.line(tri,.13,"dark");
  for(const sg of [-1,1])for(let i=0;i<4;i++){const u=sg*(half+(a-half)*(.38+.53*(i%2))),base=2.2+Math.floor(i/2)*7.0;
    niche(w,map,u,base,5.2,Math.min(.89,(a-half)*.31),.57+(i%2)*.06);}
}
function spire(w,cx,cz,y0,top,r){
  const n=8,bands=9;
  const at=(j,i)=>{const t=j/bands,rad=.21+(r-.21)*(1-t)**1.09,a=TAU*(i+.5)/n;return P(cx+rad*Math.cos(a),y0+(top-y0-3.85)*t,cz+rad*Math.sin(a));};
  for(let j=0;j<bands;j++)for(let i=0;i<n;i++){
    const a=at(j,i),b=at(j,i+1),c=at(j+1,i+1),d=at(j+1,i),rr=(1-j/bands)*.38+.095;
    w.beam(a,d,rr,"pale");w.beam(a,b,rr*.74,"face");
    const lo=a.clone().lerp(b,.5),hi=d.clone().lerp(c,.5);w.beam(a,hi,rr*.51,"pale");w.beam(b,hi,rr*.51,"pale");
    if(j<6){w.beam(lo,d,rr*.48,"face");w.beam(lo,c,rr*.48,"face");
      const mid=a.clone().lerp(d,.50),out=P((mid.x-cx)*.065,0,(mid.z-cz)*.065);
      w.beam(mid,mid.clone().add(out).add(P(0,.57,0)),rr*.66,"pale");}
    const face=(u,v)=>a.clone().lerp(b,u).lerp(d.clone().lerp(c,u),v);
    for(let n=0;n<10;n++){
      const u=n/10,v=(n+1)/10;
      const crown=u=>.49+.39*Math.pow(Math.max(0,1-Math.abs(u-.5)*2),.57);
      w.quad(face(u,crown(u)),face(v,crown(v)),face(v,.99),face(u,.99),"dark");
      w.quad(face(u,0),face(v,0),face(v,.115),face(u,.115),"face");
    }
    for(const u of [.07,.93])w.beam(face(u,0),face(u,.67),rr*.57,"face");
    if(j<7){const frame=(u,v)=>face(u,v);const loop=[];for(let n=0;n<=12;n++){const t=n*TAU/12,rad=.155*(.82+.18*Math.cos(t*4));loop.push(frame(.50+rad*Math.cos(t),.47+rad*Math.sin(t)));}w.line(loop,rr*.38,"pale");}
  }
  w.cyl(cx,top-2.76,cz,.33,2.1,"pale","oct");w.boss(P(cx,top-1.72,cz),.51,"pale");
  w.beam(P(cx,top-1.75,cz),P(cx,top,cz),.10,"gold");w.beam(P(cx-.37,top-.64,cz),P(cx+.37,top-.64,cz),.086,"gold");
}
function tower(w,cx,doc,s,north){
  const cz=-11.45,side=s.towerDepth,hh=side/2,baseZ=cz+hh,top=north?doc.northTower:doc.southTower;
  for(let face=0;face<4;face++){
    const a=face*Math.PI/2,map=frameMap(cx+Math.sin(a)*hh,cz+Math.cos(a)*hh,a);
    if(face===0)frontDoor(w,map,3.8,side,false);
    else if(face===2){windowWall(w,map,side,9.0,15.90,20.0,21.1,2,"dark",3);}
    else {windowWall(w,map,side,4.3,13.7,19.65,21,2,"face",4);if(Math.sign(cx)===Math.sign(Math.sin(a)))w.block(cx+Math.sin(a)*hh,cz,1,side);}
    for(const [bottom,upper,sill,shoulder,peak] of [[21,49,23.0,39.6,47.5],[49,74.5,51.7,64.7,71.8]]){
      for(const sg of [-1,1]){
        const local=(u,y,d=0)=>map(sg*side*.243+u,y,d);
        windowWall(w,local,side*.499,sill,shoulder,peak,upper,2,"face",3,bottom);
        openGable(w,(u,y,d=0)=>local(u,y,.52+d),side*.474,shoulder+1.45,peak+2.2);
      }
      for(const u of [-hh*.94,-hh*.76,0,hh*.76,hh*.94]){
        const pt=map(u,(bottom+upper)/2,.90);w.cyl(pt.x,pt.y,pt.z,Math.abs(u)<.01?.53:.34,upper-bottom,"pale","oct");
        for(const height of [bottom+1.05,upper-5.0])niche(w,map,u,height,3.8,.77,1.02);}
      w.beam(map(-hh,upper+.02,.52),map(hh,upper+.02,.52),.42,"pale",true);
      for(const sg of [-1,1]){
        const pp=map(sg*hh*.84,(bottom+upper)/2,.59);w.cyl(pp.x,pp.y,pp.z,.51,upper-bottom,"pale","oct");
        const niche=(u,y,d=0)=>map(sg*(hh-1.6)+u,y,.70+d);w.line(archPoints(niche,.73,upper-6,upper-3.9,7),.097,"mould");}
    }
    for(const height of [20.3,47.8,72.5])for(let n=0;n<13;n++){
      const cx=-hh+.82+n*(side-1.64)/12,mp=(u,y,o=0)=>map(cx+u,y,.77+o);
      const points=[mp(-.49,height),...archPoints(mp,.49,height+.7,height+1.50,6),mp(.49,height)];w.line(points,.10,"pale");}
    for(const u of [-hh*.92,0,hh*.92])for(const h of [45.4,70.3]){
      const pp=map(u,h,1.0);finial(w,pp.x,pp.z,h,.65,5.35,"pale",true);}
    const l=map(-hh,76,.17),r=map(hh,76,.17);w.beam(l,r,.47,"face",true);
  }
  // Four bundled angle buttresses step inward as the solid tower turns into an octagonal belfry.
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=cx+sx*(hh-.48),z=cz+sz*(hh-.5);
    for(const [floor,h,span] of [[0,25,3.2],[25,25,2.57],[50,21,2.0],[71,9.1,1.37]]){
      w.box(x,floor+h/2,z,span,h,span,"dark");
      cornerShafts(w,x,z,span,h,floor);
      w.box(x,floor+h-.18,z,span+.34,.55,span+.34,"pale");
    }
    finial(w,x,z,78.55,1.32,15.4,"pale",true);
    for(const f of [24.8,49.9])finial(w,x+sx*1.16,z+sz*.52,f,.73,6.4,"pale",true);
  }
  function cornerShafts(w,x,z,span,h,floor){for(const [ox,oz] of [[-.40,-.40],[.40,.40],[-.40,.40],[.40,-.40]])w.cyl(x+span*ox,floor+h/2,z+span*oz,.20,h,"pale");}
  const radius=hh*.91;
  w.cyl(cx,86.35,cz,radius*.68,21.5,"dark","oct");
  for(let i=0;i<8;i++){
    const a=(i+.5)*TAU/8,b=(i+1.5)*TAU/8,x=cx+radius*Math.cos(a),z=cz+radius*Math.sin(a);
    const xx=cx+radius*Math.cos(b),zz=cz+radius*Math.sin(b),width=Math.hypot(xx-x,zz-z);
    const mp=frameMap((x+xx)/2,(z+zz)/2,Math.atan2(-(zz-z),xx-x));
    w.cyl(x,(s.spireBase+74.4)/2,z,.94,s.spireBase-74.4,"face","oct");
    for(const o of [-.56,.56])w.cyl(x+o,86.5,z,.20,23.4,"pale");
    for(let j=0;j<2;j++){const c=(j-.5)*width*.46,map=(u,y,d=0)=>mp(c+u,y,d);w.line([map(-width*.215,76),...archPoints(map,width*.215,92.25,97.5,12),map(width*.215,76)],.31,"pale");
      for(let y=77.6;y<90.4;y+=1.35)w.beam(map(-width*.16,y,-.65),map(width*.16,y,-.65),.10,"shadow",true);}
    openGable(w,(u,y,d=0)=>mp(u,y,.17+d),width*.88,91.65,100.85);
    w.beam(mp(-width/2,75.3),mp(width/2,75.3),.40,"pale",true);w.beam(mp(-width/2,99),mp(width/2,99),.38,"pale",true);
    finial(w,x,z,97.80,.72,6.1,"face",true);
  }spire(w,cx,cz,s.spireBase,top,radius);
  for(const x of [cx-hh+.72,cx+hh-.72]){w.block(x,baseZ,2.8,3.9);}
}
function flyer(w,sign,z,from,to,y0,y1,depth){
  const path=(t,yOff)=>P(sign*(from+(to-from)*t),y0+(y1-y0)*t+2.4*Math.sin(t*Math.PI)-1.4*Math.pow(t,3)+yOff,z);
  const pts=[];for(let j=0;j<=9;j++)pts.push(path(j/9,0));w.line(pts,.31,"pale");
  for(let j=0;j<9;j++){const t=j/9,u=(j+1)/9,a=path(t,0),b=path(u,0);const c=P(b.x,y0+(y1-y0)*u+2.8,z),d=P(a.x,y0+(y1-y0)*t+2.8,z);
    for(const dz of [-depth,depth])w.quad(P(a.x,a.y,z+dz),P(b.x,b.y,z+dz),P(c.x,c.y,z+dz),P(d.x,d.y,z+dz),"face");
    w.quad(P(c.x,c.y,z-depth),P(d.x,d.y,z-depth),P(d.x,d.y,z+depth),P(c.x,c.y,z+depth),"pale");}
  for(let j=1;j<8;j++){const t=j/8,pp=path(t,0),hi=y0+(y1-y0)*t+2.9;w.beam(P(pp.x,hi,z),P(pp.x+sign*.34,hi+.55,z),.12,"pale");}
}
function roofs(w,doc,s){
  const cz=s.rowZ.at(-1),half=s.halfNave,wall=doc.insideWidth/2,from=-1.00,ridge=doc.ridge;
  for(const sg of [-1,1]){
    w.quad(P(0,ridge,from),P(sg*(half+.87),44.8,from),P(sg*(half+.87),44.8,cz),P(0,ridge,cz),"slate");
    for(let z=from;z>cz;z-=2.54)w.beam(P(0,ridge+.06,z),P(sg*(half+.86),44.89,z),.043,"lead");
    for(let i=0;i<s.rowZ.length-1;i++){if(i>=s.transeptOuterRows[0]&&i<s.transeptOuterRows[1])continue;
      const a=s.rowZ[i],b=s.rowZ[i+1];w.quad(P(sg*half,23.8,a),P(sg*(wall+1),20.65,a),P(sg*(wall+1),20.65,b),P(sg*half,23.8,b),"slate");}
  }
  const c=(s.rowZ[s.crossingBays[0]]+s.rowZ[s.crossingBays[1]])/2,out=doc.totalWidth/2-.75;
  for(const side of [-1,1])for(const dir of [-1,1])w.quad(P(0,ridge,c),P(dir*out,ridge,c),P(dir*out,44.7,c+side*8.45),P(0,44.7,c+side*8.45),"slate");
  for(let i=0;i<s.radiatingChapels;i++){const a=i*Math.PI/s.radiatingChapels,b=(i+1)*Math.PI/s.radiatingChapels;
    const p=(r,t,y)=>P(Math.cos(t)*r,y,cz-Math.sin(t)*r);
    w.tri(P(0,ridge,cz),p(half+.90,a,44.65),p(half+.90,b,44.65),"slate");
    w.quad(p(half+.8,a,23.55),p(wall+.25,a,20.2),p(wall+.25,b,20.2),p(half+.8,b,23.55),"slate");}
  const turret=doc.crossingTurret;w.cyl(0,61.4,c,2.68,4.5,"lead","oct");
  for(let i=0;i<8;i++){const a=i*TAU/8;w.cyl(Math.cos(a)*2.20,70.45,c+Math.sin(a)*2.2,.23,15.8,"dark");}
  w.cyl(0,77.7,c,2.61,.75,"pale","oct");w.point(0,77.9,c,2.98,turret-79.5,"slate");w.beam(P(0,turret-2.55,c),P(0,turret,c),.10,"gold");w.beam(P(-.50,turret-.88,c),P(.50,turret-.88,c),.085,"gold");
}
export function exterior(w,doc,s){
  const half=s.halfNave,mid=s.midAisle,wall=doc.insideWidth/2;
  for(const sign of [-1,1])tower(w,sign*s.towerCenters,doc,s,sign<0);
  const map=frameMap(0,-1.05,0);frontDoor(w,map,3.95,2*(s.towerCenters-s.towerDepth/2),true);
  const width=(s.towerCenters-s.towerDepth/2)*2;
  windowWall(w,map,width,23.0,40.4,52.2,54.2,0,"face",5,22.6);
  gable(w,map,width+1.65,54.05,66.1,"face");w.line(archPoints(map,2.14,56.1,61.53,12,.14),.19,"mould");finial(w,0,-1.05,65.5,.45,2.35,"pale");
  for(const sign of [-1,1]){
    w.block(sign*((3.95+doc.westWidth/2)*.5),-.96,doc.westWidth/2-3.95,1.5);
    w.box(sign*25.95,-.11,-10.2,8.5,.22,19.9,"marble");
    for(let i=2;i<s.rowZ.length;i++){
      if(i>s.transeptOuterRows[0]&&i<s.transeptOuterRows[1])continue;const z=s.rowZ[i];
      for(const [x,h,ww,dd,bottom] of [[mid+.65,33.0,1.53,1.85,doc.aisleVault+.45],[wall+1.21,24.8,1.65,2.10,0]]){
        const height=h-bottom;w.box(sign*x,bottom+height/2,z,ww,height,dd,"face");w.box(sign*x,bottom+height*.39,z,ww+.52,height*.78,dd+.38,"dark");
        w.box(sign*x,h-.20,z,ww+.47,.50,dd+.44,"pale");finial(w,sign*x,z,h,1.04,7.4,"pale",i%2===0);}
      flyer(w,sign,z,half+.45,mid+.62,37.10,27.00,.24);flyer(w,sign,z,mid+.67,wall+.73,28.15,20.8,.23);
      flyer(w,sign,z,half+.36,mid+.60,41.85,31.07,.20);flyer(w,sign,z,mid+.61,wall+.72,32.7,24.2,.20);
    }
    const x=sign*(doc.totalWidth/2-.66),z=(s.rowZ[s.crossingBays[0]]+s.rowZ[s.crossingBays[1]])/2;
    const mp=frameMap(x,z,sign*Math.PI/2),fac=doc.transeptFacadeWidth;
    gable(w,mp,fac*.65,44.1,doc.transeptFacadeHeight,"face");w.line(archPoints(mp,3.1,48.2,58.55,13,.18),.23,"pale");
    for(const n of [-1,1]){const pp=mp(n*(fac/2-.71),0,0);w.box(pp.x,15.75,pp.z,1.50,31.5,1.56,"face");finial(w,pp.x,pp.z,31,1.02,8.5,"pale");}
  }
  roofs(w,doc,s);
}
