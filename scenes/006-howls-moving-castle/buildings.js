import {T,Kit,Surface,random,pick,tint} from "./atelier.js";

export function windowFrame(k,x,y,z,w,h,shutters=false,glass=0x527576) {
  const ink=0x3b3b35, frame=0xd6c29a;
  k.box(x,y,z,w*1.17,h*1.12,.09,ink,"wood");
  k.box(x,y,z+.06,w,h,.065,glass,"glass");
  k.box(x,y,z+.115,w*.075,h,.05,frame,"wood");
  k.box(x,y+h*.12,z+.12,w,h*.06,.05,frame,"wood");
  k.box(x,y-h*.55,z+.08,w*1.29,h*.085,.25,0x9e8769,"wood");
  if(shutters)for(const side of [-1,1]){
    const xx=x+side*w*.76;
    k.box(xx,y,z+.01,w*.4,h*1.05,.10,0x63837c,"wood");
    for(let i=0;i<2;i++)k.box(xx,y+h*(i*.43-.21),z+.08,w*.33,h*.051,.045,0x415e58,"wood");
  }
}

export function roof(k,w,d,h,rise,col,detail=true){
  const depth=d/2+.12, length=Math.hypot(depth,rise), angle=Math.atan2(rise,depth);
  const s=new Surface();
  for(const side of [-1,1]) {
    const x=side*w/2;
    s.tri([x,h,-depth],[x,h,depth],[x,h+rise,0],0xead8af);
    k.box(0,h+rise*.5,side*depth*.5,w+.44,.12,length+.16,col,"paint",[side*angle,0,0]);
    if(detail&&d>3){
      k.box(0,h+rise*.49+.068,side*depth*.51,w+.38,.045,.08,tint(col,.81),"paint",[side*angle,0,0]);
    }
    k.box(0,h,side*depth,w+.49,.16,.13,0x48382d,"wood");
  }
  k.surface(s);k.box(0,h+rise+.035,0,w+.48,.13,.18,tint(col,1.20),"paint");
}
export function house(k,{w=4,h=3,d=3,wall=0xd7bb90,tiles=0x9e5141,trim=0x51483b,detail=true,timber=true,windows=3,door=true}={}){
  k.box(0,h*.5,0,w,h,d,wall);
  roof(k,w,d,h,Math.max(.44,d*.42),tiles,detail);
  for(const side of [-1,1]){
    k.at([0,0,side*d/2],[0,side===1?0:Math.PI,0],null,()=>{
      k.box(0,.14,.035,w,.23,.13,trim,"wood");
      if(timber){
        for(let i=0;i<=windows;i++) {
          const x=(i/windows-.5)*w;
          k.box(x,h/2,.055,.10,h,.12,trim,"wood");
          if(i<windows&&h>2.35)k.line([x,h*.54,.095],[x+w/windows,h-.15,.095],.052,trim,"wood","box");
        }
        k.box(0,h*.54,.06,w,.13,.13,trim,"wood");
        k.box(0,h-.06,.06,w,.14,.13,trim,"wood");
      }
      for(let i=0;i<windows;i++){
        const x=((i+.5)/windows-.5)*w;
        windowFrame(k,x,h*.75,.10,Math.min(.78,w/windows*.49),h*.31,h>3.5&&detail);
        if(h>3.5 && (i!==0||!door))windowFrame(k,x,h*.29,.10,Math.min(1,w/windows*.60),h*.30,false);
      }
      if(door&&side===1){
        const dh=Math.min(2.18,h*.58),xx=(.5/windows-.5)*w;
        k.box(xx,dh*.5,.09,dh*.52,dh,.14,0x534737,"wood");
        k.box(xx,dh*.46,.18,dh*.40,dh*.74,.07,0x6b6f58,"wood");
        k.ball(xx+dh*.14,dh*.46,.24,.04,.04,.038,0xc5a45f,"brass");
      }
    });
    k.at([side*w/2,0,0],[0,side*Math.PI/2,0],null,()=>{
      if(timber){
        k.box(0,h+.33,0,.09,.74,.12,trim,"wood");
        k.box(0,h*.5,0,d,.11,.12,trim,"wood");
      }
      windowFrame(k,0,h*.70,.04,Math.min(1,d*.48),h*.29);
    });
  }
  const stack=Math.max(.12,w*.055);
  k.box(-w*.27,h+d*.44,-d*.20,stack*1.8,.75+stack,stack*1.9,0x946d56,"stone");
  k.box(-w*.27,h+d*.44+.40+stack*.5,-d*.20,stack*2.2,.14,stack*2.2,0x58483e,"stone");
}
export function awning(k,x,y,z,w,d,colors=[0xb88356,0xe2cd99]){
  const n=Math.ceil(w/.42);
  for(let i=0;i<n;i++){
    const xx=x+w*((i+.5)/n-.5);
    k.box(xx,y,z,w/n+.008,.055,d,colors[i%colors.length],"cloth",[.16,0,0]);
    k.box(xx,y-d*.09-.13,z+d*.48,w/n+.008,.25,.06,colors[i%colors.length],"cloth");
  }
  for(const s of [-1,1])k.line([x+s*w*.47,y-.58,z-d*.48],[x+s*w*.47,y-d*.11,z+d*.49],.028,0x574e3c);
}
export function arch(k,x,y,z,w,h,depth,color){
  const r=w/2,stem=h-r;
  for(const side of [-1,1])k.box(x+side*(r+.12),y+stem*.5,z,.25,stem,depth,color,"stone");
  for(let i=0;i<13;i++){
    const a=(i+.5)*Math.PI/13;
    k.box(x+(r+.12)*Math.cos(a),y+stem+(r+.12)*Math.sin(a),z,.26,(r+.12)*Math.PI/13+.022,depth,color,"stone",[0,0,a]);
  }
}
export function rail(k,points,h=.62,c=0x484742){
  for(let i=0;i<points.length;i++){
    const [x,y,z]=points[i];k.post(x,y+h/2,z,.035,h,c);
    if(i){
      const a=points[i-1];
      for(const f of [.48,1])k.line([a[0],a[1]+h*f,a[2]],[x,y+h*f,z],.035,c);
    }
  }
}
export function streetLamp(k,x,y,z){
  k.post(x,y+1.5,z,.085,3,0x394b46);k.post(x,y+.22,z,.18,.44,0x475952);
  k.box(x,y+3.20,z,.42,.65,.42,0xe9cf89,"glow");
  k.put("spire",[x,y+3.66,z],[.36,.36,.36],0x385348,"iron");
  for(const a of [-1,1])for(const b of [-1,1])k.post(x+a*.20,y+3.19,z+b*.20,.025,.65,0x403f36);
}
