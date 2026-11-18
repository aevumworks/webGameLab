import {T,TAU,Kit,Surface,lathe,random,pick,tint,group,clamp,mix,shaderNoise} from "./atelier.js";
import {house,roof,windowFrame,rail,awning,arch,streetLamp} from "./buildings.js";
import {tree} from "./landscape.js";
import {turnip,person,heen,hatBrim} from "./figures.js";

const plaster=[0xe3ce9f,0xd8ac85,0xdfbd94,0xc5bca2,0xd1b297,0xd5bb7f];
const tiles=[0xa5654e,0x965849,0x946955,0x826956,0xa77358];
const brass=0xb2965f,wood=0x765b43;
const arrivals={
  market:[-15,6.8,.83],harbor:[3.48,-5.99,1.95],palace:[0,35,0],meadow:[-18,13,.62],
  front:[0,17,-.10],memory:[-6,9,.32]
};
const doorLocal={market:[-5,-4.3],harbor:[2.60,-6.20],palace:[-8,28],meadow:[-6,-4.3],front:[-5,7.1],memory:[-1,-3.9]};
const roadMaterial=new T.MeshStandardMaterial({color:0xb4a58e,roughness:.93});
roadMaterial.onBeforeCompile=s=>{
  s.vertexShader="varying vec3 vPave;\n"+s.vertexShader;s.vertexShader=s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vPave=(modelMatrix*vec4(position,1.)).xyz;");
  s.fragmentShader="varying vec3 vPave;\n"+shaderNoise+"\n"+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
    vec2 p=vPave.xz*vec2(2.8,4.10);p.y+=.074*paintNoise(vPave.xz*3.);
    p.x+=mod(floor(p.y),2.)*.5+(hash21(vec2(floor(p.y),1.))-.5)*.45;
    vec2 uv=fract(p);vec2 edge=min(uv,1.-uv);
    float grain=paintNoise(vPave.xz*14.),block=hash21(floor(p));
    float mortar=smoothstep(.008,.105,min(edge.x,edge.y)+.045*grain);
    diffuseColor.rgb*=mix(.67,.76+.31*block+.13*grain,mortar);
    diffuseColor.rgb+=vec3(.061,.046,.031)*(1.-smoothstep(.06,.16,uv.y))*mortar; `);
};
function paving(root,w,d,x=0,z=0){
  const m=new T.Mesh(new T.BoxGeometry(w,.12,d),roadMaterial);m.position.set(x,.028,z);m.receiveShadow=true;root.add(m);
}
function banner(k,a,b,colors,r){
  const line=new T.CatmullRomCurve3([new T.Vector3(...a),new T.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2-.75,(a[2]+b[2])/2),new T.Vector3(...b)]);
  k.curve([a,line.getPoint(.5).toArray(),b],.030,0x685345,"wood");
  for(let i=1;i<11;i++){
    const p=line.getPoint(i/12),n=line.getPoint((i+.51)/12),len=.47+r()*.31;
    // Keep all the pennants of one line in a single painted surface.
    if(!k.pennants)k.pennants=new Surface();
    const c=colors[i%colors.length];k.pennants.tri(p.toArray(),n.toArray(),[(p.x+n.x)/2+.09,(p.y+n.y)/2-len,(p.z+n.z)/2+.16],c);
  }
}
function portal(k,x,z,angle=0){
  k.at([x,0,z],[0,angle,0],null,()=>{
    k.box(0,1.27,-.1,1.52,2.54,.18,0x574c3b,"wood");
    k.box(0,1.22,.016,1.22,2.36,.10,0x587366,"wood");
    for(const yy of [.51,1.44,2.0])k.box(0,yy,.082,.98,yy===2?.37:.68,.064,yy===2?0x819b93:0x627d70,yy===2?"glass":"wood");
    k.ball(.44,1.04,.16,.084,.084,.058,brass,"brass");
    k.box(0,.055,.34,1.7,.11,.88,0x9f937b,"stone");
  });
}
function stall(k,x,z,colors,r){
  k.at([x,0,z],null,null,()=>{
    k.box(0,.74,0,2.75,.14,1.12,wood,"wood");for(const sx of [-1,1])for(const sz of [-1,1])k.post(sx*1.25,1.04,sz*.48,.047,2.06,wood,"wood");
    awning(k,0,2.18,0,3.24,1.59,colors);
    for(let i=0;i<22;i++)k.ball((r()-.5)*2.38,.89+r()*.12,(r()-.5)*.88,.13,.12,.14,pick(r,[0xbd6851,0xe0bb65,0x829354]));
  });
}
function shop(k,block,r){
  const x=-5,z=-8,w=8,d=6,h=3.0;
  k.at([x,0,z],null,null,()=>{
    k.box(0,h/2,-d/2,w,h,.22,0xc1a581);k.box(-w/2,h/2,0,.19,h,d,0xc1a581);k.box(w/2,h/2,0,.19,h,d,0xc1a581);
    k.box(0,.055,0,w,.10,d,0x957b59,"wood");k.box(0,h+.01,0,w,.16,d,0x775c43,"wood");
    for(const side of [-1,1])k.box(side*(w*.32),h/2,d*.5,2.58,h,.25,0x476956,"wood");
    for(const sx of [-2.56,2.56]){
      windowFrame(k,sx,1.64,3.14,1.95,1.65,false,0x8baaaa);
      for(let i=0;i<3;i++)k.put(hatBrim,[sx+(i-1)*.46,1.00,3.36],[.25,.31,.23],pick(r,[0xdaba84,0xb48680,0x798f85]),"cloth");
    }
    k.at([0,h+.07,0],null,null,()=>house(k,{w,h:3.25,d,wall:0xd8c4a2,tiles:0xa8614f,trim:0x575e46,windows:4,door:false}));
    awning(k,-2.50,2.65,3.67,2.81,1.18,[0x7e9b85,0xd6cd9c]);awning(k,2.49,2.65,3.67,2.81,1.18,[0x7e9b85,0xd6cd9c]);
    for(let j=0;j<3;j++){
      k.box(0,.70+j*.77,-2.79,6.7,.10,.51,wood,"wood");
      for(let i=0;i<8;i++)k.put(hatBrim,[-2.78+i*.79,.77+j*.77,-2.69],[.36,.45,.36],pick(r,[0xcaa380,0xe0b984,0xba857d,0x819881,0x9a84a5]),"cloth");
    }
    k.box(-1.8,.86,-.8,2.05,.13,1.22,0x846246,"wood");
    for(const sx of [-2.66,-.94])for(const sz of [-1.29,-.31])k.post(sx,.42,sz,.067,.84,wood,"wood");
    k.put(hatBrim,[-1.75,.95,-.71],[.35,.48,.35],0xb18d70,"cloth");
    k.at([-2,.10,-1.64],[0,.5,0],null,()=>person(k,"sophie"));
    k.line([3.76,2.86,3.07],[3.77,2.86,4.34],.058,0x494b42);k.line([3.77,2.84,4.20],[3.77,2.47,4.20],.029,brass);
    k.put(hatBrim,[3.77,2.37,4.20],[.45,.46,.42],0xc5a371,"brass");
  });
  block(x,z-3,8,.32);block(x-4,z,.32,6.0);block(x+4,z,.32,6.0);
  for(const sx of [-2.56,2.56])block(x+sx,z+3,2.58,.40);block(x-1.8,z-.8,2.14,1.3);
}
function street(k,root,block,r,mode){
  const market=mode==="market",front=mode==="front";
  paving(root,market?103:90,15,0,2.6);paving(root,10,74,14,-6);
  for(const side of [-1,1]){
    let x=-43;
    while(x<45){
      const w=4.8+r()*3.1,d=5.5+r()*2,h=4.7+r()*3.6;
      const xx=x+w*.5,z=side===-1?-7.6-r()*1.0:13.2+r()*.75;
      x+=w+.21;
      if(Math.abs(xx-14)<5.2||side===-1&&Math.abs(xx+5)<7.6)continue;
      const yaw=side===-1?0:Math.PI;
      k.at([xx,0,z],[0,yaw,0],null,()=>house(k,{w,h,d,wall:front?0xa6968a:pick(r,plaster),tiles:front?0x75665f:pick(r,tiles),windows:3,detail:Math.abs(xx)<18}));
      block(xx,z,w,d);
      if(!front&&r()>.38)k.at([xx,0,z],[0,yaw,0],null,()=>awning(k,0,2.75,d/2+.58,w*.80,1.15,pick(r,[[0xad7b65,0xe0c897],[0x7d9386,0xd4d2a5],[0xb29a65,0xdfc995]])));
    }
  }
  for(let i=0;i<5;i++){
    const x=-28+i*13;
    streetLamp(k,x,0,8.85);if(market)banner(k,[x,5.41,-3.95],[x+4.5,5.88,9.5],[0xca7866,0xe4c666,0x83a1a6,0xc9b0a0],r);
  }
  if(market){shop(k,block,r);stall(k,22,5.8,[0x9f6c5a,0xd7bc87],r);stall(k,-24,-1.5,[0x79957e,0xc7c18b],r);}
  else{k.at([-5,0,-8],null,null,()=>house(k,{w:7,h:6.3,d:6.5,wall:0x96877d,tiles:0x71615d}));block(-5,-8,7,6.5);}
}
function clockTower(k,x,z){
  k.box(x,5,z,4.8,10,4.5,0xcfb993,"stone");k.box(x,10.0,z,5.28,.54,4.90,0x7a7d67,"wood");
  k.post(x,12.0,z,2.18,3.6,0xd9c6a2,"paint");k.put("spire",[x,15.29,z],[2.71,3.87,2.71],0x748878,"iron");
  k.post(x,17.76,z,.11,1.85,brass);
  for(const side of [0,Math.PI/2,Math.PI,Math.PI*1.5])k.at([x,11.92,z],[0,side,0],null,()=>{
    k.put("disk",[0,0,2.12],[1.01,1.01,1],0xe0cf9b);k.put("rim",[0,0,2.15],[1.0,1,1],0x796b52,"brass");
    k.line([0,0,2.21],[.2,.68,2.21],.043,0x555344);k.line([0,0,2.21],[-.46,.08,2.21],.050,0x555344);
  });
}
function train(k){
  k.box(0,1.02,0,5.7,.43,1.74,0x4a5751,"iron");
  k.post(.59,1.74,0,.78,3.49,0x586659,"iron",[0,0,Math.PI/2]);
  k.box(-1.85,2.06,0,1.60,1.87,1.66,0x5c7362,"iron");k.box(-1.85,3.09,0,1.88,.19,1.96,0x3c4741,"iron");
  k.post(1.45,2.77,0,.24,.90,0x675b48);k.post(1.45,3.22,0,.34,.16,0x3d4140);
  for(const s of [-1,1])for(let i=0;i<4;i++){
    k.post(-1.82+i*1.08,.67,s*.81,.54,.21,0x7b4f40,"iron",[Math.PI/2,0,0]);
    k.put("hoop",[-1.82+i*1.08,.67,s*.94],[.46,.46,.46],brass,"brass");
  }
  for(let j=0;j<3;j++){
    const x=-5.8-j*5.85;k.box(x,1.7,0,5.32,2.22,1.88,0x9c7457,"wood");k.box(x,2.88,0,5.62,.23,2.08,0x586057,"iron");
    for(const s of [-1,1])for(let i=0;i<5;i++)windowFrame(k,x+(i-2)*.92,1.99,s*.955,.56,.74,false,0x74928b);
  }
}
function ship(k,l,color,sailing){
  const s=new Surface(),rows=[[-.48,.035],[-.37,.66],[-.19,.96],[.13,1],[.33,.72],[.50,.025]];
  for(let j=0;j<rows.length-1;j++)for(const sign of [-1,1]){
    const [a,r]=rows[j],[b,w]=rows[j+1],beam=l*.147;
    s.quad([sign*r*beam,l*.11,a*l],[sign*w*beam,l*.11,b*l],[sign*w*beam*.68,-l*.05,b*l],[sign*r*beam*.68,-l*.05,a*l],color);
    s.quad([0,l*.115,a*l],[0,l*.115,b*l],[sign*w*beam,l*.11,b*l],[sign*r*beam,l*.11,a*l],0xae9068);
    // A boot stripe follows the actual tapered hull just above the waterline.
    const stripe=(width,z,y)=>[sign*width*beam*(.68+.32*(y+.05)/.16)+sign*.012,l*y,z*l];
    s.quad(stripe(r,a,-.004),stripe(w,b,-.004),stripe(w,b,.009),stripe(r,a,.009),0x655749);
    k.line([sign*r*beam,l*.112,a*l],[sign*w*beam,l*.112,b*l],l*.011,0x5b5143,"wood");
  }k.surface(s);
  if(sailing){
    for(const z of [-.24,-.06,.15])k.box(0,l*.123,l*z,l*(z<-.2?.16:.23),.075,l*.042,0x826d56,"wood");
    k.post(0,l*.31,0,l*.018,l*.60,wood,"wood");
    const sail=new Surface();sail.tri([0,l*.58,0],[0,l*.18,0],[l*.042,l*.20,l*.36],0xe7d5ad);
    sail.tri([0,l*.51,-.02],[.01,l*.19,-.02],[-l*.04,l*.21,-l*.30],0xc9a37e);k.surface(sail,"cloth");
    for(const side of [-1,1])k.line([0,l*.58,0],[0,l*.12,side*l*.42],l*.004,0x6c6352,"wood");
  }else{
    k.box(0,l*.18,-l*.025,l*.227,l*.14,l*.51,0xe0d1b6);k.box(0,l*.275,-l*.10,l*.195,l*.065,l*.31,0xb5c5b8);
    for(const sign of [-1,1])for(let j=0;j<8;j++){
      const z=l*(j/17-.21),x=sign*l*.115;
      k.ball(x,l*.19,z,l*.008,l*.018,l*.018,0x415d62,"glass");
      k.put("hoop",[x+sign*l*.003,l*.19,z],[l*.019,l*.019,l*.019],0xb39963,"brass",[0,Math.PI/2,0]);
    }
    k.post(0,l*.39,-l*.06,l*.041,l*.24,0xac6c50);k.post(0,l*.485,-l*.06,l*.043,l*.059,0x515951);
    for(const side of [-1,1]){
      const railPts=[];for(let i=0;i<12;i++){
        const z=l*(-.35+i*.059),x=side*l*(.116-.08*(Math.abs(z)/l)**2);
        railPts.push([x,l*.12,z]);if(i%2===0)k.post(side*l*.096,l*.248,z*.55,l*.011,l*.053,0x5d746d);
      }rail(k,railPts,l*.035,0x786e5d);
    }
    k.post(0,l*.34,l*.30,l*.010,l*.45,wood,"wood");
    k.line([0,l*.56,l*.30],[0,l*.15,l*.46],l*.0038,0x6a6152);
  }
}
function harbor(k,root,block,r,floors){
  paving(root,26,100,-2,0);
  floors.push([-2,0,26,100,.091],[12.42,0,3.36,94,.11]);
  for(let i=-5;i<=5;i++){
    const z=i*8.15,w=6.7+r(),h=5.5+r()*3,d=5+r()*1.6;
    if(i===0)continue;
    k.at([-9.8,0,z],[0,Math.PI/2,0],null,()=>house(k,{w,h,d,wall:pick(r,plaster),tiles:pick(r,tiles),windows:3,detail:Math.abs(i)<3}));block(-9.8,z,d,w);
  }
  k.at([0,0,-7.4],null,null,()=>house(k,{w:4.95,d:6.5,h:4.8,wall:0xc8c7a6,tiles:0x7a8076}));block(0,-7.4,4.95,6.5);portal(k,2.55,-6.2,Math.PI/2);
  k.at([2.55,0,-6.2],[0,Math.PI/2,0],null,()=>{
    k.box(0,2.53,.65,2.18,.20,1.69,0x655341,"wood");
    for(const side of [-1,1]){
      k.box(side*.96,1.16,.63,.13,2.40,1.48,0xb1a187,"stone");
      k.box(side*.96,1.12,1.38,.17,2.35,.18,0x537064,"wood");
    }
    k.line([-.75,2.32,.76],[-.75,2.34,1.12],.024,0x776d55);
    k.post(-.75,2.26,1.12,.019,.17,brass,"brass");
    k.put("spire",[-.75,2.20,1.12],[.146,.14,.146],0x56665e,"iron");
    k.post(-.75,2.057,1.12,.083,.17,0xd5c6a2,"glass");
    k.ball(-.75,2.056,1.12,.041,.074,.041,0xdba968,"glow");
    k.post(-.75,1.955,1.12,.109,.048,0x777954,"brass");
    for(let i=0;i<6;i++){const a=i*TAU/6;k.post(-.75+.097*Math.sin(a),2.055,1.12+.097*Math.cos(a),.009,.19,0x625c48,"iron");}
  });for(const z of [-7.16,-5.24])block(3.18,z,1.49,.18);
  for(let i=-6;i<=6;i++){
    const z=i*7.25;k.box(12.45,-1.95,z,3.26,4.06,7.30,0x958b75,"stone");
    k.box(12.45,.071,z,3.35,.12,7.29,0xaaa28a,"stone");
    for(let row=0;row<4;row++)for(let j=0;j<5;j++){
      const zz=z-3.62+(j+.5)*1.45;
      k.box(14.10,-.36-row*.69,zz,.13,.64,1.40,row%2?0x938e78:0xa39c83,"stone");
    }
    if(i%2===0){k.post(13.0,.32,z,.27,.66,0x48564f);block(13,z,.54,.54);streetLamp(k,10.60,0,z);block(10.6,z,.25,.25);}
  }
  for(const [z,len] of [[3,16],[-19,21],[25,13]]){
    for(let j=0;j<Math.ceil(len/.32);j++){
      const xx=12+(j+.5)*len/Math.ceil(len/.32);
      k.box(xx,.019,z,len/Math.ceil(len/.32)-.014,.17,2.35,j%4?0x9c8162:0x877257,"wood");
      for(const side of [-1,1])k.post(xx,.11,z+side*.89,.023,.019,0x72644c);
    }
    for(const side of [-1,1])k.box(12+len*.5,-.17,z+side*.80,len,.28,.24,0x685945,"wood");
    floors.push([12+len*.5,z,len,2.38,.101]);
    for(let i=0;i<len;i+=2){
      if(i===len-2||i===4){
        k.post(12+i,.35,z-.86,.128,.51,0x66594b);
        k.put("rim",[12+i,.57,z-.86],[.154,.154,.154],0xa48c65,"brass",[Math.PI/2,0,0]);
        block(12+i,z-.86,.29,.29);
      }
      for(const side of [-1,1])k.post(12+i,-1.19,z+side*.98,.15,3.2,wood,"wood");
    }
  }
  for(const [x,z,l,c,yaw,sail] of [[20,8,8.8,0x847250,.12,true],[36,-10,21,0x516b6f,-.10,false],[31,20,9.2,0x9c674f,-.18,true],[49,37,12,0x677f77,-.22,true],[72,2,27,0x687b75,1.2,false]]){
    k.at([x,-3.28,z],[0,yaw,0],null,()=>ship(k,l,c,sail));
  }
  // Mooring hawsers sag from a riverboat cleat to the timber pier.
  for(const [a,b] of [[[21,-2.41,5.42],[18,.54,3.98]],[[34,-1.08,-16.5],[31,.49,-18.15]]])
    k.curve([a,[(a[0]+b[0])/2,(a[1]+b[1])/2-.38,(a[2]+b[2])/2],b],.042,0x796b52,"wood");
  k.at([96,-3.50,12],null,null,()=>{
    k.put("boulder",[0,-.61,0],[5.6,2.56,4.5],0x7c8275,"stone");
    k.post(0,4.02,0,1.09,6.41,0xd6c8a5,"stone");k.post(0,7.01,0,1.14,.70,0xa46753);
    k.post(0,7.82,0,.90,1.16,0xc1cfb5,"glass");k.put("cone",[0,8.83,0],[1.23,1.08,1.23],0x796f62,"iron");
  });
  for(let i=0;i<5;i++){
    const z=i===2?-10.4:-28+i*12;stall(k,4,z,[0x7e9fa1,0xd2c8a4],r);block(4,z,2.65,1.04);
    for(let j=0;j<4;j++){const x=6.7+(j%2)*.68;k.box(x,.34+Math.floor(j/2)*.62,z,.64,.60,.67,0x977b58,"wood");if(j<2)block(x,z,.64,.67);}
  }
}
function palm(k,x,y,z,h,r){
  k.post(x,y+h*.47,z,.091,h*.94,0x887b53,"wood");const surface=new Surface();
  for(let j=0;j<11;j++){
    const a=j*TAU/11+r()*.22,len=h*(.47+r()*.21);
    const mid=[x+Math.cos(a)*len*.5,y+h+.26,z+Math.sin(a)*len*.5],tip=[x+Math.cos(a)*len,y+h*.76,z+Math.sin(a)*len];
    const start=[x,y+h,z],width=.16;const b=[mid[0]+Math.sin(a)*width,mid[1],mid[2]-Math.cos(a)*width],c=[mid[0]-Math.sin(a)*width,mid[1]-.06,mid[2]+Math.cos(a)*width];
    surface.quad(start,b,tip,c,pick(r,[0x63844e,0x74954e,0x506f4b]));
  }k.surface(surface,"leaf");
}
function palace(k,root,block,r,floors){
  paving(root,31,108,0,5);
  const stone=0xdfc9a0,cream=0xf0dfba;
  for(let i=0;i<28;i++)k.box(0,.12*(i+1),21-i*.73,13.8,.24*(i+1),.78,stone,"stone");
  k.box(0,3.36,-13.75,35,6.72,29,stone,"stone");floors.push([0,-13.75,35,29,6.72]);
  for(const sx of [-1,1]){
    k.line([sx*7.35,1.0,21.5],[sx*7.35,7.80,1.1],.17,cream,"stone");
    for(let i=0;i<14;i++){
      const yy=.49+i*.48,zz=21-i*1.48;k.post(sx*7.35,yy+.39,zz,.12,.85,cream,"stone");
      if(i%4===0)k.ball(sx*7.35,yy+.98,zz,.25,.27,.25,cream,"stone");
    }
    for(let i=0;i<6;i++){
      const zz=35-i*11;
      tree(k,sx*(17.8+(i%2)*3),0,zz,4.7,r);streetLamp(k,sx*10.5,0,zz);
      k.ball(sx*24,.85,zz,3.1,1.35,3.6,0x728955,"leaf");
    }
    k.at([sx*26,0,-27],null,null,()=>house(k,{w:21,h:9.2,d:10.4,wall:0xe6cc9e,tiles:0x859b91,timber:false,windows:7,detail:false}));block(sx*26,-27,21,10.4);
    for(let j=0;j<3;j++){
      const xx=sx*(15+j*9);k.post(xx,8.0,-34.5,3.13,16,stone,"stone");
      k.ball(xx,16,-34.5,3.58,3.92,3.58,0x839c87,"iron");k.post(xx,20.22,-34.5,.11,1.3,brass);
    }
  }
  k.box(0,9.9,-31,33,12.2,6.8,0xe0c59c,"stone");block(0,-31,33,6.8);
  for(let i=-6;i<=6;i++)for(const yy of [9.3,13.2])windowFrame(k,i*2.40,yy,-27.5,1.3,2.0);
  const gx=0,gz=-12,y=6.72,rx=6.4,len=14,glass=new Surface();
  for(let j=0;j<=10;j++){
    const zz=gz-len/2+j*len/10,points=[];
    for(let i=0;i<=16;i++){
      const a=Math.PI*i/16;points.push([gx+rx*Math.cos(a),y+2.5+rx*.74*Math.sin(a),zz]);
      if(i<16&&j<10){
        const b=Math.PI*(i+1)/16,at=(q,dz)=>[gx+rx*Math.cos(q),y+2.5+rx*.74*Math.sin(q),zz+dz];
        glass.quad(at(a,0),at(b,0),at(b,len/10),at(a,len/10),0xbedaca);
      }
    }
    k.curve(points,.059,0x759083,"iron",19);
    for(const sx of [-1,1])k.post(sx*rx,y+1.25,zz,.073,2.5,0x769483);
  }
  for(let i=0;i<=10;i++){
    const a=Math.PI*i/10,xx=rx*Math.cos(a),yy=y+2.5+rx*.74*Math.sin(a);
    k.line([xx,yy,gz-len/2],[xx,yy,gz+len/2],.048,0x81988b);
  }
  const panes=new T.Mesh(glass.geometry(),new T.MeshStandardMaterial({color:0xc2e3d7,transparent:true,opacity:.21,side:T.DoubleSide,depthWrite:false}));
  root.add(panes);
  for(const sx of [-1,1])for(let i=0;i<5;i++){
    const x=sx*(3.5+r()*1.35),z=-7.1-i*2.4;k.post(x,7.08,z,.50,.72,0xad8563,"paint");palm(k,x,7.39,z,2.4+r()*1.2,r);
  }
  k.at([0,6.73,-14.8],null,null,()=>person(k,"suliman"));k.at([-1.1,6.72,-13.7],null,null,()=>heen(k));
  k.at([-8,0,26.5],null,null,()=>house(k,{w:3.25,d:2.4,h:2.8,wall:stone,tiles:0x849781,windows:2,timber:false}));block(-8,26.5,3.25,2.4);portal(k,-8,27.74);
}
function waterwheel(k){
  for(const x of [-.38,.38])k.put("rim",[x,0,0],[2.09,2.09,2.09],0x72563c,"wood",[0,Math.PI/2,0]);
  for(let j=0;j<14;j++){
    const a=j*TAU/14,y=Math.cos(a)*2.03,z=Math.sin(a)*2.03;
    k.line([0,0,0],[0,y,z],.081,wood,"wood");k.box(0,y,z,1.15,.14,.53,0x90704d,"wood",[a,0,0]);
  }
  k.line([-.88,0,0],[.88,0,0],.19,0x5c5547);
}
function cottage(k,root,block,r,id,geo,anim){
  const memory=id==="memory",x=memory?-1:-6,z=-8.2;
  k.at([x,0,z],null,null,()=>house(k,{w:7.0,d:7,h:3.65,wall:0xe1cda6,tiles:0x9f624a,trim:0x65503e,windows:3}));block(x,z,7,7);portal(k,x,z+3.56);
  const wheel=group(root,x+3.96,1.89,z-1.5),wk=new Kit();waterwheel(wk);wk.finish(wheel);anim.push(t=>{wheel.rotation.x=t*.22;});
  const [wx,wz]=geo.places[id];
  for(let i=0;i<29;i++){
    const xx=-26+r()*52,zz=-21+r()*46;
    if(Math.abs(xx-x)<5.5&&Math.abs(zz-z)<5.5||geo.wet(wx+xx,wz+zz))continue;
    if(i<9&&Math.hypot(xx,zz)>12)tree(k,xx,geo.height(wx+xx,wz+zz)-root.position.y,zz,3.7+r()*4.6,r);
  }
  for(let i=0;i<13;i++){
    const xx=-18+i*2.2,zz=4+1.6*Math.sin(xx*.13);
    if(Math.abs(xx+3)<2.1)continue;
    k.post(xx,.58,zz,.092,1.16,wood,"wood",[0,0,.04*Math.sin(i)]);
    if(i<12&&Math.abs(xx+1)>2.4)for(const yy of [.40,.82])k.line([xx,yy,zz],[xx+2.2,yy,4+1.6*Math.sin((xx+2.2)*.13)],.067,wood,"wood");
  }
  if(memory)k.at([-1.1,0,1.9],[0,-.44,0],null,()=>person(k,"child"));
  else k.at([1.7,0,2.4],[0,-.34,0],null,()=>heen(k));
}
function airship(k,scale){
  k.at([0,0,0],null,[scale,scale,scale],()=>{
    k.ball(0,0,0,2.36,1.81,8.66,0x626f77,"iron");
    for(let j=-3;j<=3;j++){
      const z=j*1.7,f=Math.sqrt(1-(z/8.7)**2);
      k.put("hoop",[0,0,z],[2.37*f,1.82*f,1.4],0x4c5259,"iron");
    }
    k.box(0,-1.72,.3,1.9,1.25,5.7,0x5a5b5b,"iron");
    for(const s of [-1,1]){
      k.ball(s*3.08,-.61,-1.4,2.8,.19,2.3,0x585a67,"iron",[0,s*.52,s*.12]);
      k.ball(s*2.08,.42,-5.8,1.95,.20,2.2,0x68666b,"iron",[0,s*.50,s*.48]);
      for(let i=0;i<6;i++)k.ball(s*.97,-1.72,-1.82+i*.69,.065,.13,.18,0xd8ab6e,"glow");
    }
  });
}
function war(k,root,block,r,anim){
  street(k,root,block,r,"front");
  k.at([-5,0,5.9],null,null,()=>house(k,{w:2.72,d:2.1,h:2.7,wall:0x8f8073,tiles:0x695c58,windows:2}));block(-5,5.9,2.72,2.1);portal(k,-5,7.0);
  for(let i=0;i<4;i++){
    const shipGroup=group(root),kit=new Kit();airship(kit,1.35+i*.34);kit.finish(shipGroup,false);
    anim.push(t=>{shipGroup.position.set(-46+i*30+Math.sin(t*.025+i)*23,31+i*5,-58-i*20+Math.cos(t*.022+i)*13);shipGroup.rotation.y=.64+i*.38;});
  }
  for(let i=0;i<36;i++){
    const x=-47+r()*94,z=-28-r()*45;
    k.ball(x,1.0,z,1.1+r()*3,3+r()*3,1.7,0xc87750,"glow");k.put("cone",[x-.32,5.8,z],[1.2,4.5+r()*4,1.6],0xc17858,"glow");
  }
}
function starRain(root,anim){
  const r=random(9836),n=26,positions=new Float32Array(n*6),seeds=Array.from({length:n},()=>[r()*160-80,r()*63+28,-r()*98-13,r()*11]);
  const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(positions,3));const trails=new T.LineSegments(g,new T.LineBasicMaterial({color:0xbfdaf3,transparent:true,opacity:.86}));trails.frustumCulled=false;root.add(trails);
  anim.push(time=>{
    for(let i=0;i<n;i++){const [x,y,z,offset]=seeds[i],p=(time*.14+offset)%1,xx=x+p*15,yy=y-p*47;positions.set([xx,yy,z,xx-1.65,yy+5.15,z-.34],i*6);}
    g.attributes.position.needsUpdate=true;
  });
}
export function landmarks(geo){
  const root=new T.Group(),districts=new Map(),colliders=[],decks=[],animations=[];
  const wasteKit=new Kit(),home=geo.places.waste;
  wasteKit.at([home[0]+15,geo.height(home[0]+15,home[1]+21),home[1]+21],[0,-.44,0],null,()=>turnip(wasteKit));wasteKit.finish(root);
  for(const [id,p] of Object.entries(geo.places)){
    if(id==="waste")continue;
    const base=geo.height(...p),proxy=new Kit(),r=random(id.length*6621+id.charCodeAt(0));
    if(["market","harbor","front"].includes(id)){
      for(let i=0;i<28;i++){
        const x=(r()-.5)*91,z=(r()-.5)*47,w=4+r()*6,h=5+r()*6,d=3+r()*4;
        proxy.box(x,h*.5,z,w,h,d,pick(r,plaster));proxy.put("spire",[x,h+1.1,z],[w*.71,2.7,d*.73],pick(r,tiles),"paint",[0,.72,0]);
      }
    }else if(id==="palace"){
      proxy.box(0,6,-27,73,12,14,0xddc8a4);for(let i=-2;i<=2;i++)proxy.ball(i*14,13.2,-26,3.8,5.2,3.8,0x819488,"iron");
    }else{proxy.box(-4,1.7,-8,7,3.4,7,0xddcba8);proxy.put("spire",[-4,4.1,-8],[5.4,2.4,5],0xac7656,"paint",[0,.78,0]);}
    const simple=proxy.finish(group(root,p[0],base,p[1]),false);districts.set(id,{id,p,base,simple,full:null});
  }
  function build(d){
    const {id,p,base}=d,full=group(root,p[0],base,p[1]),k=new Kit(),r=random(131*id.charCodeAt(1)),floors=[],anim=[];
    const block=(x,z,w,depth)=>colliders.push([p[0]+x,p[1]+z,w/2,depth/2]);
    if(id==="market"){
      street(k,full,block,r,id);clockTower(k,16.7,-17.5);block(16.7,-17.5,5,5);
      for(let j=-6;j<7;j++){
        const x=j*6.6;k.box(x,4.1,-24,6.64,.72,3.15,0x947e67,"stone");arch(k,x,0,-24,5.44,3.92,2.65,0xa28d71);
      }
      for(const z of [-24.67,-23.32])k.box(0,4.52,z,86,.12,.11,0x5e6058,"iron");
      const loco=group(full,0,4.57,-24),tk=new Kit();train(tk);tk.finish(loco);anim.push(t=>{loco.position.x=23*Math.sin(t*.037);});
    }
    if(id==="harbor")harbor(k,full,block,r,floors);
    if(id==="palace")palace(k,full,block,r,floors);
    if(id==="meadow"||id==="memory")cottage(k,full,block,r,id,geo,anim);
    if(id==="front")war(k,full,block,r,anim);
    if(id==="memory")starRain(full,anim);
    if(k.pennants)k.surface(k.pennants,"cloth");
    k.finish(full);for(const [x,z,w,h,y] of floors)decks.push([p[0]+x,p[1]+z,w/2,h/2,base+y]);
    animations.push({full,anim});d.full=full;
  }
  function activate(x,z){
    for(const d of districts.values()){
      const near=Math.hypot(x-d.p[0],z-d.p[1])<161;
      if(near&&!d.full)build(d);
      if(d.full)d.full.visible=near;d.simple.visible=!near;
    }
  }
  function prepare(id){
    const d=districts.get(id);
    if(!d.full){build(d);d.full.visible=false;}
    return d.full;
  }
  function ground(x,z){
    let h=geo.height(x,z);
    const [px,pz]=geo.places.palace,dx=x-px,dz=z-pz;
    if(Math.abs(dx)<6.96&&dz>=.60&&dz<=21.40)h=Math.max(h,22+.24*clamp(1+Math.floor((21.38-dz)/.73),1,28));
    for(const [cx,cz,rx,rz,y] of decks)if(Math.abs(x-cx)<=rx&&Math.abs(z-cz)<=rz)h=Math.max(h,y);
    return h;
  }
  function blocked(x,z,rad){
    if(Math.abs(x)>geo.extent-15||Math.abs(z)>geo.extent-15)return true;
    if(geo.wet(x,z)&&ground(x,z)<=geo.height(x,z)+.20)return true;
    return colliders.some(([cx,cz,rx,rz])=>Math.abs(x-cx)<rx+rad&&Math.abs(z-cz)<rz+rad);
  }
  function arrival(id){const [x,z]=geo.places[id],[dx,dz,yaw]=arrivals[id];return {x:x+dx,z:z+dz,yaw};}
  function door(id){const [x,z]=geo.places[id],[dx,dz]=doorLocal[id];return [x+dx,z+dz];}
  return {root,activate,prepare,ground,blocked,arrival,door,update(t){for(const a of animations)if(a.full.visible)for(const fn of a.anim)fn(t);}};
}
