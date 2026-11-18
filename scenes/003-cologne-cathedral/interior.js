import {P,TAU,archY,archPoints,arcade,frameMap,lancet} from "./masonry.js";
const T=globalThis.THREE;
export function panel(w,map,a,b,y0,y1,front,back,kind){
  const p=map(a,y0,front),q=map(b,y0,front),r=map(b,y1,front),s=map(a,y1,front);
  const pp=map(a,y0,back),qq=map(b,y0,back),rr=map(b,y1,back),ss=map(a,y1,back);
  w.quad(p,q,r,s,kind);w.quad(qq,pp,ss,rr,kind);w.quad(s,r,rr,ss,kind);w.quad(pp,qq,q,p,kind);w.quad(p,s,ss,pp,kind);w.quad(q,qq,rr,r,kind);
}
export function windowWall(w,map,span,sill,spring,peak,top,style=0,kind="stone",lights=3,bottom=0){
  const hw=span/2,a=hw*.80,depth=.66;
  panel(w,map,-hw,-a,bottom,top,0,-depth,kind);panel(w,map,a,hw,bottom,top,0,-depth,kind);
  if(sill>bottom)panel(w,map,-a,a,bottom,sill,0,-depth,kind);
  arcade(w,map,a,spring,peak,top,kind,depth);lancet(w,map,a,sill,spring,peak,style,"mould",lights,-.31);
  w.beam(map(-hw,sill-.15,.12),map(hw,sill-.15,.12),.15,"mould",true);
}
export function pier(w,x,z,major,s,collision=true){
  const h=major?s.naveSpring:s.aisleSpring,r=major?.89:.61;
  w.cyl(x,.22,z,r*1.68,.44,"mould","oct");w.cyl(x,.59,z,r*1.46,.36,"stone","oct");
  w.cyl(x,.91,z,r*1.30,.26,"mould","oct");w.cyl(x,h*.5+.47,z,r*.78,h-.86,"stone");
  for(let j=0;j<(major?10:8);j++){const a=j*TAU/(major?10:8),dx=Math.cos(a)*r*.97,dz=Math.sin(a)*r*.97;
    const sh=major&&j%3===0?s.aisleSpring+.16:h;w.cyl(x+dx,.85+sh*.5,z+dz,r*(j%2?.23:.31),sh-1.40,"mould");}
  for(const [y,m,hc] of [[1.12,1.19,.16],[s.aisleSpring-.12,1.22,.21],[s.aisleSpring+.11,1.27,.21],[h-.08,1.15,.22]])w.cyl(x,y,z,r*m,hc,"mould","oct");
  if(collision)w.posts.push({x,z,r:r*1.15});
}
function vault(w,x0,x1,z0,z1,spring,top,major,skipRim=false){
  const cx=(x0+x1)/2,cz=(z0+z1)/2,rx=Math.abs(x1-x0)/2,rz=Math.abs(z1-z0)/2,H=top-spring;
  function point(u,v){
    const a=archY(Math.abs(u),1,1.46)/1.46,b=archY(Math.abs(v),1,1.46)/1.46;
    return P(cx+u*rx,spring+H*Math.max(a,b)*(1-.067*Math.abs(u)-.028*Math.abs(v)),cz+v*rz);
  }
  // Four ruled webs share exact diagonal vertices; each rib sits just below its web.
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]],n=major?8:5;
  for(let q=0;q<4;q++){const a=corners[q],b=corners[(q+1)%4];
    const vertex=(i,j)=>point((i*a[0]+j*b[0])/n,(i*a[1]+j*b[1])/n);
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){w.tri(vertex(i,j),vertex(i,j+1),vertex(i+1,j),"web");if(i+j<n-1)w.tri(vertex(i+1,j),vertex(i,j+1),vertex(i+1,j+1),"web");}
    const rib=[];for(let j=0;j<=12;j++){const f=Math.sin(j*Math.PI/24),p=point(a[0]*f,a[1]*f);p.y-=major?.19:.13;rib.push(p);}w.line(rib,major?.235:.145,"mould");
    if(!skipRim&&(q===0||q===3)){const edge=[];for(let j=0;j<=14;j++){const t=(1-Math.cos(j*Math.PI/14))/2,p=point((1-t)*a[0]+t*b[0],(1-t)*a[1]+t*b[1]);p.y-=.16;edge.push(p);}w.line(edge,major?.27:.16,"mould");}
  }
  w.boss(P(cx,top-.22,cz),major?.46:.25,major?"gold":"mould");
}
function highSide(w,map,span,s,doc,style){
  const a=span/2;arcade(w,map,a,s.aisleSpring,s.arcadePeak,s.triforiumSill,"stone",.74);
  const top=s.clerestorySill-.42;
  panel(w,map,-a,a,s.triforiumSill,top,0,-.67,"stone");
  const count=4,unit=span*.88/count;
  for(let i=0;i<count;i++){
    const c=(i-(count-1)/2)*unit,inner=(u,y,d=0)=>map(c+u,y,d+.075),half=unit*.405,lo=s.triforiumSill+.68,shoulder=top-1.32;
    const edge=[inner(-half,lo),...archPoints(inner,half,shoulder,top-.34,8),inner(half,lo)],mid=inner(0,lo+.9);
    for(let j=0;j<edge.length;j++)w.tri(mid,edge[j],edge[(j+1)%edge.length],"shadow");
    w.line(edge,.083,"mould");w.beam(inner(0,lo,.08),inner(0,shoulder+.25,.08),.060,"pale");
    if(style===4)lancet(w,inner,half*.83,lo+.12,shoulder,top-.52,4,"mould",1,.105);
  }
  for(const y of [s.triforiumSill+.14,top+.08]) w.beam(map(-a,y,.16),map(a,y,.16),.17,"mould",true);
  windowWall(w,map,span,s.clerestorySill,s.clerestoryHead-4.50,s.clerestoryHead,doc.naveVault+.92,style,"stone",4,top);
}
function archArc(w,a,b,spring,peak,r,kind="mould"){
  const half=a.distanceTo(b)/2, mid=a.clone().lerp(b,.5);
  const map=(u,y)=>{const p=a.clone().lerp(b,(u+half)/(2*half));p.y=y;return p;};
  w.line(archPoints(map,half,spring,peak,14),r,kind);return mid;
}
function pew(w,x,z,width,side){
  w.box(x,.57,z,width,.15,.58,"oak");w.box(x,.94,z+.25,width,.60,.105,"ash");w.box(x,1.28,z+.25,width+.08,.10,.14,"oakLight");
  for(const end of [-1,1]){const xx=x+end*(width/2-.11);w.box(xx,.36,z,.17,.68,.50,"ash");w.box(xx,.88,z+.14,.15,.64,.55,"oak");w.boss(P(xx,1.29,z+.24),.118,"oakLight");}
  w.block(x,z,width,.70);
}
function fittings(w,s){
  for(let i=0;i<18;i++){const z=-23.4-i*2.12;if(i===9)continue;for(const sign of [-1,1])pew(w,sign*4.33,z,4.5,sign);}
  for(const sign of [-1,1])for(let i=0;i<9;i++){
    const x=sign*4.87,z=-95.0-i*2.05;w.box(x,1.52,z,.29,3.05,1.94,"ash");w.box(x-sign*.47,.62,z,.80,.17,1.88,"oak");
    for(const dz of [-.69,.69]){w.cyl(x-sign*.23,2.18,z+dz,.073,2.89,"oakLight");w.point(x,3.10,z+dz,.18,.73,"oak",true);}
    w.box(x,3.02,z,.98,.15,2.00,"oak");w.point(x,3.10,z,.89,.78,"ash",true);w.block(x-sign*.18,z,1.24,1.9);}
  const z=-113.5;
  w.box(0,.19,z,5.1,.36,2.38,"step");w.box(0,1.02,z,3.08,1.43,1.32,"shadow");w.box(0,1.80,z,3.82,.22,1.73,"step");w.block(0,z,4.22,1.97);
  // Double-gabled reliquary behind the high altar, its gilded arcades seen from the ambulatory.
  const az=z-3.3;w.box(0,.39,az,4.92,.76,2.68,"dark");w.box(0,.85,az,4.65,.18,2.56,"gold");
  w.box(0,1.43,az,4.26,1.06,2.27,"gold");w.box(0,2.37,az,3.25,.71,1.12,"gold");
  function gable(cx,cy,cz,ww,dd,h,kind){const x0=cx-ww/2,x1=cx+ww/2,z0=cz-dd/2,z1=cz+dd/2;
    w.quad(P(x0,cy,z0),P(cx,cy+h,z0),P(cx,cy+h,z1),P(x0,cy,z1),kind);w.quad(P(cx,cy+h,z0),P(x1,cy,z0),P(x1,cy,z1),P(cx,cy+h,z1),kind);
    for(const zz of [z0,z1])w.tri(P(x0,cy,zz),P(x1,cy,zz),P(cx,cy+h,zz),kind);}
  gable(-1.01,1.98,az,2.15,2.34,.64,"gold");gable(1.01,1.98,az,2.15,2.34,.64,"gold");gable(0,2.78,az,3.31,1.35,.49,"gold");
  for(const side of [-1,1])for(let i=0;i<9;i++){const x=-1.87+i*.47,zz=az+side*1.15;w.box(x,1.47,zz,.31,.62,.045,"enamel");w.boss(P(x,1.59,zz+side*.03),.10,"gold");w.cyl(x,1.34,zz+side*.03,.08,.25,"gold");}
  w.block(0,az,4.95,2.7);
  for(const sign of [-1,1])for(const zz of [-64,-92,-111]){
    const x=sign*(s.halfNave-.93);w.cyl(x,.115,zz,.33,.23,"iron");w.cyl(x,1.10,zz,.060,2.07,"gold");
    for(const n of [-1,0,1]){const xx=x+n*.31;w.beam(P(x,1.49,zz),P(xx,1.88,zz),.036,"gold");w.cyl(xx,2.0,zz,.042,.32,"web");w.boss(P(xx,2.195,zz),.056,"flame");}}
}
export function interior(w,doc,s){
  const row=s.rowZ,half=s.halfNave,mid=s.midAisle,wall=doc.insideWidth/2, [cw,ce]=s.crossingBays,[tw,te]=s.transeptOuterRows;
  const xrows=[-wall,-mid,-half,half,mid,wall],side=(x,z,sign)=>frameMap(x,z,sign*Math.PI/2);
  w.box(0,-.14,(row.at(-1)+.3)/2,wall*2,.28,-row.at(-1)+.3,"marble");
  for(let i=0;i<row.length;i++)for(const sign of [-1,1]){
    pier(w,half*sign,row[i],true,s);pier(w,mid*sign,row[i],false,s);
    if(i<=tw||i>=te)pier(w,wall*sign,row[i],false,s);
  }
  for(let i=0;i<row.length-1;i++){const z0=row[i],z1=row[i+1],cz=(z0+z1)/2,span=z0-z1;
    for(let j=0;j<5;j++){const major=j===2;if(!major&&i===cw)continue;
      vault(w,xrows[j],xrows[j+1],z0,z1,major?s.naveSpring:s.aisleSpring,major?doc.naveVault:doc.aisleVault,major);}
    for(const sign of [-1,1]){
      if(i!==cw)highSide(w,side(sign*half,cz,-sign),span,s,doc,i>=ce?0:(i%4===0?1:2));
      if(i<tw||i>=te){windowWall(w,side(sign*wall,cz,-sign),span,2.6,13.1,18.36,doc.aisleVault+.80,(i+Number(sign>0))%3,"stone",3);
        w.block(sign*(wall+.29),cz,1.0,span+.05);}
      if(i!==cw){const mp=side(sign*mid,cz,sign);arcade(w,mp,span/2,s.aisleSpring,doc.aisleVault-.55,doc.aisleVault+.62,"stone",.38);}
    }
  }
  // Transept central vessel runs at right angles to the long axis.
  const outer=doc.totalWidth/2-.58,xc=[half,mid,wall,wall+7.45,outer],zc=(row[cw]+row[ce])/2;
  for(const sign of [-1,1]){
    w.box(sign*(outer+wall)/2,-.14,zc,outer-wall,.28,row[tw]-row[te],"marble");
    for(let j=0;j<xc.length-1;j++){
      const a=sign*xc[j],b=sign*xc[j+1],len=Math.abs(b-a),cx=(a+b)/2;
      vault(w,Math.min(a,b),Math.max(a,b),row[cw],row[ce],s.naveSpring,doc.naveVault,true);
      for(const [zi,outerZi,orient] of [[cw,tw,1],[ce,te,-1]]){
        highSide(w,frameMap(cx,row[zi],orient>0?Math.PI:0),len,s,doc,2);
        if(j>=2){
          vault(w,Math.min(a,b),Math.max(a,b),row[zi],row[outerZi],s.aisleSpring,doc.aisleVault,false);
          windowWall(w,frameMap(cx,row[outerZi],orient>0?Math.PI:0),len,2.7,13.45,18.4,doc.aisleVault+.65,j%2,"stone",3);
          w.block(cx,row[outerZi],len,1.0);pier(w,b,row[zi],true,s);pier(w,b,row[outerZi],false,s);
        }
      }
    }
    const map=side(sign*outer,zc,-sign),hh=(row[cw]-row[ce])/2;
    windowWall(w,map,hh*2,9.1,30.1,40.9,doc.naveVault+1.25,sign>0?3:0,"stone",6);
    for(const [z0,z1] of [[row[tw],row[cw]],[row[ce],row[te]]])windowWall(w,side(sign*outer,(z0+z1)/2,-sign),z0-z1,3.1,13.1,18.5,doc.aisleVault+.8,1,"stone",3);
    w.block(sign*outer,zc,1.0,row[tw]-row[te]);
  }
  const cz=row.at(-1),N=s.radiatingChapels, radii=[half,mid,wall];
  const polar=(r,t,y=0)=>P(Math.cos(t)*r,y,cz-Math.sin(t)*r);
  for(let j=0;j<N;j++){
    const a=Math.PI*j/N,b=Math.PI*(j+1)/N,t=(a+b)/2;
    for(const rad of radii.slice(0,2)){if(j>0){const pt=polar(rad,a);pier(w,pt.x,pt.z,rad===half,s);}}
    const l=polar(half,a),r=polar(half,b),wid=l.distanceTo(r),midPt=l.clone().lerp(r,.5),axis=r.clone().sub(l).normalize();
    const near=(u,y,d=0)=>P(midPt.x+axis.x*u-Math.cos(t)*d,y,midPt.z+axis.z*u+Math.sin(t)*d);
    highSide(w,near,wid,s,doc,4);
    const inner0=polar(half,a,doc.naveVault-.85),inner1=polar(half,b,doc.naveVault-.85),tip=P(0,doc.naveVault,cz+1);
    w.tri(inner0,inner1,tip,"web");
    const rib=[];for(let n=0;n<=11;n++){const f=n/11,p=tip.clone().lerp(polar(half,a,s.naveSpring),f);p.y=doc.naveVault-(doc.naveVault-s.naveSpring)*f**2.45-.18;rib.push(p);}w.line(rib,.205,"mould");
    for(let ri=0;ri<2;ri++){
      const i0=polar(radii[ri],a),i1=polar(radii[ri],b),o0=polar(radii[ri+1],a),o1=polar(radii[ri+1],b);
      w.quad(i0,i1,o1,o0,"marble");const boss=i0.clone().add(i1).add(o0).add(o1).multiplyScalar(.25);boss.y=doc.aisleVault;
      for(const pt of [i0,i1,o1,o0]){const pts=[];for(let n=0;n<=8;n++){const f=n/8,p=pt.clone().lerp(boss,f);p.y=s.aisleSpring+(doc.aisleVault-s.aisleSpring)*Math.sin(f*Math.PI/2);pts.push(p);}w.line(pts,.14,"mould");}
      const vs=[i0,i1,o1,o0];for(let n=0;n<4;n++){const aa=vs[n].clone(),bb=vs[(n+1)%4].clone();aa.y=bb.y=doc.aisleVault-.56;w.tri(aa,bb,boss,"web");}
    }
    w.tri(P(0,0,cz),polar(half,a),polar(half,b),"marble");
    const outerR=doc.length+cz,ends=[polar(wall,a),polar(outerR-1.25,a+(b-a)*.16),polar(outerR,t),polar(outerR-1.25,b-(b-a)*.16),polar(wall,b)];
    const chapelCenter=polar(wall,t),cap=chapelCenter.clone();cap.y=15.85;
    for(let n=0;n<4;n++){const aa=ends[n],bb=ends[n+1],v=bb.clone().sub(aa),center=aa.clone().lerp(bb,.5),yaw=Math.atan2(-v.z,v.x),mp=frameMap(center.x,center.z,yaw),len=v.length();
      windowWall(w,mp,len,1.55,9.4,13.65,15.65,j===3?4:j%2,"stone",2);w.block(center.x,center.z,len,.58,yaw);
      w.tri(aa,bb,chapelCenter,"marble");w.tri(P(aa.x,14.7,aa.z),P(bb.x,14.7,bb.z),cap,"web");
      w.tri(P(aa.x,16.1,aa.z),P(bb.x,16.1,bb.z),P(cap.x,19.55,cap.z),"slate");
    }
    const point=polar(wall-.6,t);w.box(point.x,.51,point.z,1.55,1.02,.77,"mould",Math.PI/2+t);w.block(point.x,point.z,1.55,.77,Math.PI/2+t);
  }
  fittings(w,s);
}
