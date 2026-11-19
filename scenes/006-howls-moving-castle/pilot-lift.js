import {T, Kit, group, clamp, mix} from "./atelier.js";

// A steam winch lowers the pilot and the control stand together. The fixed
// davits cantilever out from the stern and the cage hangs level on two falls.
export function pilotLift(rig,scale){
  const x=-4.38,z=-8.45,raised=5.72,top=7.56;
  const mount=group(rig,x,0,z),cage=group(mount,0,raised,0);
  const iron=0x46576a,brass=0xd9ac67,enamel=0x758b99,wood=0xc3a079;
  const fixed=new Kit(),deck=new Kit();
  for(const side of [-1,1]){
    const px=side*.65;
    fixed.line([px+.55,5.89,2.88],[px,top,.04],.11,iron,"iron","box");
    fixed.line([px+.55,4.71,2.70],[px,top-.12,.04],.081,enamel,"iron","box");
    fixed.post(px,top,.04,.18,.13,brass,"brass",[0,0,Math.PI/2]);
    deck.post(px,.34,.06,.041,.70,iron);
    deck.line([px,.66,.06],[px,.47,.51],.035,brass,"brass");
    deck.post(px,.22,.51,.035,.47,iron);
  }
  fixed.line([-.78,top,.04],[.78,top,.04],.059,iron,"iron");fixed.finish(mount);
  deck.box(0,-.095,0,1.55,.16,1.41,iron,"iron");
  for(let i=0;i<7;i++)deck.box(-.65+i*.217,-.008,0,.201,.043,1.35,wood,"wood");
  // Both the throttle linkage and the rim sit ahead of the operator.
  deck.box(0,.19,-.33,.50,.38,.19,enamel,"paint");
  deck.line([0,.25,-.33],[0,.49,-.22],.071,brass,"brass");
  deck.finish(cage);
  const hub=group(cage,0,.52,-.20),rim=new Kit();
  rim.put("rim",[0,0,0],[.164,.164,.24],brass,"brass");
  for(let j=0;j<4;j++)rim.box(0,0,0,.020,.324,.027,iron,"iron",[0,0,j*Math.PI/4]);
  rim.ball(0,0,.012,.045,.045,.030,brass,"brass");rim.finish(hub);
  const fallKit=new Kit();fallKit.post(0,.5,0,.017,1,iron);
  const falls=[fallKit.finish(),null];falls[1]=falls[0].clone();mount.add(...falls);
  const world=new T.Vector3(),local=new T.Vector3();
  let travel=0,want=0,level=raised,steer=0;
  function update(dt,terrain,steering){
    mount.getWorldPosition(world);
    const low=(terrain(world.x,world.z)-world.y)/scale+.08;
    travel+=clamp(want-travel,-dt/3.65,dt/3.65);
    const s=travel*travel*(3-2*travel);
    level=mix(raised,low,s);cage.position.y=level;
    steer=mix(steer,steering,1-Math.exp(-5*dt));hub.rotation.z=steer*.98;
    falls.forEach((fall,i)=>{fall.position.set(i?.65:-.65,level+.66,.04);fall.scale.y=top-level-.66;});
  }
  function station(out=new T.Vector3()){return cage.localToWorld(out.set(0,.015,.002));}
  function grip(side,out){return hub.localToWorld(out.set(side*.144,.071,.022));}
  function floorAt(wx,wz){
    if(travel<.999)return null;
    local.set(wx,cage.getWorldPosition(world).y,wz);cage.worldToLocal(local);
    return Math.abs(local.x)<.74&&Math.abs(local.z)<.68?station(world).y:null;
  }
  return {update,station,grip,floorAt,lower(){want=1;},raise(){want=0;},
    get bottom(){return travel>=1;},get moving(){return want!==travel;}};
}
