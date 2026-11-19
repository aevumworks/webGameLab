import {P} from "./masonry.js";
export function reliquary(w,dimensions,z){
  const {width:w0,length:l,height:h}=dimensions,bottom=1.07,half=w0/2,z0=z-l/2,z1=z+l/2;
  w.box(0,.43,z,2.58,.86,3.18,"dark");w.box(0,.91,z,2.67,.13,3.25,"step");
  w.box(0,1.00,z,1.55,.12,2.64,"dark");w.block(0,z,2.67,3.25);
  const Y=f=>bottom+h*f;
  w.box(0,Y(.20),z,w0,h*.40,l,"gilt");w.box(0,Y(.66),z,w0*.46,h*.28,l*.991,"gilt");
  function roof(ax,ay,bx,by){
    w.quad(P(ax,ay,z0),P(bx,by,z0),P(bx,by,z1),P(ax,ay,z1),"gilt");
    w.beam(P(ax,ay,z0),P(ax,ay,z1),.012,"gold");
    for(let i=0;i<=12;i++){const zz=z0+l*i/12;w.beam(P(ax,ay,zz),P(bx,by,zz),.009,"gold");}
  }
  for(const s of [-1,1]){
    roof(s*half,Y(.40),s*w0*.235,Y(.57));roof(s*w0*.235,Y(.80),0,Y(1));
    for(const zz of [z0,z1]){
      w.quad(P(s*half,Y(.40),zz),P(s*w0*.235,Y(.57),zz),P(s*w0*.235,Y(.39),zz),P(s*half,Y(.39),zz),"gilt");
      w.tri(P(s*w0*.235,Y(.80),zz),P(0,Y(1),zz),P(0,Y(.80),zz),"gilt");
    }
  }
  for(const [f,width] of [[.035,w0],[.39,w0],[.55,w0*.49],[.805,w0*.51]]){
    w.box(0,Y(f),z,width+.034,.029,l+.03,"gold");
    for(const s of [-1,1])for(let i=0;i<28;i++){
      w.boss(P(s*(width*.5+.018),Y(f),z0+(i+.5)*l/28),.0122,i%4===0?"ruby":i%4===2?"enamel":"gold");
    }
  }
  function relief(map,span,base,head,n){
    const gap=span/n,ww=gap*.43;
    for(let i=0;i<n;i++){const u=(i+.5)*gap-span*.5,mid=base+(head-base)*.62;
      const bg=[map(u-ww,base,0),map(u-ww,mid,0)];for(let j=0;j<=9;j++){const a=Math.PI*j/9;bg.push(map(u-Math.cos(a)*ww,mid+Math.sin(a)*(head-mid),0));}bg.push(map(u+ww,base,0));
      const ctr=map(u,mid,0);
      for(let j=0;j<bg.length;j++)w.tri(ctr,bg[j],bg[(j+1)%bg.length],"enamel");
      w.line(bg,.011,"gold");const scale=(head-base);
      const face=map(u,base+scale*.67,.026),chest=map(u,base+scale*.46,.03);
      w.boss(face,scale*.103,"gold");w.boss(chest,scale*.14,"gilt");
      for(const s of [-1,1]){
        w.beam(map(u+s*ww*.36,base+scale*.51,.030),map(u+s*ww*.59,base+scale*.30,.06),.013,"gold");
        w.beam(map(u+s*ww*.26,base+scale*.37,.028),map(u+s*ww*.47,base+scale*.08,.05),.022,"gilt");}
      w.beam(map(u-ww,base,.018),map(u-ww,mid,.018),.010,"gold");
    }
  }
  for(const s of [-1,1]){
    relief((u,y,d)=>P(s*(half+.008+d),y,z+u),l*.98,Y(.065),Y(.36),7);
    relief((u,y,d)=>P(s*(w0*.235+.008+d),y,z+u),l*.97,Y(.58),Y(.78),7);
    relief((u,y,d)=>P(u,y,z+s*(l/2+.009+d)),w0*.94,Y(.065),Y(.375),3);
    relief((u,y,d)=>P(u,y,z+s*(l/2+.011+d)),w0*.42,Y(.58),Y(.78),2);
    for(let j=0;j<21;j++){const zz=z0+(j+.52)*l/21;const a=P(s*half,Y(.415),zz),b=P(s*w0*.235,Y(.555),zz);
      const mid=a.clone().lerp(b,.52);w.boss(mid,.023,j%3?"gold":"ruby");}
  }
}
