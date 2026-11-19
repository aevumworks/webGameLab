import {T,TAU,Surface,random,pick,tint} from "./atelier.js";

export function meadowClump(type){
  const s=new Surface(),r=random([144,807,1209,1910][type]);
  const green=[0x5f8973,0x85a37a,0x9fb681,0x799b75];
  function blade(x,z,ang,h,w){
    const dx=Math.cos(ang),dz=Math.sin(ang),v=[x+dx*h*.19,h*.60,z+dz*h*.19],tip=[x+dx*h*.65,h,z+dz*h*.65];
    const a=[x+dz*w,0,z-dx*w],b=[x-dz*w,0,z+dx*w];
    const l=[v[0]+dz*w*.58,v[1],v[2]-dx*w*.58],q=[v[0]-dz*w*.58,v[1],v[2]+dx*w*.58];
    const c=pick(r,green);s.quad(a,b,q,l,c);s.tri(l,q,tip,tint(c,1.22));
  }
  for(let i=0;i<(type?3:5);i++){
    const a=r()*TAU,d=Math.sqrt(r())*.79;blade(Math.cos(a)*d,Math.sin(a)*d,a+r()*.8,.22+r()*.49,.037+r()*.030);
  }
  for(let i=0;i<(type===0?0:type===3?3:4);i++){
    const a=r()*TAU,d=Math.sqrt(r())*.77,x=Math.cos(a)*d,z=Math.sin(a)*d;
    const tall=type===3,h=(tall?.53:.31)+r()*.27,tx=x+.03*Math.sin(a),tz=z+.05*Math.cos(a);
    s.quad([x-.009,0,z],[x+.009,0,z],[tx+.008,h,tz],[tx-.008,h,tz],0x527b39);
    for(let n=0;n<2;n++){
      const ang=a+n*2.7,w=.024,y=h*(.25+n*.19),tip=[x+.14*Math.sin(ang),y+.084,z+.14*Math.cos(ang)];
      s.quad([x,y,z],[x+.072*Math.sin(ang)+w,y+.062,z+.064*Math.cos(ang)],tip,[x+.068*Math.sin(ang)-w,y+.047,z+.063*Math.cos(ang)],pick(r,green));
    }
    if(tall){
      const col=pick(r,[0x9979ab,0xae82b1,0xb98cae,0xbf80a3]);
      for(let j=0;j<4;j++){
        const f=j/4,angle=j*2.38+a,ring=.042*(1-f*.6),xx=tx+Math.cos(angle)*ring,zz=tz+Math.sin(angle)*ring,yy=h-.21+j*.053,sz=.065*(1-f*.45);
        s.quad([xx-sz,yy,zz],[xx,yy-.018,zz+sz],[xx+sz,yy+.022,zz],[xx,yy+.052,zz-sz*.6],tint(col,.86+j*.043));
      }
    }else{
      const col=type===1?pick(r,[0xf5ce59,0xebc348,0xf4dc77]):pick(r,[0xe6a7b0,0xf1c9c2,0xf2e3c3]);
      const petals=5,sz=.084+r()*.037;
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
  return new T.IcosahedronGeometry(1,0);
}
export function firGeometry(){
  const s=new Surface();
  for(let level=0;level<3;level++){
    const base=.18+level*.19,top=.63+level*.18,radius=.29-level*.063;
    for(let j=0;j<6;j++){
      const a=(j+level*.43)*TAU/6,b=a+TAU/6;
      const p=[radius*Math.sin(a),base,radius*Math.cos(a)],q=[radius*Math.sin(b),base,radius*Math.cos(b)];
      s.tri([0,top,0],p,q,tint(0xe3ead4,.76+.08*level));
      s.tri([0,base+.015,0],q,p,0xadbfa9);
    }
  }
  return s.geometry();
}
