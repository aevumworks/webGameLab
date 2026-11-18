import {T,TAU,Kit,Surface,random,pick,tint,mix} from "./atelier.js";
import {house,rail} from "./buildings.js";

const shadow=0x414b4b,iron=0x595c54,bronze=0x927450,edge=0xb1a081;
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
function jacket(k,x,y,z,rx,rz,h,palette,seed){
  const r=random(seed),skin=new Surface(),n=30;
  for(let i=0;i<n;i++){
    const a=i/n*TAU+.007,b=(i+1)/n*TAU-.004,c=pick(r,palette),drop=.13+r()*.25;
    const at=(u,v,extrude=0)=>[x+Math.sin(u)*(rx+extrude),y+v,z+Math.cos(u)*(rz+extrude)];
    for(let j=0;j<3;j++){
      const u=mix(a,b,j/3),v=mix(a,b,(j+1)/3);
      skin.quad(at(u,-h-drop),at(v,-h-drop*.92),at(v,.025),at(u,.025),c);
      skin.quad(at(u,-h-drop-.03),at(v,-h-drop*.92-.03),at(v,-h-drop*.92+.055,.018),at(u,-h-drop+.055,.018),shadow);
    }
    for(let j=0;j<4;j++){
      const u=mix(a,b,.10+r()*.78),end=-.15-r()*h*.83;
      skin.tri(at(u,0,.018),at(u+.005+r()*.009,0,.018),at(u+.003,end,.028),tint(c,.48+r()*.29));
    }
    for(const f of [.18,.86])k.put("pebble",at(mix(a,b,f),-.13,.032),[.045,.045,.045],0x796f5a,"iron");
  }
  k.surface(skin,"iron");
  arc(k,x,y+.035,z,rx+.023,rz+.023,0,TAU,.052,0x8e846f);
}
function brickDrum(k,x,y,z,rx,rz,h){
  const r=random(506),s=new Surface(),n=22,rows=5;
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
    const a=(i+j%2*.5)*TAU/n+.009,b=a+TAU/n-.020,lo=y+h*j/rows+.014,hi=lo+h/rows-.030;
    const p=(u,v)=>[x+Math.sin(u)*rx,v,z+Math.cos(u)*rz];
    s.quad(p(a,lo),p(b,lo),p(b,hi),p(a,hi),pick(r,[0xb47c64,0xa56d57,0x996953,0xa27c68,0xbe8c73]));
  }
  k.surface(s,"stone");arc(k,x,y-.03,z,rx,rz,0,TAU,.094,shadow);
}
function duct(k,a,b,radius,seed){
  const r=random(seed),points=[a,[(2*a[0]+b[0])/3,(a[1]+b[1])/2+.17,(2*a[2]+b[2])/3+.26],b];
  const c=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));
  k.put(new T.TubeGeometry(c,18,radius,12,false),[0,0,0],[1,1,1],pick(r,[0x8f8069,0x847c69,0x777b6f]),"iron");
  for(let j=1;j<12;j+=2){
    const m=c.getPoint(j/12),n=c.getPoint((j+.35)/12);
    k.line(m.toArray(),n.toArray(),radius*1.16,0x726657,"iron","rod");
  }
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
  jacket(k,-3.31,12.47,2.98,3.11,3.10,.69,[0xb7ae92,0xb9ad91,0xc2b49c,0x9da18e,0xa9a78d],37);
  jacket(k,2.83,13.51,1.55,3.25,3.24,.79,[0xbab197,0xb5a58e,0xa8a792,0xc7b99f,0x9ea097],42);
  jacket(k,0,6.67,-.24,6.76,5.35,.53,[0x5e6763,0x827e6a,0x77715e,0x7f7565,0x716955],77);
  brickDrum(k,3.04,8.13,2.64,1.81,1.62,1.40);
  brickDrum(k,-3.86,8.16,-1.42,1.48,1.61,1.36);
  housePod(k,[3.32,11.55,4.46],.22,3.52,1.45,1.80,0xdacfb4,0xbb7355,.034);
  housePod(k,[-3.66,10.16,5.26],-.27,2.40,1.32,1.60,0xe1d3b0,0xad614c,-.07);
  housePod(k,[6.24,8.64,.52],1.47,3.10,1.70,2.25,0xd3c7a9,0xaa7155,.10);
  housePod(k,[-5.63,7.56,2.51],-1.15,2.90,1.24,1.63,0xd0bea1,0xab624e,-.095);
  housePod(k,[-2.90,7.58,-5.02],Math.PI,2.72,1.43,1.62,0xc6c2a8,0x93664d);
  housePod(k,[2.27,14.92,-.45],.52,2.82,1.21,1.34,0xe4d5b8,0xb06d52,.045);
  housePod(k,[-1.91,16.18,-1.98],-.68,2.24,1.82,1.43,0xbfbc96,0x917254,-.075);
  housePod(k,[.77,8.83,-4.58],2.8,3.22,1.52,1.78,0xd0c4a4,0xb46d57,.059);
  // Flanged delivery line from the hot starboard drum to the forward hip manifold.
  const feed=[[4.93,11.22,3.32],[5.90,11.11,3.50],[6.22,10.31,3.52],[6.03,8.85,3.58],[5.36,7.41,4.14],[4.93,6.12,3.63],[4.47,5.52,3.10]];
  const spine=new T.CatmullRomCurve3(feed.map(p=>new T.Vector3(...p)));
  k.put(new T.TubeGeometry(spine,38,.215,16,false),[0,0,0],[1,1,1],0x9a7660,"iron");
  for(const t of [.008,.23,.48,.73,.988]){
    const a=spine.getPoint(Math.max(0,t-.010)),b=spine.getPoint(Math.min(1,t+.010));
    k.line(a.toArray(),b.toArray(),.32,0x928267,"iron","rod");
  }
  k.ball(4.47,5.53,3.10,.46,.37,.46,0x666d60,"iron");
  k.ball(4.94,11.22,3.32,.53,.44,.42,0x846f5b,"iron");
  // Unequal pressure lines follow the outside of the boiler instead of ending in its skin.
  for(const side of [-1,1]){
    const sx=n=>side*n;
    duct(k,[sx(4.77),10.59,2.95],[sx(5.78),8.45,2.61],.34,side+12);
    duct(k,[sx(5.79),8.45,2.61],[sx(4.68),6.66,4.42],.30,side+23);
    duct(k,[sx(4.70),6.58,4.44],[sx(2.30),4.54,4.12],.23,side+14);
    const path=[[sx(2.46),4.41,-3.60],[sx(5.33),5.05,-3.33],[sx(6.53),6.49,-1.69],[sx(6.46),7.87,1.37]];
    k.curve(path,.22,0x5b655f,"iron",23);
    for(let i=0;i<4;i++){
      const a=.39+i*.18,rad=5.33;
      const x=sx(Math.sin(a)*rad),z=1.46+Math.cos(a)*rad;
      k.at([x,7.60+i*.19,z],[.06,a*side,side*.09],null,()=>{
        k.box(0,0,0,.67,.87,.13,i%2?0x846750:0x96735a,"iron");
        for(let j=0;j<4;j++)k.box(0,-.25+j*.17,.094,.47,.044,.07,shadow,"iron");
      });
    }
  }
  for(const [x,y,z,a,s] of [[5.95,7.05,2.86,.95,1.04],[-5.53,6.89,3.77,-.89,1.13],[2.85,7.87,5.69,.52,.77],[-1.99,8.11,5.97,-.24,.75],[-5.54,10.95,-.72,-1.66,.85],[4.72,7.15,-3.62,2.47,.92]])accessHatch(k,x,y,z,a,s);
  // External drive shaft, pressure cocks, brass handwheels, stop valves.
  for(const [x,y,z,angle] of [[-4.96,6.94,4.11,-.63],[4.96,8.91,3.59,.85],[5.88,7.25,-2.31,1.64],[-4.40,9.86,-3.35,-2.44]]){
    k.at([x,y,z],[0,angle,0],null,()=>{
      flangedLine(k,[0,0,-.25],[0,0,.56],.30,iron);
      k.put("rim",[0,0,.62],[.46,.46,.45],0xaa7756,"iron");
      for(let i=0;i<4;i++)k.box(0,0,.62,.051,.83,.07,0xb59061,"brass",[0,0,i*Math.PI/4]);
    });
  }
  const balk=[[-5.24,10.12,3.18],[-5.85,10.12,3.45],[-6.48,10.12,3.33],[-6.70,10.12,2.74],[-6.64,10.12,2.03]];
  for(const p of balk)k.box(...p,.71,.12,.67,0x938364,"wood");rail(k,balk,.55);
  for(let i=0;i<7;i++)k.line([-4.77+i*.43,4.69,3.87],[-4.46+i*.43,5.56,4.84],.089,0x82755e);
  arc(k,0,5.22,.10,5.67,4.97,-1.22,1.25,.175,0x59716c);
  arc(k,-.17,5.56,.36,5.92,5.05,-1.22,1.24,.13,0x8e6752);
  for(let i=0;i<9;i++){
    const a=-1.14+i*.279;k.line([5.59*Math.sin(a),4.89,.18+4.79*Math.cos(a)],[6.01*Math.sin(a),5.84,.25+4.98*Math.cos(a)],.065,0x5c5e52);
  }
  // A rack of narrow service flues gives the skyline a different silhouette from either side.
  for(const [x,y,z,h,r,tip] of [[-4.77,13.45,-.44,3.22,.18,-.25],[-3.62,15.64,-2.7,2.55,.20,-.13],[-.48,15.48,-3.8,2.88,.17,.14],[4.68,10.90,-2.7,2.8,.23,.30]]){
    const end=[x+tip,y+h,z-.20];flangedLine(k,[x,y,z],end,r,0x8d806a);k.ball(...end,r*1.25,r*.44,r*1.25,shadow,"iron");
  }
  k.line([-.83,17.15,-1.36],[-2.64,19.63,-1.49],.045,bronze);
  k.line([-2.85,19.65,-1.51],[-1.68,19.65,-1.51],.039,bronze);
  k.curve([[-2.64,19.65,-1.49],[-2.70,17.85,-1.72],[-4.63,15.26,-2.39]],.022,shadow);
}
