import {T,TAU,Surface,mix} from "./atelier.js";
import {house,rail} from "./buildings.js";

const shadow=0x34464b,edge=0xc4a271;
function arc(k,cx,cy,cz,rx,rz,a,b,r,color,dy=0){
  const p=[];for(let i=0;i<=14;i++){const th=mix(a,b,i/14);p.push([cx+rx*Math.sin(th),cy+dy*i/14,cz+rz*Math.cos(th)]);}
  k.curve(p,r,color,"iron",22);
}
function flangedLine(k,a,b,r,c){
  k.line(a,b,r,c,"iron","rod");
  const u=new T.Vector3(...a),v=new T.Vector3(...b);
  for(const f of [.06,.91]){
    k.line(u.clone().lerp(v,f-.04).toArray(),u.clone().lerp(v,f+.04).toArray(),r*1.25,edge,"iron","rod");
  }
}
function jacket(k,x,y,z,rx,rz,h,palette){
  const s=new Surface(),n=16;
  for(let i=0;i<n;i++){
    const a=i*TAU/n,b=(i+1)*TAU/n,drop=h*(i%4===1?1.18:1);
    const p=(t,yy)=>[x+Math.sin(t)*rx,yy,z+Math.cos(t)*rz];
    s.quad(p(a,y-drop),p(b,y-drop),p(b,y),p(a,y),palette[i%palette.length]);
    s.quad(p(a,y-drop-.10),p(b,y-drop-.10),p(b,y-drop),p(a,y-drop),shadow);
  }
  k.surface(s,"paint");
}
function housePod(k,p,yaw,w,h,d,col,tiles,roll=0){
  k.at(p,[0,yaw,roll],null,()=>{
    house(k,{w,h,d,wall:col,tiles,windows:w>2.5?3:2,timber:false,detail:true,door:false});
    for(const s of [-1,1]){
      const xx=s*w*.37,heel=[xx,-.75,-d*.54],toe=[xx,-.09,d*.55];
      k.box(xx,-.43,-d*.49,.24,.92,.22,0x695d4b,"iron");
      k.line(heel,toe,.079,shadow,"iron","box");
      k.line([xx,-.10,-d*.68],toe,.083,0x716958,"iron","box");
      k.ball(xx,-.10,d*.54,.103,.099,.071,0xa39168,"brass");
    }
    k.box(0,-.035,0,w+.14,.115,d+.14,0x766957,"wood");
  });
}
function accessHatch(k,x,y,z,ang,size){
  k.at([x,y,z],[0,ang,0],[size,size,size],()=>{
    k.box(0,0,0,1.08,1.12,.13,0x464f4b,"iron");
    k.box(0,.01,.09,.90,.94,.09,0x806c57,"iron");
    for(let i=0;i<5;i++)k.box(0,-.32+i*.148,.155,.64,.092,.085,0x484a43,"iron",[-.26,0,0]);
    for(const sx of [-1,1])for(const sy of [-1,1])k.ball(sx*.45,sy*.44,.14,.045,.045,.028,edge,"brass");
  });
}
export function engineDetails(k){
  jacket(k,-3.31,12.54,2.98,3.14,3.13,.67,[0xe0d7b8,0xdad2b7]);
  jacket(k,2.83,13.57,1.55,3.27,3.26,.76,[0xd9bc8a,0xdbbf91]);
  housePod(k,[3.32,11.55,4.46],.22,3.52,1.45,1.80,0xe2cc9e,0xaf5c42,.034);
  housePod(k,[-3.66,10.16,5.26],-.27,2.40,1.32,1.60,0xe7d7ac,0xb46243,-.07);
  housePod(k,[-2.90,7.58,-5.02],Math.PI,2.72,1.43,1.62,0xbac7ad,0x88674e);
  housePod(k,[2.27,14.92,-.45],.52,2.82,1.21,1.34,0xe6d4a8,0xb35c43,.045);
  for(const [x,y,z,a,s] of [[-5.53,6.89,3.77,-.89,1.13],[-1.99,8.11,5.97,-.24,.75],[4.72,7.15,-3.62,2.47,.92]])accessHatch(k,x,y,z,a,s);
  const balk=[[-5.24,10.12,3.18],[-5.85,10.12,3.45],[-6.48,10.12,3.33],[-6.70,10.12,2.74],[-6.64,10.12,2.03]];
  for(const p of balk)k.box(...p,.71,.12,.67,0xa28762,"wood");rail(k,balk,.55);
  arc(k,0,5.22,.10,5.67,4.97,-1.22,1.25,.18,0x456b6a);
  arc(k,-.17,5.56,.36,5.92,5.05,-1.22,1.24,.13,0xb28352);
  for(const [x,y,z,h,r,lean] of [[-4.77,13.45,-.44,3.22,.18,-.25],[-.48,15.48,-3.8,2.88,.17,.14]]){
    const end=[x+lean,y+h,z-.20];flangedLine(k,[x,y,z],end,r,0x948168);k.ball(...end,r*1.25,r*.44,r*1.25,shadow,"iron");
  }
}
