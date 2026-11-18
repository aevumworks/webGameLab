import {T,TAU,Surface,random,pick,tint} from "./atelier.js";

export function meadowClump(type){
  const s=new Surface(),r=random([144,807,1209,1910][type]);
  const green=[0x64823e,0x80963f,0xa3ac55,0x778d41];
  function blade(x,z,ang,h,w){
    const dx=Math.cos(ang),dz=Math.sin(ang),v=[x+dx*h*.19,h*.60,z+dz*h*.19],tip=[x+dx*h*.65,h,z+dz*h*.65];
    const a=[x+dz*w,0,z-dx*w],b=[x-dz*w,0,z+dx*w];
    const l=[v[0]+dz*w*.58,v[1],v[2]-dx*w*.58],q=[v[0]-dz*w*.58,v[1],v[2]+dx*w*.58];
    const c=pick(r,green);s.quad(a,b,q,l,c);s.tri(l,q,tip,tint(c,1.22));
  }
  for(let i=0;i<(type?8:19);i++){
    const a=r()*TAU,d=Math.sqrt(r())*.79;blade(Math.cos(a)*d,Math.sin(a)*d,a+r()*.8,.22+r()*.49,.012+r()*.022);
  }
  for(let i=0;i<(type===0?0:type===3?6:9);i++){
    const a=r()*TAU,d=Math.sqrt(r())*.77,x=Math.cos(a)*d,z=Math.sin(a)*d;
    const tall=type===3,h=(tall?.53:.31)+r()*.27,tx=x+.03*Math.sin(a),tz=z+.05*Math.cos(a);
    s.quad([x-.009,0,z],[x+.009,0,z],[tx+.008,h,tz],[tx-.008,h,tz],0x527b39);
    for(let n=0;n<2;n++){
      const ang=a+n*2.7,w=.024,y=h*(.25+n*.19),tip=[x+.14*Math.sin(ang),y+.084,z+.14*Math.cos(ang)];
      s.quad([x,y,z],[x+.072*Math.sin(ang)+w,y+.062,z+.064*Math.cos(ang)],tip,[x+.068*Math.sin(ang)-w,y+.047,z+.063*Math.cos(ang)],pick(r,green));
    }
    if(tall){
      const col=pick(r,[0x9979ab,0xae82b1,0xb98cae,0xbf80a3]);
      for(let j=0;j<7;j++){
        const f=j/7,angle=j*2.38+a,ring=.042*(1-f*.6),xx=tx+Math.cos(angle)*ring,zz=tz+Math.sin(angle)*ring,yy=h-.21+j*.035,sz=.047*(1-f*.45);
        s.quad([xx-sz,yy,zz],[xx,yy-.018,zz+sz],[xx+sz,yy+.022,zz],[xx,yy+.052,zz-sz*.6],tint(col,.86+j*.043));
      }
    }else{
      const col=type===1?pick(r,[0xf5ce59,0xebc348,0xf4dc77]):pick(r,[0xe6a7b0,0xf1c9c2,0xf2e3c3]);
      const petals=type===1?5:7,sz=.053+r()*.031;
      for(let j=0;j<petals;j++){
        const t=j*TAU/petals,dx=Math.cos(t),dz=Math.sin(t),w=sz*.40;
        const b=[tx+dx*sz*.80+dz*w,h+.034,tz+dz*sz*.80-dx*w],c=[tx+dx*sz,h+.039,tz+dz*sz],e=[tx+dx*sz*.80-dz*w,h+.029,tz+dz*sz*.80+dx*w];
        s.quad([tx,h+.010,tz],b,c,e,col);
      }
      s.tri([tx-.028,h+.027,tz-.009],[tx+.022,h+.027,tz-.018],[tx+.008,h+.027,tz+.025],0xe2ad3d);
    }
  }
  return s.geometry();
}
export function crownGeometry(){
  const s=new Surface(),r=random(74539),basis=new T.IcosahedronGeometry(1,0).getAttribute("position");
  for(let i=0;i<31;i++){
    const a=i*2.39996,up=1-i*2/30,rad=Math.sqrt(Math.max(0,1-up*up)),sc=.30+r()*.21;
    const cx=Math.sin(a)*rad*.69,cy=up*.74,cz=Math.cos(a)*rad*.67;
    for(let f=0;f<basis.count;f+=3){
      const pts=[];
      for(let n=0;n<3;n++)pts.push([cx+basis.getX(f+n)*sc,cy+basis.getY(f+n)*sc*.92,cz+basis.getZ(f+n)*sc]);
      s.tri(...pts,tint(0xe8efca,.63+.19*up+r()*.20));
    }
  }
  return s.geometry();
}
export function firGeometry(){
  const s=new Surface(),r=random(81);
  for(let level=0;level<9;level++){
    const top=.31+level*.082,radius=.29*(1-level*.087),base=top-.17+level*.004;
    for(let j=0;j<13;j++){
      const a=j*TAU/13+level*1.4,b=a+TAU/13,extent=radius*(.82+r()*.30);
      const p=[extent*Math.sin(a),base+r()*.038,extent*Math.cos(a)],q=[extent*Math.sin(b),base+r()*.032,extent*Math.cos(b)];
      s.tri([0,top+.16,0],p,q,tint(0xd9e0c8,.62+.20*r()+.13*level/9));
    }
  }
  return s.geometry();
}
