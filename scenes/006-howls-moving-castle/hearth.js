import {celMaterial} from "./cel.js";
import {T,TAU,Kit,Surface,lathe,random,pick,tint,group,clamp,mix} from "./atelier.js";
import {arch,windowFrame} from "./buildings.js";
import {calciferModel} from "./figures.js";

const oak=0x72523c,dark=0x443e35,gold=0xb38d4d,pots=[0xb58a59,0x8c6858,0x7f8d77,0x788d8d,0xb2a06e];
const bottle=lathe("potion",[[0,0],[.78,.02],[.92,.22],[.88,.53],[.50,.68],[.32,.73],[.32,.93],[.42,.94],[.42,1.01],[.28,1.04]],18);
const pot=lathe("pot",[[.52,0],[.82,.1],[1,.53],[.98,.79],[.79,.98],[.74,1.06],[.80,1.11],[.64,1.11],[.64,1.01]],21);
const bowl=lathe("bowl",[[.38,0],[.65,.10],[1,.58],[1,.68],[.89,.69],[.63,.31],[.22,.16]],23);
function legs(k,x,z,w,d,h,col){
  for(const sx of [-1,1])for(const sz of [-1,1])k.post(x+sx*(w*.5-.10),h*.5,z+sz*(d*.5-.10),.061,h,col,"wood");
}
function planks(k,x,y,z,w,d,r){
  const rows=Math.ceil(d/.42),rowD=d/rows;
  for(let j=0;j<rows;j++){
    const zz=z-d/2+(j+.5)*rowD;let end=-w/2;
    while(end<w/2-.015){
      const extent=Math.min(w/2-end,1.8+r()*2.9),xx=x+end+extent/2;
      k.box(xx,y,zz,extent-.011,.105,rowD-.009,pick(r,[0xa57b55,0xa47b55,0x9c7552,0xab825b]),"wood");end+=extent;
    }
  }
}
function chair(k,x,z,angle=0){
  k.at([x,0,z],[0,angle,0],null,()=>{
    legs(k,0,0,.64,.64,.47,oak);k.box(0,.48,0,.67,.11,.66,0xa0845c,"wood");
    for(const s of [-1,1])k.post(s*.265,.89,-.25,.046,.78,oak,"wood");
    for(let j=0;j<3;j++)k.box(0,.82+j*.17,-.25,.57,.08,.067,0x947455,"wood");
  });
}
function counter(k,x,z,w){
  k.box(x,.50,z,w,.98,.87,0x647f88,"wood");k.box(x,1.035,z,w+.09,.13,.96,0x927351,"wood");
  for(let j=0;j<Math.ceil(w/.68);j++){
    const xx=x-w*.5+(j+.5)*w/Math.ceil(w/.68);
    k.box(xx,.48,z+.46,w/Math.ceil(w/.68)-.06,.75,.045,0x96a6a4,"wood");
    k.ball(xx+.13,.76,z+.51,.04,.04,.03,gold,"brass");
  }
}
function bottles(k,x,y,z,n,r){
  for(let j=0;j<n;j++){
    const sc=.104+r()*.103,h=.22+r()*.24,xx=x+j*.38;
    k.put(bottle,[xx,y,z+(r()-.5)*.1],[sc,h,sc],pick(r,pots),r()>.5?"glass":"paint");
    if(r()>.28)k.post(xx,y+h*.61,z,sc*.89,h*.19,0xd9c99c,"cloth");
  }
}
function fireplace(k){
  const x=-1.97,z=-3.72;
  k.box(x,.20,z+.14,3.73,.38,1.57,0x827563,"stone");
  k.box(x,1.16,z-.02,2.89,1.64,.43,0x373832,"stone");
  for(const s of [-1,1]){
    k.box(x+s*1.57,1.02,z+.03,.37,1.56,.98,0x74695a,"stone");
    for(let i=0;i<4;i++)k.box(x+s*1.59,.53+i*.33,z+.53,.42,.285,.145,i%2?0x91816d:0xa29078,"stone");
  }
  arch(k,x,.32,z+.45,2.76,1.83,.46,0x8d7e68);
  const hood=lathe("hearth-hood",[[1,0],[1,.085],[.91,.14],[.65,.46],[.47,.78],[.37,1]],34);
  k.put(hood,[x,2.03,z-.10],[1.93,1.38,.91],0x3c4a59,"iron");k.box(x,2.04,z+.21,3.63,.14,.86,0x665646,"iron");
  k.post(x,3.38,z-.24,.68,1.11,0x52564e);
  k.line([x-1.34,1.94,z+.74],[x+1.34,1.94,z+.74],.042,0x68563d);
  for(const [dx,l] of [[-.98,.57],[.77,.45],[1.10,.62]]){
    k.line([x+dx,1.92,z+.74],[x+dx,1.92-l,z+.74],.024,gold,"brass");
    k.ball(x+dx,1.84-l,z+.74,.10,.13,.04,dx<0?0xad8052:0x797b65,"brass");
  }
  for(let i=0;i<6;i++)k.line([x-1.1+i*.37,.40,z+.61],[x-.78+i*.37,.51,z+.01],.115,i%2?0x574234:0x684634,"wood");
  k.put(bowl,[x+.78,.69,z+.45],[.42,.18,.37],0x484b43,"iron");
  k.line([x+1.04,.76,z+.48],[x+1.54,.84,z+.65],.05,0x5d4b37,"wood");
  for(const dx of [.64,.89]){
    k.ball(x+dx,.755,z+.47,.13,.028,.10,0xeae1be);
    k.ball(x+dx,.784,z+.47,.053,.025,.050,0xe2a547);
  }
}
function dining(k,r){
  const x=.21,z=.86;
  legs(k,x,z,2.72,1.32,.87,oak);k.box(x,.93,z,2.86,.14,1.39,0x9b7851,"wood");
  k.box(x-.53,1.01,z,.68,.028,1.44,0xc5b88a,"cloth");
  for(const [xx,zz] of [[-.77,1.11],[.83,.65]]){
    k.post(xx,1.041,zz,.227,.047,0xd3d3b8,"paint");k.ball(xx,1.087,zz,.136,.035,.12,0xe9d59c);
    k.put(bowl,[xx+.27,1.02,zz+.065],[.084,.18,.084],0x9aada3);
  }
  k.put(pot,[.02,1.01,.48],[.19,.32,.19],0xa57a4c,"brass");
  k.ball(-.15,1.15,.48,.125,.052,.057,0xa27c4c,"brass");
  k.put("rim",[.19,1.18,.48],[.12,.12,.12],gold,"brass");
  for(let j=0;j<3;j++)k.ball(.21+j*.19,1.09,1.16,.145,.09,.14,0xc09663);
  chair(k,-.65,-.31,Math.PI);chair(k,1.0,1.99,0);chair(k,-1.62,.85,Math.PI/2);
}
function bedchamber(k,r){
  const y=3.52;
  k.at([0,y,0],null,null,()=>{
    k.box(.34,.011,-.92,4.55,.047,3.65,0x9e6c59,"cloth");
    k.box(.34,.04,-.92,4.25,.028,3.39,0x9f8564,"cloth");
    for(let i=0;i<6;i++)k.box(-1.30+i*.62,.068,-.92,.15,.025,2.95,0x9b695c,"cloth",[0,.27,0]);
    const bx=2.69,bz=-1.76;
    k.box(bx,.42,bz,2.42,.48,3.62,0x92764a,"wood");k.box(bx,.73,bz,2.30,.33,3.44,0xd3bda0,"cloth");
    k.box(bx,.96,bz+.55,2.35,.18,2.24,0xb76f72,"cloth");
    for(let j=0;j<8;j++)k.box(bx-1+j*.286,1.055,bz+.52,.056,.021,2.17,0xd4ad77,"cloth");
    k.ball(bx,.99,bz-1.00,.85,.18,.39,0xe6d2ad,"cloth");
    for(const dx of [-1,1])for(const dz of [-1,1]){
      k.post(bx+dx*1.19,1.34,bz+dz*1.73,.071,2.55,gold,"brass");
      k.ball(bx+dx*1.19,2.68,bz+dz*1.73,.14,.20,.14,gold,"brass");
    }
    k.box(bx,2.57,bz-1.73,2.48,.13,.18,gold,"brass");
    for(let i=0;i<55;i++){
      const x=-2.7+r()*6.95,z=-3.76+r()*.87,len=.22+r()*.86;
      k.line([x,2.90,z],[x,2.90-len,z],.012,0x9d8b58,"brass");
      k.put("pebble",[x,2.85-len,z],[.069,.134,.069],pick(r,[0x7eaaa4,0x72688f,0xb7905d,0xb17579]),"glass");
    }
    for(let i=0;i<3;i++){
      k.box(-2.31,.61+i*.59,-3.83,1.69,.093,.52,oak,"wood");bottles(k,-2.98,.68+i*.59,-3.73,4,r);
    }
    // Enamel tub and copper wash fittings across the landing.
    k.put(pot,[2.92,.12,2.77],[1.06,.69,.57],0xb2c5b4,"paint");
    k.ball(2.92,.77,2.77,.74,.045,.39,0x839e9c,"glass");
    k.curve([[3.84,.50,2.94],[3.85,1.04,2.94],[3.61,1.06,2.94],[3.56,.94,2.94]],.041,gold,"brass");
    k.box(1.27,1.32,2.90,.10,2.58,1.96,0xaba27b,"wood");
    k.box(1.24,1.64,2.44,.13,1.20,.57,0xc2bca5,"cloth");
  });
}
export const oldDoors=["waste","harbor","palace","front"];
export const newDoors=["waste","market","meadow","front"];
export function hearthRoom(design){
  const scene=new T.Scene();scene.background=new T.Color(0x655748);
  const k=new Kit(),r=random(416),w=design.kitchenWidthM,d=design.kitchenDepthM,top=6.74;
  planks(k,0,-.056,0,w,d,r);
  planks(k,.97,3.46,0,w-1.94,d,r);planks(k,-4.24,3.46,-3.69,1.98,1.24,r);
  k.box(-w*.5-.06,top*.5,0,.16,top,d+.24,0xd4c4a9);
  for(const [a,b] of [[-d/2-.12,-1.48],[.045,d/2+.12]])k.box(w*.5+.06,top*.5,(a+b)*.5,.16,top,b-a,0xb5aa83);
  k.box(w*.5+.06,(top+2.48)/2,-.72,.16,top-2.48,1.54,0xb5aa83);
  for(const sz of [-1,1])k.box(0,top*.5,sz*(d*.5+.06),w+.2,top,.18,0xd7c59f);
  k.box(0,top,0,w+.3,.23,d+.3,0x887056,"wood");
  for(const y of [.24,3.26,3.74,6.49]){
    for(const sz of [-1,1])k.box(0,y,sz*(d*.5-.025),w,.17,.13,oak,"wood");
    for(const sx of [-1,1])k.box(sx*(w*.5-.045),y,0,.13,.19,d,oak,"wood");
  }
  for(let i=-2;i<=2;i++){
    for(const sz of [-1,1])k.box(i*2.09,3.4,sz*(d*.5-.06),.18,6.8,.17,oak,"wood");
    k.box(i*2.09,6.46,0,.19,.28,d,oak,"wood");
  }
  for(let i=-1;i<=1;i++)k.box(.96,3.28,i*2.63,w-1.98,.23,.18,0x685443,"wood");
  for(const yy of [1.80,5.23]){
    k.at([-5.07,0,.62],[0,Math.PI/2,0],null,()=>windowFrame(k,0,yy,0,1.62,1.41,false,0xb2bc9f));
    k.at([.18,0,4.18],[0,Math.PI,0],null,()=>windowFrame(k,0,yy,0,2.05,1.40,false,0xc5cbb1));
  }
  fireplace(k);dining(k,r);counter(k,2.50,-3.71,3.7);
  // The two boards of the hand bellows hinge about its brass air nozzle.
  const bellows=group(scene,-2.74,.86,-3.29),boards=new Kit(),leather=new Kit();
  k.line([-2.74,.86,-3.28],[-2.44,.53,-3.61],.065,gold,"brass");
  k.box(-2.74,.82,-3.06,.34,.07,.55,oak,"wood");
  k.line([-2.74,.4,-3.17],[-2.74,.82,-3.09],.075,dark,"iron");
  for(let i=0;i<3;i++)leather.box(0,.042+i*.045,.25,.33-i*.014,.055,.44,0x875d47,"wood");
  const folds=leather.finish();bellows.add(folds);
  const lid=group(bellows),pumpHandle=group(lid,0,0,.54);
  boards.box(0,0,.24,.35,.065,.48,oak,"wood");
  boards.line([0,0,.42],[0,0,.54],.032,gold,"brass");
  boards.line([-.12,0,.54],[.12,0,.54],.040,0xba8956,"wood","rod");boards.finish(lid);
  k.put(bowl,[2.75,1.12,-3.64],[.53,.32,.37],0xa5b3a5,"paint");
  k.curve([[3.29,1.12,-3.89],[3.29,1.51,-3.89],[2.98,1.54,-3.89],[2.96,1.41,-3.89]],.034,gold,"brass");
  for(let j=0;j<2;j++){
    k.box(2.25,1.88+j*.63,-4.03,4.15,.10,.43,oak,"wood");
    bottles(k,.44,1.945+j*.63,-3.97,10,r);
  }
  for(let j=0;j<5;j++)k.put(pot,[.98+j*.48,1.09,-3.72],[.13,.24+r()*.09,.13],pick(r,pots),"brass");
  for(const sx of [-1,1])k.box(sx*3.68,2.63,4.03,2.34,.095,.4,0x8d6d4e,"wood");
  for(let i=0;i<17;i++){
    const z=2.92-i*.357,h=(i+1)*3.5/17;
    k.box(-4.25,h-.102,z,1.57,.20,.39,0x977754,"wood");
    if(i%2===0)k.post(-3.49,h+.39,z,.043,.81,oak,"wood");
  }
  k.line([-3.49,1.03,2.97],[-3.49,4.33,-2.86],.064,oak,"wood");
  for(let i=0;i<8;i++)k.post(-3.27,3.94,-2.73+i*.79,.039,.82,oak,"wood");
  k.line([-3.27,4.34,-2.75],[-3.27,4.34,2.85],.055,oak,"wood");
  bedchamber(k,r);
  const door=group(scene,5.04,0,-.72);door.rotation.y=-Math.PI/2;
  const jamb=new Kit();
  for(const side of [-1,1])jamb.box(side*.77,1.24,-.02,.14,2.48,.34,0x67503a,"wood");
  jamb.box(0,2.48,-.015,1.70,.16,.35,0x72553b,"wood");jamb.box(0,.046,0,1.54,.09,.37,0x8a7453,"wood");jamb.finish(door);
  const leaf=group(door,-.69,0,.08),dk=new Kit();dk.box(.68,1.22,.025,1.36,2.34,.11,0x62725a,"wood");
  for(const yy of [.53,1.62]){
    dk.box(.68,yy,.09,1.09,.84,.052,0x58654e,"wood");dk.box(.68,yy,.127,.94,.69,.045,0x7c8465,"wood");
  }
  for(const yy of [.43,1.97]){dk.box(.09,yy,.13,.28,.073,.07,0x695c46,"iron");dk.post(.025,yy,.141,.043,.20,0xae935e,"brass");}
  dk.box(1.20,1.05,.145,.14,.32,.043,0xb29662,"brass");dk.ball(1.20,1.08,.217,.084,.084,.080,0xc6a66b,"brass");
  dk.line([1.20,1.08,.22],[1.20,1.08,.32],.035,gold,"brass");
  dk.line([1.20,1.08,.32],[1.345,1.08,.32],.043,0xc6a66b,"brass","rod");dk.finish(leaf);
  const latch=group(leaf,1.31,1.08,.32);
  const reveal=new T.Mesh(new T.PlaneGeometry(1.48,2.37),new T.MeshBasicMaterial({color:0xb9cec0,side:T.DoubleSide}));
  reveal.position.set(0,1.24,-.17);door.add(reveal);
  const disk=group(door,-1.11,2.04,.18),dial=new T.Group();disk.add(dial);
  const frame=new Kit();frame.put("rim",[0,0,.007],[.386,.386,.48],gold,"brass");frame.put("cone",[0,.462,.065],[.066,.13,.042],gold,"brass",[0,0,Math.PI]);frame.finish(disk);
  const quadrants=[];
  for(let i=0;i<4;i++){
    const mat=celMaterial({color:0xffffff,side:T.DoubleSide},"satin");
    const wedge=new T.Mesh(new T.CircleGeometry(.356,16,Math.PI/4+Math.PI*i/2,Math.PI/2),mat);
    wedge.position.z=.024;dial.add(wedge);quadrants.push(wedge);
  }
  const pin=new Kit();pin.ball(0,0,.078,.065,.065,.047,gold,"brass");pin.finish(disk);
  const fingerKnob=group(dial,0,-.277,.100),knob=new Kit();
  knob.ball(0,0,0,.053,.053,.066,0xd5b273,"brass");knob.finish(fingerKnob);
  k.finish(scene);
  const calc=calciferModel();calc.position.set(-1.99,.445,-3.29);scene.add(calc);
  const fill=new T.HemisphereLight(0xd2d2bd,0x97816b,.98);scene.add(fill);
  const fire=new T.PointLight(0xffa05a,14,7.7,1.72);fire.position.set(-1.95,1.12,-2.93);scene.add(fire);
  const windowLight=new T.PointLight(0xe1e8d6,12,10,1.85);windowLight.position.set(.12,2.53,3.05);scene.add(windowLight);
  const upLight=new T.PointLight(0xffdfb0,19,12,1.75);upLight.position.set(-.50,5.76,1.15);scene.add(upLight);
  const casement=new T.SpotLight(0xffe3b5,68,12,.68,.33,1.8);
  casement.position.set(-4.84,2.30,.61);casement.target.position.set(.95,.22,-.35);
  casement.castShadow=true;casement.shadow.autoUpdate=false;casement.shadow.needsUpdate=true;casement.shadow.mapSize.set(512,512);casement.shadow.bias=-.00065;casement.shadow.normalBias=.026;
  scene.add(casement,casement.target);
  let angle=0,target=0,slot=0,later=false,flare=0;
  function doorOpening(f,texture){
    const next=-1.42*smoothDoor(f);
    if(leaf.rotation.y!==next)casement.shadow.needsUpdate=true;
    leaf.rotation.y=next;
    if(texture&&reveal.material.map!==texture){reveal.material.map=texture;reveal.material.color.set(0xffffff);reveal.material.needsUpdate=true;}
  }
  function smoothDoor(f){return f*f*(3-2*f);}
  function colorDial(){
    const colors=later?[0x708454,0xd5ad55,0xc47d92,0x363b42]:[0x708454,0x6788aa,0xab5547,0x363b42];
    quadrants.forEach((w,i)=>w.material.color.set(colors[i]));
  }
  function select(i){slot=(i+4)%4;const next=-slot*Math.PI/2;target=next+Math.round((target-next)/TAU)*TAU;}
  function turn(){slot=(slot+1)%4;target-=Math.PI/2;}
  function chapter(value=!later){later=value;colorDial();}
  function floor(x,z,previous){
    if(x < -3.33 && z>-3.13 && z<3.15)return clamp((1+Math.floor((3.10-z)/.357))*3.5/17,0,3.50);
    if(previous>2.90)return 3.50;
    return 0;
  }
  const furniture=[[.21,.86,1.52,.78],[-1.97,-3.78,1.86,.83],[2.50,-3.71,1.93,.57],[-.65,-.31,.46,.45],[1,1.99,.46,.45],[-1.62,.85,.46,.45]];
  function leafClear(x,z,y,angle,radius){
    if(y>=1||x<3.02||z< -1.79||z>.25)return true;
    const px=x-4.96,pz=z+1.41,s=Math.sin(angle),c=Math.cos(angle);
    const along=clamp(px*s+pz*c,0,1.36);
    return Math.hypot(px-along*s,pz-along*c)>=radius;
  }
  function doorClear(x,z,y,amount){return leafClear(x,z,y,-1.42*smoothDoor(amount),.255);}
  function canWalk(x,z,y,doorOpen=false){
    const inDoor=doorOpen&&y<1&&Math.abs(z+.72)<.47&&x>0&&x<w/2+.25;
    if((Math.abs(x)>w/2-.25&&!inDoor)||Math.abs(z)>d/2-.25)return false;
    if(!leafClear(x,z,y,leaf.rotation.y,.235))return false;
    if(x>=-3.5&&x<-3.14&&z> -3.01&&z<2.96)return false;
    if(y<2.85)return !furniture.some(([xx,zz,rx,rz])=>Math.abs(x-xx)<rx&&Math.abs(z-zz)<rz);
    if(x>1.44&&x<3.95&&z>-3.66&&z<.08)return false;
    return !(x>1.1&&x<1.49&&z>1.74);
  }
  function update(t,dt){
    angle=mix(angle,target,1-Math.exp(-dt*13));dial.rotation.z=angle;flare=Math.max(0,flare-dt*.47);
    const flick=1+Math.sin(t*7.9)*.042+Math.sin(t*13.7)*.029;
    calc.scale.set(1+flare*.27,(1+flare*.60)*flick,1);calc.rotation.z=.041*Math.sin(t*3.2);
    fire.intensity=(13.1+flare*10)*flick;
    const compression=flare>.52?Math.sin((1-flare)/.48*Math.PI):0;
    lid.rotation.x=-.35+compression*.29;folds.scale.y=1-compression*.78;
  }
  colorDial();
  return {scene,update,turn,select,chapter,floor,canWalk,doorClear,doorOpening,handles:{bellows:pumpHandle,dial:fingerKnob,door:latch},
    stoke(){flare=1;},get flare(){return flare;},get later(){return later;},get slot(){return slot;},get destination(){return(later?newDoors:oldDoors)[slot];}};
}
